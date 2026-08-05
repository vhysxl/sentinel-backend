import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createTransactionSchema,
  listTransactionsSchema,
  transactionCategoriesQuerySchema,
  transactionIdSchema,
  updateTransactionSchema
} from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTransactionSchema), TransactionController.create);
router.get('/', validate(listTransactionsSchema), TransactionController.list);
router.get(
  '/categories',
  validate(transactionCategoriesQuerySchema),
  TransactionController.categories
);
router.get('/:id', validate(transactionIdSchema), TransactionController.getById);
router.put('/:id', validate(updateTransactionSchema), TransactionController.update);

export default router;
