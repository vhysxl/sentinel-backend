import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { transactions } from '../schema/transactions.js';
import { vendors } from '../schema/vendors.js';
import { users } from '../schema/users.js';

// Shared projection for list/detail reads: enriches each row with the
// vendor/user names so the frontend doesn't need a second round trip.
const listColumns = {
  id: transactions.id,
  created_at: transactions.created_at,
  amount: transactions.amount,
  type: transactions.type,
  category: transactions.category,
  description: transactions.description,
  vendor_id: transactions.vendor_id,
  vendor_name: vendors.vendor_name,
  input_by_user_id: transactions.input_by_user_id,
  user_fullname: users.fullname
};

/**
 * Every read/write against the transactions table lives here. Services never
 * touch drizzle directly, so the query shapes stay in one place.
 */
export class TransactionsQuery {
  /** Raw row, no joins — used where only the transaction's own columns matter. */
  static async findRawById(id) {
    const rows = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return rows[0] || null;
  }

  static async findById(id) {
    const rows = await db
      .select({ ...listColumns, bank_account: vendors.bank_account })
      .from(transactions)
      .leftJoin(vendors, eq(transactions.vendor_id, vendors.id))
      .leftJoin(users, eq(transactions.input_by_user_id, users.id))
      .where(eq(transactions.id, id))
      .limit(1);
    return rows[0] || null;
  }

  static async findMany({ page, limit, type, category, search }) {
    const conditions = [];
    if (type) conditions.push(eq(transactions.type, type));
    if (category) conditions.push(eq(transactions.category, category));
    if (search) conditions.push(ilike(transactions.description, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(transactions)
      .where(whereClause);

    const rows = await db
      .select(listColumns)
      .from(transactions)
      .leftJoin(vendors, eq(transactions.vendor_id, vendors.id))
      .leftJoin(users, eq(transactions.input_by_user_id, users.id))
      .where(whereClause)
      .orderBy(desc(transactions.created_at))
      .limit(limit)
      .offset(offset);

    return { rows, total: countResult.count };
  }

  static async create(data) {
    const rows = await db.insert(transactions).values(data).returning();
    return rows[0];
  }

  static async update(id, data) {
    const rows = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return rows[0];
  }
}
