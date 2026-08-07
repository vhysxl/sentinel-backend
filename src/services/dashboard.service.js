import { DashboardQuery } from '../db/queries/dashboard.query.js';

export class DashboardService {
  static async getSummary({ startDate, endDate }) {
    const [summary, trends, expenseBreakdown] = await Promise.all([
      DashboardQuery.getSummary({ startDate, endDate }),
      DashboardQuery.getTrends({ startDate, endDate }),
      DashboardQuery.getExpenseBreakdown({ startDate, endDate })
    ]);

    const totalIncome = parseFloat(summary.totalIncome);
    const totalExpense = parseFloat(summary.totalExpense);

    return {
      summary: {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        totalTransaction: summary.totalTransaction
      },
      trends: trends.map((t) => ({
        period: t.period,
        income: parseFloat(t.income),
        expense: parseFloat(t.expense)
      })),
      expenseBreakdown: expenseBreakdown.map((e) => ({
        category: e.category,
        amount: parseFloat(e.amount)
      }))
    };
  }
}
