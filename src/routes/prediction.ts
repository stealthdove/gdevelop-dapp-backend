import express, { Router } from "express";
import {
  prediction,
  getPredcitionHistory,
  getPredictionStatus,
  getPredictionResult,
} from "../controllers/prediction";
import { validateRequestBody } from "../middleware/validateRequest";

const router: Router = express.Router();

// Public Routes
router.route("/").post(validateRequestBody(["model", "input"]), prediction);
router.route("/history").get(getPredcitionHistory);
router.route("/status/:id").get(getPredictionStatus);
router.route("/result/:id").get(getPredictionResult);

export default router;
