import express, { Router } from "express";
import {
  createPrompt, 
  get, 
  promptList, 
  deletePrompt, 
  publish, 
  run, 
  save
} from "../controllers/prompt";
import { validateRequestBody } from "../middleware/validateRequest";

const router: Router = express.Router();

// Public Routes
router.route("/create").post(createPrompt);
router.route("/list").get(promptList);
router.route("/:workflow_id").get(get);
router.route("/delete/:workflow_id").delete(deletePrompt);
router.route("/save/:workflow_id").post(validateRequestBody([]), save);
router.route("/publish/:workflow_id").put(validateRequestBody([]), publish);
router.route("/run/:workflow_id").post(validateRequestBody(["input"]), run);

export default router;
