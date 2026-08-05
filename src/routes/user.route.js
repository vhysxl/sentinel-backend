import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, userIdSchema, updateUserStatusSchema } from '../validations/index.js';

const router = Router();

// The only endpoints in the application that check `isAdmin`.
router.use(authenticate, requireAdmin);

router.get('/', UserController.list);
router.post('/', validate(createUserSchema), UserController.create);
router.post('/:id/reset-password', validate(userIdSchema), UserController.resetPassword);
router.patch('/:id/status', validate(updateUserStatusSchema), UserController.setStatus);

export default router;
