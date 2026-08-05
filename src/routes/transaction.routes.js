import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  getTransactionCategories
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/categories', getTransactionCategories);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);

export default router;
