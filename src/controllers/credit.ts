import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";
import { minimalChargeAmount } from "../const";
import { generateRandomString } from "../utils";

export const genInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const { amount } = req.body;

      if (amount < minimalChargeAmount) {
        return res.status(400).json(
          {
            message: `Amount should be greater than ${minimalChargeAmount}`,
          },
        )
      }

      const verifier = generateRandomString()
      const successUrl = `${req.protocol}://${req.headers['host']}/api/credit/success?verifier=${verifier}`

      const data = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": String(process.env.NOW_PAYMENTS_API_KEY),
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          pay_currency: "eth",
          success_url: successUrl,
        }),
      })
      .then((res) => res.json())
      .catch((e) => console.log("error making charge:", e))

      const payment = await fetch("https://api.nowpayments.io/v1/invoice-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": String(process.env.NOW_PAYMENTS_API_KEY),
          },
          body: JSON.stringify({
            iid: data.id,
            pay_currency: "eth",
          }),
        },
      )
      .then((res) => res.json())
      .catch((e) => console.log("error making charge:", e))

      if (payment.statusCode !== undefined && payment.statusCode !== 200) {
        return res.status(400).json({ payment, status: payment.statusCode })
      }

      const { payment_id } = payment

      await prisma.txVerifier.create({
        data: {
          verifier,
          tx: {
            userId: id,
            amount,
            tx: payment_id,
          },
        },
      })

      return res.status(200).json({
        message: "Charge created",
        tx: payment_id,
        url: `${data.invoice_url}&paymentId=${payment_id}`,
      }) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
)

export const confirmSuccess = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { verifier } = req.query as any;

      const txInfo = await prisma.txVerifier.findFirst({
        where: {
          verifier,
        },
      })

      if (!txInfo) {
        return res.status(400).json({ message: "Charge not made", status: 401 })
      }

      await prisma.txVerifier.delete({
        where: {
          verifier,
        },
      })

      const { userId, amount, tx } = txInfo.tx as any;

      const credit = Number(amount)

      await prisma.credit.create({
        data: {
          user_id: Number(userId),
          credit,
          tx: String(tx),
        },
      })

      const user = await prisma.user.findFirst({
        where: {
          id: Number(userId),
        },
      })

      await prisma.user.update({
        data: {
          balance: user!.balance + credit,
        },
        where: {
          id: Number(userId),
        },
      })

      res.status(200).json({ success: true, message: "Success!" })
    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
)

export const billingHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;
      const user = await prisma.user.findUnique({
        where: {
          id
        }
      })
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const creditHistory = (await prisma.credit.findMany({
        where: {
          user_id: id
        },
        select: {
          credit: true,
          created_at: true,
        }
      })).map(value => ({
        ...value,
        cost: value.credit,
        type: "Top up"
      }));

      const predictionHistory = (await prisma.prediction.findMany({
        where: {
          user_id: id
        },
        select: {
          cost: true,
          created_at: true,
          model: {
            select: {
              name: true
            }
          }
        },
      })).map(value => ({
        ...value,
        type: value.model.name
      }));
      
      let total_spent = 0;
      for (const entry of predictionHistory) {
        total_spent += entry.cost;
      }
      
      const history = [
        ...creditHistory.map(h => ({cost: h.cost, type: h.type, created_at: h.created_at})),
        ...predictionHistory.map(h => ({cost: h.cost, type: h.type, created_at: h.created_at}))
      ]
      res.status(200).json({total_spent, history}) as Response;

    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  } 
)