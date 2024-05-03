import express, { Router } from "express";
import {
  createWorkflow, 
  deleteWorkflow, 
  get, 
  publish, 
  run, 
  save, 
  workflowList
} from "../controllers/workflow";
import { validateRequestBody } from "../middleware/validateRequest";

const router: Router = express.Router();

// Public Routes
router.route("/create").post(validateRequestBody(["name", "nodes", "edges", "sequence"]), createWorkflow);
router.route("/list").get(workflowList);
router.route("/:workflow_id").get(get);
router.route("/delete/:workflow_id").delete(deleteWorkflow);
router.route("/save/:workflow_id").post(validateRequestBody([]), save);
router.route("/publish/:workflow_id").put(validateRequestBody([]), publish);
router.route("/run/:workflow_id").post(validateRequestBody(["input"]), run);

export default router;
