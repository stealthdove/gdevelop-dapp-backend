import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";

export const createPrompt = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;
      const data = req.body;

      const prompt = await prisma.prompt.create({
        data: {
            ...data,
            user: { connect: { id } }
        }
      })

      res.status(200).json(prompt) as Response;

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

export const promptList = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const prompts = await prisma.prompt.findMany({
        where: {
          user_id: id,
        }
      });

      res.status(200).json(prompts) as Response;

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

export const deletePrompt = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const promptId = parseInt(req.params.prompt_id);

      await prisma.prompt.delete({
        where: {
          id: promptId,
          user_id: id,
        },
      });

      res.status(200).json(true) as Response;

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
  
export const save = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const promptId = parseInt(req.params.prompt_id);
      const data = req.body;
      const prompt = await prisma.prompt.update({
        where: {
          id: promptId,
          user_id: id
        },
        data
      })

      res.status(200).json(prompt) as Response;

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

export const publish = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const promptId = parseInt(req.params.prompt_id);
      const data = req.body;
      const prompt = await prisma.prompt.update({
        where: {
          id: promptId,
          user_id: id
        },
        data:{
          ...data,
          status: true,
        }
      })

      res.status(200).json(prompt) as Response;

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

export const get = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const promptId = parseInt(req.params.prompt_id);
      const prompt =  await prisma.prompt.findUnique({
        where:{
          id: promptId,
          user_id: id
        }
      })
      
      res.status(200).json(prompt) as Response;

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

export const run = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.user;

      const promptId = parseInt(req.params.prompt_id);
      const prompt =  await prisma.prompt.findUnique({
        where:{
          id: promptId,
          user_id: id,
          status: true
        }
      })

      if(!prompt) return res.status(400).json('Prompt Not Found or not available to run.') as Response;

      const { input } = req.body;

      res.status(200).json(input) as Response;
      
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