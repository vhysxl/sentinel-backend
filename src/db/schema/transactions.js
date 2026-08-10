import { pgTable, serial, varchar, timestamp, decimal, text, integer } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { vendors } from './vendors.js';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  vendor_id: integer('vendor_id').references(() => vendors.id),
  input_by_user_id: integer('input_by_user_id').references(() => users.id)
});
