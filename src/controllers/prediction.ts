import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";
import { runModel } from "../utils/prediction";

export const prediction = asyncHandler(
  async (req: Request, res: Response) => {
    let predictionStatus;
    try {
      const { id } =  req.user;
      // const user = await prisma.user.findUnique({
      //   where: {
      //     id
      //   }
      // })
      // if (!user) {
      //   return res.status(400).json({ error: 'User not found' });
      // }
      // if (user.balance < minimalBalance) {
      //   return res.status(400).json({ error: 'Not sufficient balance' });
      // }

      const { model, input } = req.body;

      const own_model = await prisma.model.update({
        where: {
          name: model,
        },
        data: {
          run_count: {
            increment: 1, // increment the run count by 1
          },
        }
      })
  
      if(!own_model) {
        return {status: 400, data: {message: 'Invalid model name'}};
      }
  
      const replicate_model = await prisma.modelR.findFirst({
        where: {
          url: own_model.replicate_link
        }
      })

      if(!replicate_model) {
        return {status: 400, data: {message: 'Invalid model name'}};
      }

      predictionStatus = await prisma.predictionStatus.create({
        data: {}
      })
      res.status(200).json(predictionStatus) as Response;

      const model_name = `${(replicate_model.default_example as any)['model']}:${(replicate_model.latest_version as any)['id']}`;

      const {output, issuedTime, issuedBalance} = await runModel(model_name, input);

      // await prisma.user.update({
      //   where: {
      //     id
      //   },
      //   data: {
      //     balance: user.balance - issuedBalance
      //   }
      // })

      const predictionResult = await prisma.prediction.create({
        data: {
          input,
          output,
          time: issuedTime,
          cost: issuedBalance,
          user: { connect: { id } },
          model: { connect: { id: own_model.id } },
        },
        select: {
          id: true,
        }
      })

      await prisma.predictionStatus.update({
        where: {
          id: predictionStatus.id,
        },
        data: {
          status: "success",
          prediction_id: predictionResult.id,
        }
      })

    } catch (error) {
      if (!predictionStatus) {
        return res.status(400).json(false) as Response;
      }
      await prisma.predictionStatus.update({
        where: {
          id: predictionStatus.id,
        },
        data: {
          status: "faild",
          message: (error as Error).message
        }
      });
    }
  }
);

export const getPredictionStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } =  req.params;

      const predictionStatus = await prisma.predictionStatus.findUnique({
        where: {
          id: Number(id)
        }
      })

      if (predictionStatus?.status !== "pending") {
        await prisma.predictionStatus.delete({
          where: {
            id: predictionStatus?.id
          }
        })
      }

      res.status(200).json(predictionStatus) as Response;

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

export const getPredictionResult = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } =  req.params;

      const predictionResult = await prisma.prediction.findUnique({
        where: {
          id: Number(id)
        },
        select: {
          input: true,
          output: true,
          time: true,
          cost: true,
        }
      })

      if(!predictionResult) return res.status(400).json(false) as Response;

      res.status(200).json(predictionResult) as Response;

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

export const getPredcitionHistory = asyncHandler(
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

      const history = await prisma.prediction.findMany({
        where: {
          user_id: id
        },
        select: {
          input: true,
          output: true,
          cost: true,
          model: true
        }
      });
      
      res.status(200).json(history) as Response;

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