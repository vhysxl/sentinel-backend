import { pgTable, uuid, varchar, text, boolean, integer, numeric, jsonb, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { classes, subjects } from './school.schema.js';

export const questionTypeEnum = pgEnum('question_type', ['MULTIPLE_CHOICE', 'SHORT_ANSWER']);
export const quizSubmissionStatusEnum = pgEnum('quiz_submission_status', [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SUBMITTED',
  'GRADING_PENDING',
  'GRADED',
  'PUBLISHED',
]);

export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  questionType: questionTypeEnum('question_type').notNull(),
  questionText: text('question_text').notNull(),
  options: jsonb('options'),
  correctAnswer: text('correct_answer'),
  points: integer('points').default(1).notNull(),
  orderNumber: integer('order_number').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quizSubmissions = pgTable('quiz_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: quizSubmissionStatusEnum('status').default('NOT_STARTED').notNull(),
  totalScore: numeric('total_score', { precision: 5, scale: 2 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('submissions_unique').on(t.quizId, t.studentId),
]);

export const quizAnswers = pgTable('quiz_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').references(() => quizSubmissions.id, { onDelete: 'cascade' }).notNull(),
  questionId: uuid('question_id').references(() => quizQuestions.id, { onDelete: 'cascade' }).notNull(),
  studentAnswer: text('student_answer'),
  isCorrect: boolean('is_correct'),
  score: numeric('score', { precision: 5, scale: 2 }),
  aiScore: numeric('ai_score', { precision: 5, scale: 2 }),
  aiFeedback: text('ai_feedback'),
  teacherFeedback: text('teacher_feedback'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('answers_unique').on(t.submissionId, t.questionId),
]);
