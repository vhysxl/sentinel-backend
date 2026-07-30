import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Auth Endpoints
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Authenticated Auth Endpoints
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
