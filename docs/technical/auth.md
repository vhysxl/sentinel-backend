# 🔐 Technical Documentation - Authentication & Authorization Module

Dokumen teknikal ini menjelaskan arsitektur, alur kerja, spesifikasi API, dan skema validasi untuk modul **Autentikasi & Otorisasi (Tier 0 Foundation)** pada sistem **Eleva LMS**.

---

## 🏗️ Arsitektur Autentikasi

Eleva LMS menggunakan strategi **Unified Account & Pure Admin Invitation** dengan token **JWT (JSON Web Token)**:

- **Tanpa Pendaftaran Mandiri (Self-Registration Disabled)**: Semua akun (Admin, Guru, Siswa) 100% dibuat dan diatur oleh Administrator Sekolah.
- **Unified Identifier Login**: Pengguna dapat login menggunakan **Email**, **Username** (contoh: `budi.santoso.42`), atau **NISN** melalui satu endpoint tunggal (`POST /api/v1/auth/login`).
- **Strategi Token Dual (Access & Refresh Tokens)**:
  - **Access Token**: Masa berlaku **30 menit** (`30m`), dikirim pada header HTTP `Authorization: Bearer <token>`.
  - **Refresh Token**: Masa berlaku **30 hari** (`30d`), digunakan untuk mendapatkan Access Token baru via `POST /api/v1/auth/refresh`.
- **Alur Ubah Password Login Pertama (First-Time Login Flow)**:
  - Akun buatan Admin diberi initial password dan status `must_change_password = true`.
  - Pada login pertama, API mengembalikan flag `mustChangePassword: true`.
  - Pengguna diwajibkan mengganti password baru via `POST /api/v1/auth/change-password` sebelum diperbolehkan mengakses fitur sekolah lainnya.
- **Integrasi Google OAuth (SSO & Account Matching)**:
  - Menggunakan Google Sign-In SDK (`google-auth-library`) untuk memverifikasi Google ID Token (`POST /api/v1/auth/google`).
  - **Strict Pre-Created Account Matching**: Akun pengguna **wajib sudah terdaftar** di database `users` (dibuat oleh Admin / di-sync dari Dapodik). Jika email Google belum terdaftar di database, API menolak dengan HTTP `403 Forbidden` (`GOOGLE_ACCOUNT_NOT_REGISTERED`).
  - **Auto-Linking Google ID**: Pada login Google pertama kali, `google_id` otomatis di-link ke baris pengguna yang cocok di database.
  - Mempertahankan alur `mustChangePassword` pada login pertama agar pengguna menetapkan password pribadi lokal.

---


## 🗄️ Skema Tabel `users`

| Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique ID pengguna (v4 gen_random_uuid) |
| `role` | `user_role` | `NOT NULL` | Enum: `ADMIN`, `TEACHER`, `STUDENT` |
| `name` | `VARCHAR(255)` | `NOT NULL` | Nama lengkap pengguna |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | Email (Admin & Guru) |
| `username` | `VARCHAR(100)` | `UNIQUE`, `NULLABLE` | Username unik (Admin & Siswa) |
| `nisn` | `VARCHAR(20)` | `UNIQUE`, `NULLABLE` | Nomor Induk Siswa Nasional |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Hash password (bcryptjs, cost factor 10) |
| `google_id` | `VARCHAR(255)` | `UNIQUE`, `NULLABLE` | ID Google OAuth |
| `must_change_password`| `BOOLEAN` | `NOT NULL`, `DEFAULT TRUE` | Flag wajib ganti password di login 1 |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT TRUE` | Status aktif akun |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Waktu pembuatan akun |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Waktu pembaruan akun |

---

## 📡 Spesifikasi Endpoints API

### 1. Login (`POST /api/v1/auth/login`)
Memverifikasi identitas pengguna (Email/Username/NISN + Password) dan mengembalikan Access Token & Refresh Token.

- **Access**: Public
- **Validation**: Zod `loginSchema` (`identifier` min 1, `password` min 1)

#### Request Body
```json
{
  "identifier": "admin@eleva.sch.id",
  "password": "Admin123!"
}
```

#### Successful Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6852d6e8-7daa-4804-9037-c499c105a123",
      "role": "ADMIN",
      "name": "Administrator Eleva",
      "email": "admin@eleva.sch.id",
      "username": "admin",
      "nisn": null,
      "googleId": null,
      "isActive": true,
      "mustChangePassword": true,
      "createdAt": "2026-07-30T17:33:00.000Z",
      "updatedAt": "2026-07-30T17:33:00.000Z"
    },
    "mustChangePassword": true,
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

### 2. Google OAuth Login (`POST /api/v1/auth/google`)
Memverifikasi `idToken` dari Google Sign-In, mencocokkan `google_id` / `email` dengan akun pengguna yang telah didaftarkan Admin.

- **Access**: Public
- **Validation**: Zod `googleLoginSchema` (`idToken` min 1)

#### Request Body
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

#### Successful Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "user": {
      "id": "6852d6e8-7daa-4804-9037-c499c105a123",
      "role": "TEACHER",
      "name": "Budi Guru",
      "email": "budi@eleva.sch.id",
      "googleId": "109876543210987654321",
      "isActive": true,
      "mustChangePassword": true
    },
    "mustChangePassword": true,
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Error Account Not Registered (HTTP 403 Forbidden)
```json
{
  "success": false,
  "message": "This Google account is not registered in Eleva LMS. Please contact school Administrator."
}
```


---

### 2. Ganti Password (`POST /api/v1/auth/change-password`)
Mengubah password pengguna dan mengubah status `must_change_password` menjadi `false`.

- **Access**: Authenticated (Bearer Token)
- **Headers**: `Authorization: Bearer <access_token>`
- **Validation**: Zod `changePasswordSchema` (`newPassword` min 6)

#### Request Body
```json
{
  "oldPassword": "Admin123!",
  "newPassword": "NewAdminPass123!"
}
```

#### Successful Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Password successfully changed. You can now use your new password.",
  "data": {
    "id": "6852d6e8-7daa-4804-9037-c499c105a123",
    "role": "ADMIN",
    "name": "Administrator Eleva",
    "email": "admin@eleva.sch.id",
    "mustChangePassword": false
  }
}
```

---

### 3. Refresh Access Token (`POST /api/v1/auth/refresh`)
Memperbarui Access Token yang sudah kadaluarsa menggunakan Refresh Token yang valid.

- **Access**: Public
- **Validation**: Zod `refreshTokenSchema` (`refreshToken` min 1)

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Successful Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Get Current User Profile (`GET /api/v1/auth/me`)
Mengambil data profil pengguna yang sedang terautentikasi.

- **Access**: Authenticated (Bearer Token)
- **Headers**: `Authorization: Bearer <access_token>`

#### Successful Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Authenticated user profile retrieved",
  "data": {
    "id": "6852d6e8-7daa-4804-9037-c499c105a123",
    "role": "ADMIN",
    "name": "Administrator Eleva",
    "email": "admin@eleva.sch.id",
    "username": "admin",
    "mustChangePassword": false
  }
}
```

---

## 🛑 Format Error Standards

Semua error mengikuti format JSON standar terpusat:

### Error Autentikasi Hilang/Kadaluarsa (HTTP 401 Unauthorized)
```json
{
  "success": false,
  "message": "Session expired or unauthenticated. Please log in again."
}
```

### Error Hak Akses Role (HTTP 403 Forbidden)
```json
{
  "success": false,
  "message": "You do not have permission to access this resource."
}
```

### Error Validasi Zod (HTTP 400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid request data provided",
  "errors": {
    "identifier": "Email, Username, or NISN is required",
    "password": "Password cannot be empty"
  }
}
```
