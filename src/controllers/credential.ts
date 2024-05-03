import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { apiKeyGen } from "../utils";
import { prisma } from "../utils/prisma";

export const generateApiKey = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id, role } = req.user;
      const { keyName } = req.body;

      const apiKey = apiKeyGen(JSON.stringify({id, role, keyName}));

      const existingApiKey = await prisma.apiKey.findFirst({
        where: {
          name: keyName,
          user_id: id
        }
      });
      
      if (existingApiKey) {
        // Update the existing API key
        await prisma.apiKey.update({
          where: {
            id: existingApiKey.id
          },
          data: {
            key: apiKey // Update the API key
          }
        });
      } else {
        // Create a new API key
        await prisma.apiKey.create({
          data: {
            name: keyName,
            key: apiKey,
            user: {
              connect: { id } // Associate the API key with the user
            }
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          keyName,
          apiKey
        }
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
);

export const getApiKeys = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const apis = await prisma.apiKey.findMany({
        where: {
          user_id: id
        },
        select: {
          name: true,
          key: true
        }
      });

      res.status(200).json(apis) as Response;

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

export const getUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const user = await prisma.user.findUnique({
        where: {
          id
        },
      });

      res.status(200).json(user) as Response;

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