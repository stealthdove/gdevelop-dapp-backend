import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { model, workflow, machine, credential, credit, hardware, collection, prediction, prompt } from "./routes";
import { decryptApiKey } from "./utils";
import { authRouter, authMiddleware, getUser } from "./utils/thirdweb";
import cluster from 'cluster';
import os from 'os';
const numCPUs = os.cpus().length;
import updateGpu from './cron_job/updateGpu';
import { prisma } from "./utils/prisma";

declare global {
  namespace Express {
    interface Request {
      user: any; // Define user property as optional
    }
  }
}

// Create the express app and import the type of app from express;
const app: Application = express();


// if (cluster.isPrimary) {
//   for (let i = 0; i < numCPUs; i += 1) {
//     cluster.fork();
//   }
//   updateGpu();
// } 
// else {

  // Cors
  app.use(cors({
    origin: '*',
  }));
  // Configure env:
  dotenv.config();

  // Parser
  // Body parser middleware
  // Raw json:
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Declate the PORT:
  const port = process.env.PORT || 5000;

  const userAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.path);
    if (!req.path.startsWith("/auth") && !req.path.match("/credit/success")) {
      const apiKey = req.headers['tpu-api-key'] as string;
      const user = await getUser(req);
      if (!user && !apiKey) {
        return res.status(401).json({
          message: "Unauthorized.",
        });
      }
      if (apiKey) {
        try {
          const userInfo = await JSON.parse(decryptApiKey(apiKey));
          req.user = userInfo;
        } catch (error) {
          return res.status(400).json({
            message: "Invalid API key.",
          });
        }
      }
      if (user) {
        req.user = user.session;
      }
      if (req.user) {
        const user = await prisma.user.findUnique({
          where: {
            id: req.user.id
          }
        })
        if (!user) {
          return res.status(401).json({
            message: "User not existing.",
          });
        }
      }
    }
    next(); // Continue to the next middleware or route handler
  }

  app.use(authMiddleware);
  app.use("/api", userAuthMiddleware);

  // All Routes
  app.use("/api/auth", authRouter);
  // app.use("/api/model", model);
  // app.use("/api/workflow", workflow);
  // app.use("/api/machine", machine);
  // app.use("/api/credential", credential);
  // app.use("/api/credit", credit);
  // app.use("/api/hardware", hardware);
  // app.use("/api/collection", collection);
  // app.use("/api/prediction", prediction);
  // app.use("/api/prompt", prompt);

  app.get("/", (req: Request, res: Response) => {
    res.send("CLICK ENGINE APP API Server running...");
  });

  // Listen the server
  app.listen(port, async () => {
    console.log(`=> Server running at http://localhost:${port}`);
  });
// }
