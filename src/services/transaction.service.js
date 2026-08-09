import { TransactionsQuery } from '../db/queries/transactions.query.js';
import { VendorsQuery } from '../db/queries/vendors.query.js';
import { vendorRequiredForCategory } from '../constants/categories.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const assertVendorExists = async (vendorId) => {
  const vendor = await VendorsQuery.findById(vendorId);
  if (!vendor) {
    throw createError(ERROR_MESSAGES.VENDOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
};

export class TransactionService {
  static async list({ page, limit, type, category, search }) {
    const effectivePage = page ?? DEFAULT_PAGE;
    const effectiveLimit = limit ?? DEFAULT_LIMIT;

    const { rows, total } = await TransactionsQuery.findMany({
      page: effectivePage,
      limit: effectiveLimit,
      type,
      category,
      search
    });

    return {
      transactions: rows,
      pagination: {
        page: effectivePage,
        limit: effectiveLimit,
        total,
        totalPages: Math.ceil(total / effectiveLimit)
      }
    };
  }

  static async getById(id) {
    const transaction = await TransactionsQuery.findById(id);
    if (!transaction) {
      throw createError(ERROR_MESSAGES.TRANSACTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return transaction;
  }

  /**
   * `inputByUserId` is the audit trail of who recorded this transaction — it
   * must be the authenticated caller (see AuthController/req.user.sub), never
   * a value taken from the request body.
   */
  static async create({ inputByUserId, ...data }) {
    if (data.vendor_id) {
      await assertVendorExists(data.vendor_id);
    }

    const transaction = await TransactionsQuery.create({
      amount: data.amount.toString(),
      type: data.type,
      category: data.category,
      description: data.description,
      vendor_id: data.vendor_id || null,
      input_by_user_id: inputByUserId
    });

    console.log(`[TRANSACTIONS][create] transaction ${transaction.id} recorded by user ${inputByUserId}`);
    return transaction;
  }

  static async update(id, data) {
    const existing = await TransactionsQuery.findRawById(id);
    if (!existing) {
      throw createError(ERROR_MESSAGES.TRANSACTION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (data.vendor_id) {
      await assertVendorExists(data.vendor_id);
    }

    // Effective state after this update = existing row overlaid with whatever
    // the caller sent. Only that combination can be checked correctly, since
    // a partial update alone doesn't carry enough context.
    const effectiveCategory = data.category ?? existing.category;
    const effectiveVendorId = data.vendor_id !== undefined ? data.vendor_id : existing.vendor_id;

    if (vendorRequiredForCategory(effectiveCategory) && !effectiveVendorId) {
      throw createError(ERROR_MESSAGES.VENDOR_REQUIRED_FOR_CATEGORY, HTTP_STATUS.BAD_REQUEST);
    }

    const updateData = {};
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.type) updateData.type = data.type;
    if (data.category) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id;

    const updated = await TransactionsQuery.update(id, updateData);
    console.log(`[TRANSACTIONS][update] transaction ${id} updated`);
    return updated;
  }
}
