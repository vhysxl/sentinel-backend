import { Router } from 'express';
import { AskController } from '../controllers/ask.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { askSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(askSchema), AskController.ask);
router.get('/history', AskController.getHistory);

export default router;
