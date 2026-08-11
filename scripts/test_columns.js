import 'dotenv/config';
import pg from 'pg';

async function test() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions'`);
  console.log(res.rows);
  pool.end();
}
test();
