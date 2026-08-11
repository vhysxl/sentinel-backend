import { db, pool } from '../src/db/client.js';
import { sql } from 'drizzle-orm';
import { transactions } from '../src/db/schema/transactions.js';

const seed = async () => {
  console.log('Wiping transaction-related tables...');
  try {
     await db.execute(sql`DELETE FROM transaction_analysis CASCADE;`);
     console.log('transaction_analysis wiped.');
  } catch (e) {
     console.log('No transaction_analysis table or failed to wipe:', e.message);
  }
  
  try {
     await db.execute(sql`DELETE FROM findings CASCADE;`);
     console.log('findings wiped.');
  } catch (e) {
     console.log('No findings table or failed to wipe:', e.message);
  }
  
  try {
     await db.execute(sql`DELETE FROM transactions CASCADE;`);
     console.log('transactions wiped.');
  } catch (e) {
     console.log('Failed to wipe transactions:', e.message);
  }
  
  const userRes = await db.execute(sql`SELECT id FROM users LIMIT 1;`);
  const userId = userRes.rows[0]?.id;
  if (!userId) {
     throw new Error("No user found in DB. Run seed-admin first.");
  }

  const today = new Date();
  
  for (let i = 20; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 28, 10, 0, 0);
    
    // 1. Tentukan nominal Payroll dan Sales
    let payrollAmountStr, salesAmountStr;
    if (i === 2) {
      // Bulan Spike (Juni)
      payrollAmountStr = '150000000.00';
      salesAmountStr = '1200000000.00'; // 1.2 Miliar (Bonus komisi membenarkan gaji 150jt)
    } else {
      // Bulan Normal
      // Payroll: 50m +/- 1%
      const pVariation = (Math.random() * 0.02) - 0.01;
      payrollAmountStr = (50000000 * (1 + pVariation)).toFixed(2);
      
      // Sales: 200m +/- 5%
      const sVariation = (Math.random() * 0.10) - 0.05;
      salesAmountStr = (200000000 * (1 + sVariation)).toFixed(2);
    }
    
    // 2. Insert Data Sales (Income)
    await db.insert(transactions).values({
      created_at: d,
      amount: salesAmountStr,
      type: 'income',
      category: 'Sales',
      description: `Pendapatan Penjualan Ritel Bulan ${d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
      input_by_user_id: userId
    });

    // 3. Insert Data Payroll (Expense)
    await db.insert(transactions).values({
      created_at: d,
      amount: payrollAmountStr,
      type: 'expense',
      category: 'Payroll & Benefits',
      description: `Pembayaran Gaji Karyawan Bulan ${d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
      input_by_user_id: userId
    });
    
    console.log(`Inserted for ${d.toISOString().slice(0, 10)} : Sales IDR ${salesAmountStr} | Payroll IDR ${payrollAmountStr}`);
  }
  
  console.log('Seed completed successfully!');
}

seed()
  .catch(console.error)
  .finally(() => pool.end());
