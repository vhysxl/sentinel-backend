import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { dashboardSummarySchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(dashboardSummarySchema), DashboardController.getSummary);

export default router;
