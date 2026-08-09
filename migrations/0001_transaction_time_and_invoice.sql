-- Menyelaraskan skema dengan kolom yang sudah dipakai agent server.
--
-- Ditulis idempoten dengan sengaja: kolom-kolom ini sudah ada di database
-- pengembangan (dibuat lewat migrate.py di sisi agent server), sementara
-- database baru belum punya. Versi hasil `drizzle-kit generate` akan gagal di
-- database pertama karena memakai ADD COLUMN polos.

-- transaction_date -> timestamptz
--
-- USING ... AT TIME ZONE 'Asia/Jakarta' WAJIB dan bukan hiasan. Tanpa klausa
-- itu Postgres menafsirkan nilai naif yang sudah ada memakai timezone SESI —
-- dan server database ini ber-timezone GMT, sehingga setiap 09:00 WIB akan
-- bergeser menjadi 02:00. Versi hasil generate tidak menyertakannya.
--
-- Dibungkus pemeriksaan supaya aman dijalankan ulang.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions'
          AND column_name = 'transaction_date'
          AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE "transactions"
            ALTER COLUMN "transaction_date" TYPE timestamp with time zone
            USING "transaction_date" AT TIME ZONE 'Asia/Jakarta';
    END IF;
END $$;
--> statement-breakpoint

-- Waktu pencatatan, diisi database. Tidak pernah dikirim dari form.
ALTER TABLE "transactions"
    ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint

-- Nomor faktur: pembeda pembayaran ganda dari split payment.
ALTER TABLE "transactions"
    ADD COLUMN IF NOT EXISTS "invoice_no" varchar(50);
