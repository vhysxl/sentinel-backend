import { Router } from 'express';
import healthRouter from './health.route.js';
import authRouter from './auth.route.js';

const router = Router();

// Root Health Router
router.use('/health', healthRouter);

// API v1 Namespace Router
const apiV1Router = Router();
apiV1Router.use('/health', healthRouter);
apiV1Router.use('/auth', authRouter);

router.use('/api/v1', apiV1Router);

export default router;
