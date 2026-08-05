import { db, pool } from './src/db/client.js';
import { vendors } from './src/db/schema/vendors.js';

async function main() {
  try {
    const allVendors = await db.select().from(vendors);
    console.log(JSON.stringify(allVendors, null, 2));
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await pool.end();
    process.exit(1);
  }
}

main();
