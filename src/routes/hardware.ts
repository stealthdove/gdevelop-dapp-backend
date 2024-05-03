import express, { Router } from "express";
import { getHardware } from "../controllers/hardware";

const router: Router = express.Router();

// Public Routes
router.route("/").get(getHardware);

export default router;
