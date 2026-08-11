import 'dotenv/config';
import { db } from '../src/db/client.js';
import { transactions } from '../src/db/schema/transactions.js';
import { sql } from 'drizzle-orm';

const query = db.select({
        period: sql`TO_CHAR(${transactions.created_at}, 'YYYY-MM')`,
        income: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`,
        expense: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)::numeric`
      })
      .from(transactions)
      .groupBy(sql`TO_CHAR(${transactions.created_at}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.created_at}, 'YYYY-MM')`);
      
console.log(query.toSQL());
