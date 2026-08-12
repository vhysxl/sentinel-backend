import { z } from 'zod';
import { ALL_CATEGORIES, vendorRequiredForCategory } from '../constants/categories.js';

const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: 'Transaction id must be a number' }).int().positive()
});

const categoryField = z.enum(ALL_CATEGORIES, { message: 'Invalid category' });
const typeField = z.enum(['income', 'expense'], { message: 'Type must be income or expense' });

export const createTransactionSchema = z.object({
  body: z
    .object({
      amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
      type: typeField,
      category: categoryField,
      description: z
        .string({ required_error: 'Description is required' })
        .min(1, 'Description is required'),
      vendor_id: z.number().int().positive('Vendor id must be positive').optional().nullable()
    })
    .superRefine((data, ctx) => {
      if (vendorRequiredForCategory(data.category) && !data.vendor_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vendor is required for this category',
          path: ['vendor_id']
        });
      }
    })
});

export const transactionIdSchema = z.object({
  params: idParam
});

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce.number({ invalid_type_error: 'Page must be a number' }).int().positive().optional(),
    limit: z.coerce
      .number({ invalid_type_error: 'Limit must be a number' })
      .int()
      .positive()
      .max(100, 'Limit must be at most 100')
      .optional(),
    type: typeField.optional(),
    category: categoryField.optional(),
    search: z.string().trim().min(1).optional()
  })
});

export const transactionCategoriesQuerySchema = z.object({
  query: z.object({
    type: typeField.optional()
  })
});

// No superRefine here: a partial update's effective category/vendor can
// depend on the existing row, which the schema has no access to. That check
// happens in TransactionService.update() once the existing row is loaded.
export const updateTransactionSchema = z.object({
  params: idParam,
  body: z.object({
    amount: z.number().positive('Amount must be positive').optional(),
    type: typeField.optional(),
    category: categoryField.optional(),
    description: z.string().min(1, 'Description is required').optional(),
    vendor_id: z.number().int().positive('Vendor id must be positive').optional().nullable()
  })
});

// One row of an import. Same field rules as create, plus the spreadsheet-only
// fields the UI cannot offer on a form: an optional WIB date (else now) and an
// optional invoice number.
const importRow = z
  .object({
    amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
    type: typeField,
    category: categoryField,
    description: z
      .string({ required_error: 'Description is required' })
      .min(1, 'Description is required'),
    // YYYY-MM-DD interpreted in Asia/Jakarta. Omitted rows land on "now".
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be a date in YYYY-MM-DD format')
      .optional(),
    invoice_no: z.string().trim().max(50, 'Invoice number must be at most 50 characters').optional(),
    vendor_name: z.string().trim().min(1, 'Vendor name is required').max(100).optional(),
    vendor_id: z.number().int().positive('Vendor id must be positive').optional().nullable()
  })
  .refine((r) => r.vendor_name === undefined || r.vendor_id === undefined, {
    message: 'Provide either vendor_name or vendor_id, not both',
    path: ['vendor_name']
  })
  .superRefine((data, ctx) => {
    if (vendorRequiredForCategory(data.category) && !data.vendor_id && !data.vendor_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vendor is required for this category',
        path: ['vendor_id']
      });
    }
  });

// Imports are bounded: a single bulk upload should never flood the queue.
export const importTransactionsSchema = z.object({
  body: z.object({
    transactions: z
      .array(importRow)
      .min(1, 'At least one transaction is required')
      .max(2000, 'At most 2000 transactions per import')
  })
});
