import express, { Router } from "express";
import { 
  getModel,
  listModels,
  addModel,
  addModel_,
  deleteModel,
  updateModel,
  uploadImage
} from "../controllers/model";
import { validateRequestBody } from "../middleware/validateRequest";
import multer from "multer";

const router: Router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Public Routes
router.route("/get/:model_name").get( getModel );
router.route("/list").post( validateRequestBody(["page","count"]), listModels );

/* ------------------
*  Admin Privilege  *
------------------ */
router.route("/create").post(validateRequestBody([]), addModel);
router.route("/update/:model_name").put(validateRequestBody([
  "cover_image_url",
  "name",
  "urls",
  "input_fields",
  "availability",
  "replicate_link",
  "collection_id"
]), updateModel);
router.route("/delete/:model_name").delete(deleteModel);
router.route("/add").post(validateRequestBody([
  "cover_image_url",
  "name",
  "urls",
  "input_fields",
  "availability",
  "replicate_link",
  "collection_id"
]), addModel_);
router.route("/upload/cover_image").post(upload.single('file'), uploadImage);

export default router;
