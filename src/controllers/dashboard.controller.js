import { db } from '../db/client.js';
import { transactions } from '../db/schema/transactions.js';
import { eq, sql, count, and, gte, lte } from 'drizzle-orm';

export const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const conditions = [];
    if (startDate) conditions.push(gte(transactions.transaction_date, new Date(startDate)));
    if (endDate) conditions.push(lte(transactions.transaction_date, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Summary Metrics
    const [summary] = await db
      .select({
        totalIncome: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        totalExpense: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        totalTransaction: count()
      })
      .from(transactions)
      .where(whereClause);

    const totalIncome = parseFloat(summary.totalIncome || '0');
    const totalExpense = parseFloat(summary.totalExpense || '0');
    const netCashFlow = totalIncome - totalExpense;

    // 2. Cashflow trends by Month
    const trends = await db
      .select({
        period: sql`TO_CHAR(${transactions.transaction_date}, 'YYYY-MM')`,
        income: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        expense: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`
      })
      .from(transactions)
      .where(whereClause)
      .groupBy(sql`TO_CHAR(${transactions.transaction_date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.transaction_date}, 'YYYY-MM')`);

    // 3. Expense breakdown by category
    const expenseBreakdown = await db
      .select({
        category: transactions.category,
        amount: sql`SUM(${transactions.amount})::numeric`
      })
      .from(transactions)
      .where(and(eq(transactions.type, 'expense'), whereClause))
      .groupBy(transactions.category)
      .orderBy(sql`SUM(${transactions.amount}) DESC`);

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netCashFlow,
          totalTransaction: summary.totalTransaction
        },
        trends: trends.map(t => ({
          period: t.period,
          income: parseFloat(t.income),
          expense: parseFloat(t.expense)
        })),
        expenseBreakdown: expenseBreakdown.map(e => ({
          category: e.category,
          amount: parseFloat(e.amount)
        }))
      }
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
