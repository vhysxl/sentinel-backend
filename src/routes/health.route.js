import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();

// GET /health and GET /api/v1/health
router.get('/', HealthController.getHealth);

export default router;
