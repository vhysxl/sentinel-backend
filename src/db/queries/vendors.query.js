import { eq, desc } from 'drizzle-orm';
import { db } from '../client.js';
import { vendors } from '../schema/vendors.js';

/**
 * Every read/write against the vendors table lives here. Services never touch
 * drizzle directly, so the query shapes stay in one place.
 */
export class VendorsQuery {
  static async findAll() {
    return await db.select().from(vendors).orderBy(desc(vendors.join_date));
  }

  static async findById(id) {
    const rows = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return rows[0] || null;
  }

  static async create({ vendor_name, bank_account, status }) {
    const rows = await db
      .insert(vendors)
      .values({ vendor_name, bank_account, status: status || 'active' })
      .returning();
    return rows[0];
  }

  static async update(id, data) {
    const rows = await db.update(vendors).set(data).where(eq(vendors.id, id)).returning();
    return rows[0];
  }
}
