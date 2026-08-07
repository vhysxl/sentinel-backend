import { TransactionService } from '../services/transaction.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { HTTP_STATUS } from '../constants/index.js';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories.js';

export class TransactionController {
  static create = asyncHandler(async (req, res) => {
    const transaction = await TransactionService.create({
      ...req.body,
      inputByUserId: req.user.sub
    });
    return successResponse(
      res,
      'Transaction created successfully',
      { transaction },
      HTTP_STATUS.CREATED
    );
  });

  static list = asyncHandler(async (req, res) => {
    const result = await TransactionService.list(req.query);
    return successResponse(res, 'Transactions retrieved successfully', result);
  });

  static categories = asyncHandler(async (req, res) => {
    const { type } = req.query;

    let data;
    if (type === 'income') {
      data = { income: INCOME_CATEGORIES };
    } else if (type === 'expense') {
      data = { expense: EXPENSE_CATEGORIES };
    } else {
      data = { income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES };
    }

    return successResponse(res, 'Transaction categories retrieved successfully', data);
  });

  static getById = asyncHandler(async (req, res) => {
    const transaction = await TransactionService.getById(req.params.id);
    return successResponse(res, 'Transaction retrieved successfully', { transaction });
  });

  static update = asyncHandler(async (req, res) => {
    const transaction = await TransactionService.update(req.params.id, req.body);
    return successResponse(res, 'Transaction updated successfully', { transaction });
  });
}
