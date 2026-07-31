# Eleva Frontend - Student Login Test App Design

**Tanggal**: 2026-07-31
**Status**: Approved

## Tujuan

Membuat aplikasi frontend sederhana (`eleva-frontend`) untuk mencoba alur autentikasi siswa
terhadap API `eleva-backend`: login (NISN/username + password), forced change-password, dan profil.

## Lokasi

```
E:\file rivan\Bootcamp\KADA-BATCH-4\Eleva-Capstone\
├── eleva-backend/
└── eleva-frontend/   <- baru
```

## Tech Stack

- **React + Vite** (dev server port `3000` — wajib, karena CORS backend hanya mengizinkan `http://localhost:3000`)
- Tanpa react-router: state `view` (`login` | `changePassword` | `profile`) cukup untuk 3 layar.
- **Vite proxy** `/api` → `http://localhost:5000` (menghindari CORS/mixed-content di dev).

## Struktur

```
eleva-frontend/
├── vite.config.js          (port 3000, proxy /api -> http://localhost:5000)
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx             (state view + routing sederhana)
    ├── api/client.js       (fetch wrapper: base /api/v1, Bearer header, error handling)
    ├── auth/token.js       (localStorage helpers: get/set/clear accessToken & refreshToken)
    └── pages/
        ├── LoginPage.jsx
        ├── ChangePasswordPage.jsx
        └── ProfilePage.jsx
```

## Alur Data

1. **LoginPage** → `POST /api/v1/auth/login` `{ identifier, password }`
   - Simpan `accessToken` & `refreshToken` ke localStorage.
   - Jika `mustChangePassword === true` → `view = changePassword`.
   - Jika `false` → `view = profile`.
2. **ChangePasswordPage** → `POST /api/v1/auth/change-password` `{ oldPassword, newPassword }` (Bearer header)
   - Sukses → simpan `refreshToken` (response tidak mengembalikan accessToken; accessToken lama tetap valid) → `view = profile`.
3. **ProfilePage** → `GET /api/v1/auth/me` (Bearer header) → tampilkan nama, role, username, NISN.
   - Tombol **Logout** → clear token → `view = login`.

## Error Handling

- `api/client.js` melempar `Error(message)` dari response `{ message }`.
- Setiap halaman menampilkan `error` di bawah form.
- Jika `/me` atau `change-password` gagal dengan 401 → clear token → `view = login`.

## Akun Siswa Test

Seed script baru di backend `eleva-backend/scripts/seed_student.js` (idempotent, pola sama dengan `seed_admin.js`):

| Field | Value |
| :--- | :--- |
| role | `STUDENT` |
| name | `Budi Santoso` |
| nisn | `0012345678` |
| username | `budi.santoso.42` |
| email | `null` |
| password | `Siswa123!` |
| must_change_password | `true` |

`must_change_password = true` agar alur forced change-password ikut teruji.

## Catatan Backend

- `.env` backend diisi ulang (dihapus saat revert) agar server & seed bisa terhubung ke Neon.
- Server backend dijalankan dengan `npm run dev` pada port `5000`.

## Verifikasi

1. `node scripts/seed_student.js` → akun siswa dibuat.
2. Backend jalan di `:5000`, frontend di `:3000`.
3. Test alur: login siswa → forced change password → profile → logout.
