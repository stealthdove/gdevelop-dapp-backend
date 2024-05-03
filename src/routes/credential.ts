import express, { Router } from "express";
import {
  generateApiKey, 
  getApiKeys, 
  getUser
} from "../controllers/credential";
import { validateRequestBody } from "../middleware/validateRequest";

const router: Router = express.Router();

// Public Routes
router.route("/genkey").post(validateRequestBody(["keyName"]), generateApiKey);
router.route("/keys").get(getApiKeys);
router.route("/").get(getUser);

export default router;
