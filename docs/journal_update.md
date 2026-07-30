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

### 📅 2026-07-30 - Modul Autentikasi & Otorisasi (JWT + First-Time Password Change)

**Aktor / Scope**: Authentication & Security (Tier 0 Foundation)  
**Status**: `DONE`

#### 🎯 Tujuan & Konteks
Mengimplementasikan modul autentikasi terpadu (*Unified Account & RBAC*) menggunakan JWT Access Token (30m) & Refresh Token (30d), mendukung login via Email, Username, atau NISN, serta alur wajib ubah password saat pertama kali login (`must_change_password`).

#### 🧠 Keputusan Arsitektur (Architectural Decisions)
- **Unified Identifier Login**: Mendukung 1 endpoint login (`POST /api/v1/auth/login`) yang bisa menerima `email`, `username` (misal: `budi.santoso.42`), atau `nisn` tanpa pendaftaran mandiri (*pure admin invitation*).
- **First-Time Forced Password Change**: Akun buatan Admin diberikan initial password dan flag `must_change_password = true`. Saat pertama login, user diwajibkan mengganti password baru via `POST /api/v1/auth/change-password`.
- **JWT Claims & Role-Based Access Control (RBAC)**: Middleware `authenticate` memverifikasi Bearer token (401: `"Session expired or unauthenticated. Please log in again."`), sedangkan `authorizeRoles` membatasi akses role (403: `"You do not have permission to access this resource."`). Log detail teknikal tetap dicatat di server console.
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
- `[NEW]` `src/routes/auth.route.js` - Pemetaan endpoint `/api/v1/auth/*`.
- `[NEW]` `scripts/seed_admin.js` - Script seeding akun Admin awal (`admin@eleva.sch.id` / `Admin123!`).

#### 🧪 Pengujian & Verifikasi
- [x] Executed `0002_add_must_change_password.sql` pada Neon PostgreSQL database.
- [x] Executed `seed_admin.js` untuk membuat akun Admin awal (`admin@eleva.sch.id`).

#### ⏭️ Langkah Selanjutnya (Next Steps)
- Modul Manajemen Sekolah & Peran Guru (Tier 1: Grade Levels, Classes, Subjects, Teacher Assignments).
