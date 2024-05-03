import express, { Router } from "express";
import { 
  genInvoice,
  confirmSuccess,
  billingHistory,
} from "../controllers/credit";
import { validateRequestBody } from "../middleware/validateRequest";

const router: Router = express.Router();

// Public Routes
router.route("/invoice").post(
  validateRequestBody(['amount']),
  genInvoice
);
router.route("/success").get(confirmSuccess);
router.route("/history").get(billingHistory);

export default router;
