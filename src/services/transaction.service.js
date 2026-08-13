import { TransactionsQuery } from '../db/queries/transactions.query.js';
import { VendorsQuery } from '../db/queries/vendors.query.js';
import { vendorRequiredForCategory } from '../constants/categories.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import { AgentClient } from '../clients/agent.client.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const assertVendorExists = async (vendorId) => {
  const vendor = await VendorsQuery.findById(vendorId);
  if (!vendor) {
    throw createError(ERROR_MESSAGES.VENDOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
};

/**
 * A spreadsheet date is a WIB calendar day, but the column is a timestamptz and
 * the server session runs on GMT. Interpret it as 00:00:00 Asia/Jakarta so the
 * audit rules (working hours, duplicate windows) see the intended day.
 *
 * Returns a Date (drizzle's timestamptz column wants one), with the UTC instant
 * that corresponds to midnight WIB.
 */
const toWibTimestamptz = (date) => new Date(`${date}T00:00:00+07:00`);

/** Vendors are unique by lowercase name here; a missing one is created. */
const resolveVendor = async (vendorName) => {
  if (!vendorName) return null;
  const existing = await VendorsQuery.findByName(vendorName);
  if (existing) return existing.id;
  const created = await VendorsQuery.create({
    vendor_name: vendorName,
    // Placeholder account: imports rarely carry the bank account, but the
    // column is NOT NULL. Kept out of the audit story — vendor status/risk is
    // what the engine reads, never the account number.
    bank_account: `IMPORT-${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`,
    status: 'active'
  });
  console.log(`[VENDORS][import] created vendor ${created.id} (${vendorName})`);
  return created.id;
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
      invoice_no: data.invoice_no || null,
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
    if (data.invoice_no !== undefined) updateData.invoice_no = data.invoice_no;
    if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id;

    const updated = await TransactionsQuery.update(id, updateData);
    console.log(`[TRANSACTIONS][update] transaction ${id} updated`);
    return updated;
  }

  /**
   * Bulk-imports spreadsheet rows. Vendor names resolve to existing vendors or
   * auto-create new ones; every inserted expense is then handed to the agent
   * server's per-transaction analysis so findings appear without a manual
   * backfill — the "proactive" part of the product.
   *
   * `inputByUserId` is the audit trail of who recorded the rows and must come
   * from the authenticated caller, never the body.
   */
  static async importTransactions({ transactions, inputByUserId }) {
    const rows = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i += 1) {
      const row = transactions[i];
      try {
        if (row.vendor_name) {
          row.vendor_id = await resolveVendor(row.vendor_name);
          delete row.vendor_name;
        }
        if (row.vendor_id) {
          await assertVendorExists(row.vendor_id);
        }
        if (vendorRequiredForCategory(row.category) && !row.vendor_id) {
          throw createError(ERROR_MESSAGES.VENDOR_REQUIRED_FOR_CATEGORY, HTTP_STATUS.BAD_REQUEST);
        }
        rows.push({
          amount: row.amount.toString(),
          type: row.type,
          category: row.category,
          description: row.description,
          invoice_no: row.invoice_no ?? null,
          vendor_id: row.vendor_id || null,
          input_by_user_id: inputByUserId,
          created_at: row.date ? toWibTimestamptz(row.date) : undefined
        });
      } catch (error) {
        errors.push({ row: i + 1, message: error.message });
      }
    }

    const inserted = await TransactionsQuery.createMany(rows);
    console.log(
      `[TRANSACTIONS][import] ${inserted.length} inserted, ${errors.length} rejected ` +
        `by user ${inputByUserId}`
    );

    // Proactive analysis: fire-and-forget per inserted expense, so findings
    // materialise in the background without a manual backfill run. Errors here
    // are logged but never fail the import — the transactions are already real.
    for (const tx of inserted) {
      if (tx.type !== 'expense') continue;
      AgentClient.analyzeOne(tx.id).catch((error) => {
        console.error(`[TRANSACTIONS][import] analysis ${tx.id} rejected: ${error.message}`);
      });
    }

    return { inserted, errors };
  }
}
