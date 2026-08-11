import { pgTable, serial, varchar, timestamp, decimal, text, integer } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { vendors } from './vendors.js';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),

  // SATU-SATUNYA waktu sebuah transaksi.
  //
  // Transaksi berasal dari mutasi bank: saat bank mencatatnya ITULAH saat
  // transaksi terjadi. Tidak ada tanggal terpisah yang diketik pengguna, jadi
  // tidak ada dua makna waktu yang perlu didamaikan — dan tidak ada yang bisa
  // dipalsukan dengan mengetik, yang penting karena aturan "di luar jam kerja"
  // di mesin audit dinilai atas kolom ini.
  //
  // withTimezone WAJIB. Tanpa itu Postgres menyimpan angka jam tanpa tahu itu
  // jam mana, dan server database ber-timezone GMT — sehingga 09:00 WIB
  // tersimpan lalu terbaca 02:00, dan aturan jam kerja terbalik.
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
