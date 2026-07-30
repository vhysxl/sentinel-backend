import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'TEACHER', 'STUDENT']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  role: userRoleEnum('role').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 100 }).unique(),
  nisn: varchar('nisn', { length: 20 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  mustChangePassword: boolean('must_change_password').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teacherInvitations = pgTable('teacher_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
