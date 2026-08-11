import { eq, sql, count, and, gte, lte } from 'drizzle-orm';
import { db } from '../client.js';
import { transactions } from '../schema/transactions.js';

const dateRangeConditions = (startDate, endDate) => {
  const conditions = [];
  if (startDate) conditions.push(gte(transactions.created_at, new Date(startDate)));
  if (endDate) conditions.push(lte(transactions.created_at, new Date(endDate)));
  return conditions;
};

/**
 * Every read for the dashboard aggregates lives here. Services never touch
 * drizzle directly, so the query shapes stay in one place.
 */
export class DashboardQuery {
  static async getSummary({ startDate, endDate }) {
    const whereClause = and(...dateRangeConditions(startDate, endDate));

    const [row] = await db
      .select({
        totalIncome: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        totalExpense: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        totalTransaction: count()
      })
      .from(transactions)
      .where(whereClause);

    return row;
  }

  static async getTrends({ startDate, endDate }) {
    const whereClause = and(...dateRangeConditions(startDate, endDate));
    const period = sql`TO_CHAR(${transactions.created_at} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM')`;

    return db
      .select({
        period,
        income: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        expense: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(period)
      .orderBy(period);
  }

  static async getExpenseBreakdown({ startDate, endDate }) {
    const whereClause = and(eq(transactions.type, 'expense'), ...dateRangeConditions(startDate, endDate));

    return db
      .select({
        category: transactions.category,
        amount: sql`SUM(${transactions.amount})::numeric`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(transactions.category)
      .orderBy(sql`SUM(${transactions.amount}) DESC`);
  }
}
