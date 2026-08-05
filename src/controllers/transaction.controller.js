import { db } from '../db/client.js';
import { transactions } from '../db/schema/transactions.js';
import { vendors } from '../db/schema/vendors.js';
import { users } from '../db/schema/users.js';
import { eq, desc, and, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories.js';

const createTransactionSchema = z.object({
  transaction_date: z.string().min(1, 'Transaction date is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense'], { message: 'Type must be income or expense' }),
  category: z.string().min(1, 'Category is required').max(50),
  description: z.string().min(1, 'Description is required'),
  vendor_id: z.number().int().positive('Vendor ID must be positive').optional().nullable(),
  input_by_user_id: z.number().int().positive('User ID is required')
}).superRefine((data, ctx) => {
  const noVendorCategories = ['sales', 'payroll & benefits'];
  const catLower = (data.category || '').toLowerCase();
  if (!noVendorCategories.includes(catLower) && !data.vendor_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vendor ID is required for this category',
      path: ['vendor_id']
    });
  }
});

const updateTransactionSchema = z.object({
  transaction_date: z.string().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().min(1, 'Description is required'),
  vendor_id: z.number().int().positive().optional().nullable()
}).superRefine((data, ctx) => {
  const noVendorCategories = ['sales', 'payroll & benefits'];
  // If category is provided in update, we check it. If not provided, we can't fully validate unless we query DB, 
  // but for partial updates we assume if they pass vendor_id=null without category, we might reject.
  // To keep it simple, if category is provided and it needs a vendor, and vendor_id is explicitly null, reject.
  if (data.category) {
    const catLower = data.category.toLowerCase();
    if (!noVendorCategories.includes(catLower) && data.vendor_id === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vendor ID is required for this category',
        path: ['vendor_id']
      });
    }
  }
});

export const createTransaction = async (req, res) => {
  try {
    const parseResult = createTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: parseResult.error.errors
      });
    }

    const data = parseResult.data;

    // Check vendor exists if provided
    if (data.vendor_id) {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, data.vendor_id)).limit(1);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
    }

    // Check user exists
    const [user] = await db.select().from(users).where(eq(users.id, data.input_by_user_id)).limit(1);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [transaction] = await db.insert(transactions).values({
      transaction_date: new Date(data.transaction_date),
      amount: data.amount.toString(),
      type: data.type,
      category: data.category,
      description: data.description,
      vendor_id: data.vendor_id || null,
      input_by_user_id: data.input_by_user_id
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTransactionCategories = async (req, res) => {
  try {
    const { type } = req.query;
    
    let data = {};
    if (type === 'income') {
      data = { income: INCOME_CATEGORIES };
    } else if (type === 'expense') {
      data = { expense: EXPENSE_CATEGORIES };
    } else {
      data = { income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES };
    }

    res.status(200).json({
      success: true,
      message: 'Transaction categories retrieved successfully',
      data
    });
  } catch (error) {
    console.error('getTransactionCategories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    if (type) conditions.push(eq(transactions.type, type));
    if (category) conditions.push(eq(transactions.category, category));
    if (search) conditions.push(ilike(transactions.description, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(transactions)
      .where(whereClause);

    const results = await db
      .select({
        id: transactions.id,
        transaction_date: transactions.transaction_date,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        description: transactions.description,
        vendor_id: transactions.vendor_id,
        vendor_name: vendors.vendor_name,
        input_by_user_id: transactions.input_by_user_id,
        user_fullname: users.fullname
      })
      .from(transactions)
      .leftJoin(vendors, eq(transactions.vendor_id, vendors.id))
      .leftJoin(users, eq(transactions.input_by_user_id, users.id))
      .where(whereClause)
      .orderBy(desc(transactions.transaction_date))
      .limit(Number(limit))
      .offset(offset);

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions: results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: countResult.count,
          totalPages: Math.ceil(countResult.count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [transaction] = await db
      .select({
        id: transactions.id,
        transaction_date: transactions.transaction_date,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        description: transactions.description,
        vendor_id: transactions.vendor_id,
        vendor_name: vendors.vendor_name,
        bank_account: vendors.bank_account,
        input_by_user_id: transactions.input_by_user_id,
        user_fullname: users.fullname,
        user_username: users.username
      })
      .from(transactions)
      .leftJoin(vendors, eq(transactions.vendor_id, vendors.id))
      .leftJoin(users, eq(transactions.input_by_user_id, users.id))
      .where(eq(transactions.id, Number(id)))
      .limit(1);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction retrieved successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('getTransactionById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(transactions).where(eq(transactions.id, Number(id))).limit(1);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const parseResult = updateTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: parseResult.error.errors
      });
    }

    const data = parseResult.data;

    if (data.vendor_id) {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, data.vendor_id)).limit(1);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
    }

    const updateData = {};
    if (data.transaction_date) updateData.transaction_date = new Date(data.transaction_date);
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.type) updateData.type = data.type;
    if (data.category) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id;

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, Number(id)))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction: updated }
    });
  } catch (error) {
    console.error('updateTransaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
