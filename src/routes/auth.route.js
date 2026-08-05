import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  loginSchema,
  googleLoginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  setPasswordSchema
} from '../validations/index.js';

const router = Router();

// Public
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/google', validate(googleLoginSchema), AuthController.googleLogin);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);

// Authenticated
router.get('/me', authenticate, AuthController.getMe);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);
router.post('/set-password', authenticate, validate(setPasswordSchema), AuthController.setPassword);

export default router;
