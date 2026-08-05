import { db, pool } from './src/db/client.js';
import { vendors } from './src/db/schema/vendors.js';
import { transactions } from './src/db/schema/transactions.js';
import { users } from './src/db/schema/users.js';

async function seed() {
  try {
    // 1. Check if we have at least one user to be the 'input_by_user_id'
    const allUsers = await db.select().from(users).limit(1);
    let userId = 1; // fallback
    if (allUsers.length > 0) {
      userId = allUsers[0].id;
    } else {
      console.log('Warning: No users found. Transactions require input_by_user_id. The seed might fail if user 1 does not exist.');
    }

    // 2. Insert Vendors
    const insertedVendors = await db.insert(vendors).values([
      {
        vendor_name: 'PT. Solusi Teknologi Makmur',
        bank_account: 'BCA - 1234567890',
        status: 'active'
      },
      {
        vendor_name: 'CV. ATK Sejahtera',
        bank_account: 'Mandiri - 0987654321',
        status: 'active'
      }
    ]).returning();

    console.log('Inserted vendors:', insertedVendors.map(v => v.id));

    // 3. Insert Transactions
    const insertedTransactions = await db.insert(transactions).values([
      {
        transaction_date: new Date('2024-03-01T10:00:00Z'),
        amount: '1500000.00',
        type: 'expense',
        category: 'IT Services',
        description: 'Pembayaran layanan server',
        vendor_id: insertedVendors[0].id,
        input_by_user_id: userId
      },
      {
        transaction_date: new Date('2024-03-02T11:00:00Z'),
        amount: '500000.00',
        type: 'expense',
        category: 'Office Supplies',
        description: 'Pembelian alat tulis kantor',
        vendor_id: insertedVendors[1].id,
        input_by_user_id: userId
      }
    ]).returning();

    console.log('Inserted transactions:', insertedTransactions.map(t => t.id));

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
