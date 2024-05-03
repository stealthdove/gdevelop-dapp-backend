import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";

export const getHardware = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const hardwareData = await prisma.hardware.findMany({
        select: {
          sku: true,
          name: true
        },
      });
      
      res.status(200).json(hardwareData) as Response;
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
