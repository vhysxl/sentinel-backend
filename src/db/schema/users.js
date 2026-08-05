import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * One table for the whole finance team. There is no role system: `isAdmin`
 * marks a Finance Lead and guards only the /users endpoints.
 *
 * `passwordHash` is nullable on purpose — NULL means the account signs in
 * through Google only, either because it was never given a password or
 * because its temporary one was burned on first Google login.
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullname: varchar('fullname', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  googleSub: varchar('google_sub', { length: 255 }).unique(),
  isAdmin: boolean('is_admin').notNull().default(false),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
});
