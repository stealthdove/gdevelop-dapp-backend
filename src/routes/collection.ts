import express, { Router } from "express";
import { 
  addCollection,
  getCollection,
  getCollections,
  deleteCollection,
  updateCollection,
} from "../controllers/collection";
import { validateRequestBody } from "../middleware/validateRequest";

const router: Router = express.Router();

// Public Routes
router.route("/list").get(getCollections);
router.route("/:collection_slug").get(getCollection);

/* ------------------
*  Admin Privilege  *
------------------ */
router.route("/create").post(validateRequestBody(['name', 'slug', 'description']), addCollection);
router.route("/update/:collection_id").put(updateCollection)
router.route("/delete/:collection_id").delete(deleteCollection)

export default router;
