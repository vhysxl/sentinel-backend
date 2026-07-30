import { pgTable, uuid, text, date, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { classes, subjects } from './school.schema.js';

export const attendanceStatusEnum = pgEnum('attendance_status', ['PRESENT', 'SICK', 'PERMITTED', 'ABSENT']);

export const attendanceSessions = pgTable('attendance_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  sessionDate: date('session_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('session_unique').on(t.teacherId, t.subjectId, t.classId, t.sessionDate),
]);

export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => attendanceSessions.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: attendanceStatusEnum('status').default('PRESENT').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('records_unique').on(t.sessionId, t.studentId),
]);
