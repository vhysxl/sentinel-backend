import 'dotenv/config';
import pg from 'pg';

async function verify() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const resCountBefore = await pool.query(`SELECT COUNT(*) as count FROM transactions`);
    let count = parseInt(resCountBefore.rows[0].count);
    
    if (count < 105) {
      console.log('Inserting dummy transactions to cross 100 limit...');
      
      const resUser = await pool.query(`SELECT id FROM users LIMIT 1`);
      if (resUser.rows.length === 0) throw new Error('No users found in database');
      const userId = resUser.rows[0].id;

      for (let i = 0; i < (105 - count); i++) {
        await pool.query(`INSERT INTO transactions (created_at, amount, type, category, description, input_by_user_id) VALUES (NOW(), 100000.00, 'income', 'Salary', 'Dummy', $1)`, [userId]);
      }
    }
    
    const resCount = await pool.query(`SELECT COUNT(*) as count FROM transactions`);
    console.log('Total Transactions in DB:', resCount.rows[0].count);

    const resIncome = await pool.query(`SELECT SUM(amount) as income FROM transactions WHERE type='income'`);
    console.log('Total Income in DB:', resIncome.rows[0].income);

    const resExpense = await pool.query(`SELECT SUM(amount) as expense FROM transactions WHERE type='expense'`);
    console.log('Total Expense in DB:', resExpense.rows[0].expense);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

verify();
