import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";

export const getCollections = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const collectionData = await prisma.collection.findMany()

      res.status(200).json(collectionData) as Response;
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

export const getCollection = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const collection_slug = req.params.collection_slug;
      
      const collectionData = await prisma.collection.findFirst({
        where: {
          slug: collection_slug
        }
      });
      
      if (!collectionData) {
        return res.status(400).json({ error: "Invalid collection slug." }) as Response;
      }
      
      const models = await prisma.model.findMany({
        where: {
          collection_id: {
            has: collectionData.id
          }
        },
        // skip: OFFSET_VALUE,
        // take: LIMIT_VALUE
      });

      res.status(200).json({...collectionData, models}) as Response;
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

/* ------------------
*  Admin Privilege  *
------------------ */

export const addCollection = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }
      const { name, slug, description } = req.body;

      const collectionData = await prisma.collection.create({
        data: {
          name,
          slug,
          description
        }
      });
      
      if (!collectionData) {
        return res.status(400).json({ error: "Failed" }) as Response;
      }
      
      res.status(200).json({success: true, data: collectionData}) as Response;
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

export const updateCollection = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }
      const { collection_id } = req.params;
      const { name, slug, description } = req.body;

      const collectionData = await prisma.collection.update({
        where: {
          id: parseInt(collection_id)
        },
        data: {
          name,
          slug,
          description
        }
      });
      
      if (!collectionData) {
        return res.status(400).json({ error: "Failed" }) as Response;
      }
      
      res.status(200).json({success: true, data: collectionData}) as Response;
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

export const deleteCollection = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }
      const { collection_id } = req.params;

      const collectionData = await prisma.collection.delete({
        where: {
          id: parseInt(collection_id)
        }
      });
      
      if (!collectionData) {
        return res.status(400).json({ error: "Failed" }) as Response;
      }
      
      res.status(200).json({success: true, data: collectionData}) as Response;
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