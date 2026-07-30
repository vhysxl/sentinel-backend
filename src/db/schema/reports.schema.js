import { pgTable, uuid, text, integer, boolean, jsonb, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { classes } from './school.schema.js';

export const reportStatusEnum = pgEnum('report_status', ['DRAFT', 'UNDER_REVIEW', 'PUBLISHED']);

export const monthlyReports = pgTable('monthly_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  status: reportStatusEnum('status').default('DRAFT').notNull(),
  aiSummary: text('ai_summary'),
  aiRecommendations: jsonb('ai_recommendations'),
  teacherNotes: text('teacher_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('monthly_reports_unique').on(t.studentId, t.classId, t.month, t.year),
]);

export const semesterReports = pgTable('semester_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  semester: integer('semester').notNull(),
  year: integer('year').notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  reportData: jsonb('report_data'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockedBy: uuid('locked_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('semester_reports_unique').on(t.studentId, t.classId, t.semester, t.year),
]);
