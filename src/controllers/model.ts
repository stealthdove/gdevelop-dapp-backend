import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";
import axios from "axios";
import fs from 'fs';
import path from 'path';

export const getModel = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      const model_name = req.params.model_name;

      const modelData = await prisma.model.findUnique({
        where:{
          name: model_name,
        },
        select: {
          cover_image_url: true,
          name: true,
          short_desc: true,
          description: true,
          run_count: true,
          urls: true,
          default_example: true,
          api_schema: true,
          created_at: true,
          updated_at: true,
          availability: true,
          collection_id: true,
          replicate_link: role==="admin"
        }
      })

      res.status(200).json(modelData) as Response;
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

export const listModels = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      const { page, count, collection } = req.body;

      let where:{ [key: string]: any } = role === "admin" ? {} : {
        availability: true,
      };

      if(collection){
        const collectionData = await prisma.collection.findFirst({
          where: {
            slug: collection
          }
        });

        if(!collectionData) {
          return res.status(400).json({message: 'Invalid collection name'}) as Response;
        }
        where["collection_id"] = {
          has: collectionData.id
        }
      }
      
      const modelsData = await prisma.model.findMany({
        where,
        skip: (page - 1) * count,
        take: count,
        select: {
          cover_image_url: true,
          name: true,
          description: true,
          run_count: true,
          urls: true,
          default_example: true,
          api_schema: true,
          short_desc: true,
          created_at: true,
          updated_at: true,
          availability: true,
          collection_id: true,
          replicate_link: role==="admin"
        },
      });

      res.status(200).json(modelsData) as Response;
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

export const addModel = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }

      const data = req.body;

      const replicateModel = await prisma.modelR.findFirst({
        where:{
          url: data.replicate_link
        }
      })

      if(!replicateModel) return res.status(400).json({message: "Not available replicate model"}) as Response;

      const modelsData = await prisma.model.create({
        data
      });

      res.status(200).json({success: true, data: modelsData}) as Response;
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

export const updateModel = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }

      const { model_name } = req.params;
      const {
        cover_image_url,
        name,
        short_desc,
        description,
        urls,
        input_fields,
        availability,
        replicate_link,
        collection_id
      } = req.body;

      const replicateModel = await prisma.modelR.findFirst({
        where:{
          url: replicate_link
        }
      })

      if(!replicateModel) return res.status(400).json({message: "Not available replicate model"}) as Response;

      let { default_example, description: re_description, latest_version } = replicateModel;
      (latest_version as any)['openapi_schema']['components']['schemas']['Input']['rendered'] = input_fields;

      const modelsData = await prisma.model.update({
        where: {
          name: model_name
        },
        data :{
          cover_image_url,
          name,
          short_desc: short_desc || re_description,
          description: description || re_description,
          default_example: { 
            input: (default_example as any).input,
            output: (default_example as any).output,
            metrics: (default_example as any).metrics
          },
          api_schema: (latest_version as any)['openapi_schema']['components']['schemas'],
          urls,
          availability,
          replicate_link,
          collection_id
        }
      });

      res.status(200).json({success: true, data: modelsData}) as Response;
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

export const deleteModel = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }

      const { model_name } = req.params;

      const modelsData = await prisma.model.delete({
        where: {
          name: model_name
        }
      });

      res.status(200).json({success: true, data: modelsData}) as Response;
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

export const addModel_ = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }

      const {
        cover_image_url,
        name,
        short_desc,
        description,
        urls,
        input_fields,
        availability,
        replicate_link,
        collection_id
      } = req.body;

      const replicateModel = await prisma.modelR.findFirst({
        where:{
          url: replicate_link
        }
      })

      if(!replicateModel) return res.status(400).json({message: "Not available replicate model"}) as Response;

      let { default_example, description: re_description, latest_version } = replicateModel;
      (latest_version as any)['openapi_schema']['components']['schemas']['Input']['rendered'] = input_fields;

      const modelsData = await prisma.model.create({
        data :{
          cover_image_url,
          name,
          short_desc: short_desc || re_description,
          description: description || re_description,
          default_example: { 
            input: (default_example as any).input,
            output: (default_example as any).output,
            metrics: (default_example as any).metrics
          },
          api_schema: (latest_version as any)['openapi_schema']['components']['schemas'],
          urls,
          availability,
          replicate_link,
          collection_id
        }
      });

      res.status(200).json({success: true, data: modelsData}) as Response;
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

export const uploadImage = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { role } = req.user;
      if (role !== "admin") {
        return res.status(400).json({error: "You are not admin."}) as Response;
      }

      if (!req.file) {
        return res.status(400).send({error: "No files were uploaded."}) as Response;
      }

      // Upload file to Bunny CDN
      const ext = req.file.originalname.split('.').pop();
      const filename = `file-${Date.now()}.${ext}`;
      const bunnyCdnResponse = await axios.put(
        `https://storage.bunnycdn.com/tpu-marketplace/Cover Image/${filename}`,
        fs.createReadStream(path.join(__dirname, '..', '..', req.file.path)),
        // req.file.buffer, // Use req.file.buffer to access the uploaded file data
        {
          headers: {
            'AccessKey': process.env.BUNNYCDN_ACCESS_KEY as string,
            'Content-Type': req.file.mimetype
          }
        }
      );

      if(bunnyCdnResponse.data.HttpCode !== 201) {
        return res.status(400).json({success: false, message: bunnyCdnResponse.data.Message }) as Response;
      }

      res.status(200).json({success: true, url:`${process.env.BUNNYCDN_EDGE_URL}/Cover Image/${filename}` }) as Response;
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