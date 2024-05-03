import express, { Router } from "express";
import { deleteInstance, getActiveInstances, getInstanceDetails, getRecommendedTemplates, search, sshInstance, startInstance } from "../controllers/machine";

const router: Router = express.Router();

// Public Routes
router.route('/search').get(search);
router.route('/search').post(search);
router.route('/list/running').get(getActiveInstances);
router.route('/list/templates').get(getRecommendedTemplates);
router.route('/instances/start/:askId').post(startInstance);
router.route('/instances/delete/:askId').delete(deleteInstance);
router.route('/instances/ssh/:askId').post(sshInstance);
router.route('/instances/details').get(getInstanceDetails);

export default router;
