import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  vendor_name: varchar('vendor_name', { length: 100 }).notNull(),
  bank_account: varchar('bank_account', { length: 50 }).notNull(),
  join_date: timestamp('join_date').defaultNow(),
  status: varchar('status', { length: 20 }).default('active')
});
