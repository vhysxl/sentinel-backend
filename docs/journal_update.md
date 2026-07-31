# 📓 Eleva LMS - Development Journal & Change Log

Dokumen ini berfungsi sebagai **catatan perkembangan proyek (journal log)** dan **keputusan arsitektur (Architecture Decision Record - ADR)** untuk memastikan konteks teknis, alasan di balik setiap keputusan, serta perubahan kode tidak hilang seiring berjalannya proyek.

---

## 📖 Panduan Pengisian Journal (Journaling Guideline)

Setiap kali menyelesaikan sebuah fitur, modul, atau perubahan arsitektur penting, tambahkan entri baru di bagian **Log Perkembangan (Development Log)** dengan format berikut:

```markdown
### 📅 [YYYY-MM-DD] - [Nama Fitur / Modul]

**Aktor / Scope**: [Admin / Guru / Siswa / Core System]
**Status**: [DONE / IN_PROGRESS / DEPRECATED]

#### 🎯 Tujuan & Konteks
Singkatan penjelasan mengenai fitur yang dibangun atau masalah yang diselesaikan.

#### 🧠 Keputusan Arsitektur (Architectural Decisions)
- **Keputusan 1**: [Alasan pemilihan strategi, misal: Menggunakan JWT + Cookie HTTPOnly untuk Auth]
- **Trade-off**: [Dampak dari keputusan tersebut]

#### 🛠️ Perubahan & Komponen Utama
- `[NEW/MODIFY/DELETE]` `path/to/file.js` - Penjelasan singkat fungsi file/modul.

#### ⏭️ Langkah Selanjutnya (Next Steps)
- Modul atau dependensi fitur berikutnya yang perlu dikerjakan.
```

---

## 📜 Log Perkembangan Proyek (Development Log)

### 📅 2026-07-31 - Modul Google OAuth & Refactoring Keamanan Ganti Password

**Aktor / Scope**: Authentication & Security (Tier 0 Foundation)  
**Status**: `DONE`

#### 🎯 Tujuan & Konteks
Mengintegrasikan autentikasi Google OAuth (`POST /api/v1/auth/google`) menggunakan Google Sign-In SDK (`google-auth-library`), mendukung pencocokan otomatis `google_id` dan `email` untuk akun terdaftar (*Pure Admin Invitation*), mempertahankan alur wajib ganti password pada login pertama, serta memperbaiki penanganan error pada fitur ubah password.

#### 🧠 Keputusan Arsitektur (Architectural Decisions)
- **Centralized Account & Strict Pre-Created Matching**: Tidak mengizinkan registrasi mandiri akun Google baru. Hanya akun dengan email yang sudah didaftarkan Admin / di-sync dari Dapodik yang dapat mengakses sistem (HTTP 403 Forbidden untuk email asing).
- **Auto-linking Google ID**: Jika email cocok pada login Google pertama, `google_id` otomatis di-link ke akun pengguna yang sudah ada di database `users`.
- **First-Time Password Change Persistence**: Flag `must_change_password` tetap dipertahankan meski login via Google OAuth, memaksa pengguna membuat password lokal saat pertama kali masuk.
- **Pure Backend API Architecture**: Seluruh aset frontend/dummy UI dibersihkan dari repositori backend agar tetap menjadi murni RESTful API service.

#### 🛠️ Perubahan & Komponen Utama
- `[MODIFY]` `.env` & `.env.example` - Menambahkan variabel `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`.
- `[MODIFY]` `src/config/env.config.js` - Memvalidasi variabel Google OAuth menggunakan Zod schema.
- `[MODIFY]` `src/constants/error-messages.constant.js` - Penambahan pesan error terstandar untuk Google Auth dan password lama.
- `[MODIFY]` `src/db/queries/users.query.js` - Menambahkan method `findByGoogleId` dan merapikan method `linkGoogleId`.
- `[MODIFY]` `src/services/auth.service.js` - Penambahan method `googleLogin` dengan fallback clock skew dan perbaikan logika verifikasi `oldPassword`.
- `[MODIFY]` `src/controllers/auth.controller.js` & `src/routes/auth.route.js` - Endpoint `POST /api/v1/auth/google`.
- `[MODIFY]` `src/app.js` - Menghapus static file serving dan mengembalikan konfigurasi dasar Helmet.

---


### 📅 2026-07-30 - Modul Autentikasi & Otorisasi (JWT + First-Time Password Change)


**Aktor / Scope**: Authentication & Security (Tier 0 Foundation)  
**Status**: `DONE`

#### 🎯 Tujuan & Konteks
Mengimplementasikan modul autentikasi terpadu (*Unified Account & RBAC*) menggunakan JWT Access Token (30m) & Refresh Token (30d), mendukung login via Email, Username, atau NISN, serta alur wajib ubah password saat pertama kali login (`must_change_password`).

#### 🧠 Keputusan Arsitektur (Architectural Decisions)
- **Unified Identifier Login**: Mendukung 1 endpoint login (`POST /api/v1/auth/login`) yang bisa menerima `email`, `username` (misal: `budi.santoso.42`), atau `nisn` tanpa pendaftaran mandiri (*pure admin invitation*).
- **First-Time Forced Password Change**: Akun buatan Admin diberikan initial password dan flag `must_change_password = true`. Saat pertama login, user diwajibkan mengganti password baru via `POST /api/v1/auth/change-password`.
- **Validasi Terpusat dengan Zod**: Mengintegrasikan `validate(schema)` middleware menggunakan library Zod di layer route (`src/validations/*`), serta memvalidasi variabel lingkungan `process.env` menggunakan `z.object()` pada `src/config/env.config.js` untuk menjamin data masukan selalu bersih.
- **Migrasi Schema SQL 0002**: Menambahkan kolom `must_change_password BOOLEAN NOT NULL DEFAULT TRUE` di tabel `users` database Neon PostgreSQL.

#### 🛠️ Perubahan & Komponen Utama
- `[NEW]` `migrations/0002_add_must_change_password.sql` - File migrasi penambahan kolom `must_change_password`.
- `[MODIFY]` `src/db/schema/users.schema.js` & `migrations/0001_initial_schema.sql` - Penambahan definisi kolom `mustChangePassword` pada skema Drizzle & SQL.
- `[NEW]` `src/utils/password.util.js` - Helper hash & compare password menggunakan `bcryptjs`.
- `[NEW]` `src/utils/jwt.util.js` - Helper sign & verify JWT Access (30m) dan Refresh (30d) Tokens.
- `[NEW]` `src/db/queries/users.query.js` - Layer query DB untuk user (`findByIdentifier`, `updatePassword`, `create`).
- `[NEW]` `src/services/auth.service.js` - Logika bisnis login, change password, refresh token, dan get me profile.
- `[NEW]` `src/controllers/auth.controller.js` - Controller handler untuk HTTP API Auth.
- `[NEW]` `src/middlewares/auth.middleware.js` - Middleware `authenticate` JWT dan `authorizeRoles` RBAC.
- `[NEW]` `docs/technical/auth.md` - Dokumentasi teknikal modul Autentikasi (Spesifikasi API, Request/Response payload, Zod validation, HTTP status standards).
- `[NEW]` `postman/eleva_auth_postman_collection.json` - Postman Collection v2.1.0 dengan otomatisasi *auto-save token variables* (`accessToken`, `refreshToken`).

#### 🧪 Pengujian & Verifikasi
- [x] Executed `0002_add_must_change_password.sql` pada Neon PostgreSQL database.
- [x] Executed `seed_admin.js` untuk membuat akun Admin awal (`admin@eleva.sch.id`).

#### ⏭️ Langkah Selanjutnya (Next Steps)
- Modul Manajemen Sekolah & Peran Guru (Tier 1: Grade Levels, Classes, Subjects, Teacher Assignments).
