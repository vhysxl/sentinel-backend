import { pgTable, serial, varchar, timestamp, decimal, text, integer } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { vendors } from './vendors.js';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),

  // Kapan transaksi terjadi menurut pengguna.
  //
  // withTimezone WAJIB. Tanpa itu Postgres menyimpan angka jam apa adanya tanpa
  // tahu itu jam mana, dan server database ber-timezone GMT — sehingga 09:00 WIB
  // tersimpan lalu terbaca 02:00. Kolom `users` sudah memakai timestamptz, jadi
  // ini juga menyamakannya dengan tabel lain.
  transaction_date: timestamp('transaction_date', { withTimezone: true }).notNull(),

  // Kapan baris ini tercatat ke sistem. Diisi database, TIDAK dikirim dari form.
  //
  // Ini yang dibaca agent server untuk menilai jam kerja: `transaction_date`
  // diketik pengguna, sehingga aturan "di luar jam kerja" bisa dihindari cukup
  // dengan mengetik jam yang wajar. `created_at` tidak bisa disentuh dari form.
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),

  // Pembeda pembayaran ganda dari split payment.
  //
  // Tanpa nomor faktur, dua pembayaran dengan vendor dan nominal sama tidak bisa
  // dibedakan: faktur yang sama dibayar dua kali (uang keluar dua kali), atau
  // dua faktur berbeda yang sengaja dipecah agar lolos ambang persetujuan.
  // Keduanya butuh tindakan yang berbeda.
  invoice_no: varchar('invoice_no', { length: 50 }),

  vendor_id: integer('vendor_id').references(() => vendors.id),
  input_by_user_id: integer('input_by_user_id').references(() => users.id)
});
