import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  fullname: varchar('fullname', { length: 100 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  department: varchar('department', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
