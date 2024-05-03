import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { prisma } from "../utils/prisma";
import { getObjectFromString } from "../utils/cache-helper";

export const search = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      let offers = {}
      if (req.method === "GET"){
        const queryParams = req.params ? `?${new URLSearchParams(req.params).toString()}` : '';
        const fullUrl = `https://console.vast.ai/api/v0/bundles${queryParams}`;
        offers = await (await fetch(fullUrl)).json();
      }

      if (req.method === "POST"){
        const queryParams = req.body;
        const fullUrl = `https://console.vast.ai/api/v0/bundles/`;
        offers = await (await fetch(fullUrl, {
          method: "POST",
          body: JSON.stringify(queryParams)
        })).json();
      }

      res.status(200).json(offers) as Response;

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

export const getActiveInstances = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id =  req.user?.id;

      if (!id) {
        return res.status(400).json({ error: "invalid input"})
      }

      const [user, instances] = await Promise.all([
        prisma.user.findUnique({
          where: {
            id
          }
        }),
        prisma.machine.findMany({
          where: {
            user_id: id,
            instanceState: 1
          }
        })
      ]) ;

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const subscribedIds = await Promise.all(
        instances.map(async(item) => ({
          ...(await getObjectFromString(`${item.instanceId}`, 'cache.json') || {}),
          instanceId: item.instanceId,
        }))
      );

      return res.status(200).json({ instances: subscribedIds || []});

    } catch (error) {
      console.log(error, 'get active instances error');

      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const getRecommendedTemplates = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://cloud.vast.ai/api/v0/users/118874/templates/referral/', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.VASTAI_KEY}`,
        }
      });

      const output = await response.json();

      return res.status(200).json(output);

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

export const startInstance = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const instanceConfig = req.body;
      const {askId} = req.params;
      const id =  req.user?.id;

      if (!id || !askId || !instanceConfig || Object.keys(instanceConfig).length <= 0) {
        return res.status(400).json({ error: "invalid input"})
      }

      const user = await prisma.user.findUnique({
        where: {
          id
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const response = await fetch(
        `https://console.vast.ai/api/v0/asks/${askId}/`,
        {
          method: "PUT",
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.VASTAI_KEY}`,
          },
          body: JSON.stringify(instanceConfig)
        }
      );
      const output = await response.json();

      if (output.success === false) return res.status(400).json({ message: output.msg })
      if (output.success === true) {
        
        // Create a new machine
        await prisma.machine.create({
          data: {
            instanceId: output.new_contract,
            instanceState: 1, // running
            user: { connect: { id } }
          }
        });
      }

      return res.status(200).json({ message: 'Instance started successfully'});

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

export const sshInstance = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {askId} = req.params;
      const id =  req.user?.id;

      if (!id || !askId) {
        return res.status(400).json({ error: "invalid input"})
      }

      const user = await prisma.user.findUnique({
        where: {
          id
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const response = await fetch(
        `https://cloud.vast.ai/api/v0/instances/${askId}/ssh/`,
        {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.VASTAI_KEY}`,
          },
          body: JSON.stringify({
            "instance_id": askId,
            "ssh_key": process.env.SSH_KEY
          })
        }
      );
      const output = await response.json();
      
      if (output.success === false) return res.status(400).json({ message: output.msg })
      return res.status(200).json({ message: 'Ssh connection successfull'});
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const getInstanceDetails = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      let { username: id, port } = req.query;

      if (!id || !port) {
        return res.status(400).json({ error: "invalid input"})
      }

      id = String(id);
      const path = `cache.json`;
      const cachePresent = await getObjectFromString(id, path);
      if (cachePresent?.portEnd === Number(port) || cachePresent?.portStart === Number(port)) {
        return res.status(200).send(cachePresent);
      }

      const instances = await prisma.machine.findMany({
          where: {
            instanceId: Number(id)
          }
        });

      if (!instances) {
        return res.status(400).json({ error: 'instance not found' });
      }
      
      const response = await fetch('https://console.vast.ai/api/v0/instances', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.VASTAI_KEY}`,
        }
      });

      const output = await response.json();
      const instanceFound = output?.instances?.filter(
        (instance: any) => Number(id) === instance.id && Number(port) === instance.direct_port_start);

      return res.status(200).json({
        "portStart": instanceFound.length > 0 ?instanceFound[0]?.direct_port_start : null,
        "ip": instanceFound.length > 0 ?instanceFound[0]?.public_ipaddr : null,
        "portEnd": instanceFound.length > 0 ?instanceFound[0]?.direct_port_end : null,
      });

    } catch (error) {
      
      if (error instanceof Error) {
        res.status(400).json({
          error: "Internal server error"
        }) as Response;
      }
    }
  }
);

export const deleteInstance = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {askId} = req.params;
      const id =  req.user?.id;

      if (!id || !askId) {
        return res.status(400).json({ error: "invalid input"})
      }

      const user = await prisma.user.findUnique({
        where: {
          id
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      const response = await fetch(
        `https://console.vast.ai/api/v0/instances/${askId}/?api_key=${process.env.VASTAI_KEY}`,
        {
          method: "DELETE"
        }
      );
        
        const output = await response.json();
        if (output.success === false) return res.status(400).json({ message: output.msg })
        if (output.success === true) {
          
          await prisma.machine.updateMany({
            where: {
              instanceId: Number(askId)
            },
            data: {
              instanceState: 2
            }
          })
        }
        return res.status(200).json({ message: 'Instance deleted successfully'});

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
