import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  googleLoginSchema,
} from '../validations/index.js';

const router = Router();

// Public Auth Endpoints
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/google', validate(googleLoginSchema), AuthController.googleLogin);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);


// Authenticated Auth Endpoints
router.get('/me', authenticate, AuthController.getMe);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

export default router;
