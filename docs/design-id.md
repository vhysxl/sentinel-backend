# 🎓 Eleva

> Sistem Manajemen Pembelajaran (LMS) Berbasis AI untuk Sekolah K-12 (SD, SMP, SMA)

Eleva adalah platform LMS berbasis kecerdasan buatan yang dirancang khusus untuk sekolah-sekolah di Indonesia. Platform ini membantu guru mengurangi beban administratif melalui pembuatan soal otomatis berbasis AI, penilaian otomatis, dan laporan perkembangan siswa yang cerdas.

---

# ✨ Fitur

## 👨‍💼 Admin

- Kelola struktur sekolah
- Kelola tingkat kelas dan kelas
- Kelola mata pelajaran (tambah, edit, hapus — misalnya saat kurikulum berubah)
- Kelola akun guru
- Kelola akun siswa
- Tetapkan wali kelas
- Tetapkan guru mata pelajaran

---

## 👨‍🏫 Wali Kelas

- Dashboard performa siswa
- Pemantauan lintas mata pelajaran
- Pembuatan rapor semester
- Moderasi laporan kemajuan bulanan
- Deskripsi kompetensi berbantuan AI

---

## 📚 Guru Mata Pelajaran

- Manajemen multi-kelas
- Jadwal mengajar
- Manajemen kehadiran (per mata pelajaran / sesi)
- Materi pembelajaran
- Manajemen kuis
- Manajemen tugas *(prioritas rendah)*
- Generator Soal AI
- Penilaian Kuis (otomatis + review berbantuan AI)

---

## 👨‍🎓 Siswa

- Login dengan aman
- Lihat materi pembelajaran
- Kerjakan kuis
- Kumpulkan tugas *(prioritas rendah)*
- Lihat nilai
- Lihat umpan balik
- Pantau kehadiran
- Lihat laporan kemajuan bulanan

---

> Catatan: Seorang guru dapat sekaligus menjadi wali kelas dan guru mata pelajaran, bahkan mengajar beberapa mata pelajaran sekaligus.

---

# 🤖 Fitur AI

## Generator Soal AI

Guru dapat mengunggah materi pembelajaran dan menghasilkan:

- Soal Pilihan Ganda
- Soal Jawaban Singkat

Soal yang dihasilkan dapat diedit sebelum dipublikasikan.

---

## Penilaian Otomatis AI

### Pilihan Ganda

- Penilaian sepenuhnya otomatis
- Hasil langsung tersedia

### Jawaban Singkat

- AI menghasilkan:
  - Skor
  - Penjelasan
  - Saran umpan balik

Guru me-review dan menyetujui hasil sebelum dipublikasikan ke siswa.

---

## Laporan Kemajuan AI

Setiap bulan AI menganalisis:

- Nilai kuis
- Nilai tugas *(jika tersedia)*
- Kehadiran
- Ketepatan waktu pengumpulan

AI menghasilkan rekomendasi personal untuk setiap siswa.

Wali kelas dapat mengedit atau menghapus rekomendasi sebelum dipublikasikan.

> **Trigger (saat ini):** Admin memicu pembuatan laporan secara manual melalui endpoint API khusus.  
> **Masa depan:** Cron job terjadwal (misalnya, akhir setiap bulan).

---

# 👥 Peran Pengguna

| Peran | Deskripsi |
|-------|-----------|
| Admin | Administrator sekolah |
| Wali Kelas | Memantau siswa di semua mata pelajaran |
| Guru Mata Pelajaran | Mengelola kegiatan belajar mengajar |
| Siswa | Portal belajar |

## Model Peran Guru

Di Indonesia, seorang guru umumnya memegang beberapa peran sekaligus:

- Seorang **wali kelas** hampir selalu juga mengajar satu atau lebih mata pelajaran.
- Di tingkat **SMP/SMA**: wali kelas + guru mata pelajaran tertentu.
- Di tingkat **SD**: wali kelas dapat mengajar sebagian besar mata pelajaran sendiri (misalnya Matematika, Bahasa Indonesia, IPA), kecuali mata pelajaran spesialis seperti Bahasa Inggris atau Bahasa Daerah yang diajar oleh guru khusus.

Oleh karena itu, sistem memperlakukan peran guru sebagai **penugasan tambahan pada satu akun yang sama**, bukan akun terpisah. Satu akun guru dapat:

- Ditugaskan sebagai wali kelas untuk suatu kelas
- Ditugaskan sebagai guru mata pelajaran untuk satu atau lebih mata pelajaran di satu atau lebih kelas

Tampilan UI menyesuaikan fitur yang tersedia berdasarkan peran yang telah ditugaskan.

---

# 🔐 Autentikasi

## Admin

- Username atau email
- Password
- Google OAuth

## Guru (Wali Kelas & Mata Pelajaran)

> Guru harus **diundang oleh Admin** melalui email sebelum dapat mendaftar. Sistem menyimpan daftar putih (whitelist) email yang diundang — hanya email yang ada di whitelist yang dapat membuat akun guru.

- Username atau email
- Password
- Google OAuth

## Siswa

> Siswa **tidak** mendukung Google OAuth, karena siswa yang lebih muda (SD) mungkin belum memiliki akun Google.

Opsi login:
- NISN (Nomor Induk Siswa Nasional)
- Username yang dihasilkan sistem (kombinasi nama + angka unik, contoh: `budi.santoso.42`)
- Password

Username dibuat otomatis oleh sistem saat akun dibuat dan dapat dibagikan kepada orang tua/siswa.

> Pendaftaran mandiri dinonaktifkan. Semua akun dibuat dan dikelola oleh administrator sekolah.

---

# 📊 Modul Inti

## Manajemen Sekolah

- Struktur sekolah
- Tingkat kelas
- Kelas
- **Mata pelajaran** (dikelola Admin, digunakan sebagai referensi penugasan guru)
- Manajemen siswa
- Manajemen guru

---

## Akademik

- Materi pembelajaran
- Kuis *(MVP)*
- Tugas *(prioritas rendah — belum ada unggah file)*
- Kehadiran (per mata pelajaran / sesi)
- Nilai

> **Ujian (Exam)** tidak termasuk dalam lingkup saat ini. Dipindahkan ke roadmap masa depan.

---

## Pelaporan

### Rapor Semester

Rapor resmi sekolah.

Karakteristik:

- Snapshot (tidak berubah)
- Dikunci setelah finalisasi

---

### Laporan Kemajuan Bulanan

Berisi:

- Perkembangan belajar
- Rekomendasi AI
- Ringkasan kehadiran
- Performa per mata pelajaran

Karakteristik:

- Bersifat live (dapat diperbarui)
- Dapat diedit oleh guru

---

# 📈 Model Nilai

Eleva memisahkan penilaian menjadi tiga lapisan.

```
Nilai Mentah (Raw Scores)
        │
        ├────────► Rapor Semester
        │
        └────────► Laporan Kemajuan Bulanan
```

## Nilai Mentah (Raw Scores)

Satu-satunya sumber kebenaran (single source of truth), berisi:

- Kuis
- Tugas *(prioritas rendah)*
- Kehadiran

---

## Rapor Semester

Menggunakan:

- Penilaian sumatif
- Bobot yang dikonfigurasi sekolah *(TBD)*

Karakteristik:

- Snapshot
- Dikunci

---

## Laporan Kemajuan Bulanan

Menggunakan:

- Penilaian formatif
- Penilaian sumatif
- Kehadiran
- Perilaku belajar (ketepatan pengumpulan, dll.)

Karakteristik:

- Bersifat live
- Rekomendasi dihasilkan oleh AI

---

# 🔒 Matriks Izin

| Modul               | Admin                    | Wali Kelas          | Guru Mata Pelajaran           | Siswa                     |
| --------------------| -------------------------| --------------------| ------------------------------| --------------------------|
| Manajemen Sekolah   | ✅ CRUD                  | 👀 Lihat            | 👀 Lihat                      | ❌                        |
| Mata Pelajaran      | ✅ CRUD                  | 👀 Lihat            | 👀 Lihat                      | ❌                        |
| Siswa               | ✅ CRUD                  | 👀 Lihat            | 👀 Lihat                      | ❌                        |
| Guru                | ✅ CRUD                  | 👀 Lihat            | 👀 Lihat                      | ❌                        |
| Nilai               | 👀 Lihat                 | Semua Mapel         | Mapel Sendiri                 | Milik sendiri (jika pub.) |
| Kehadiran           | 👀 Lihat                 | Semua kelas         | Kelas sendiri                 | Milik sendiri             |
| Materi              | 👀 Lihat                 | 👀 Lihat            | ✅ Kelola                     | 👀 Lihat                  |
| Kuis                | 👀 Lihat                 | 👀 Lihat            | ✅ Kelola                     | 📝 Kerjakan               |
| Tugas               | 👀 Lihat                 | 👀 Lihat            | ✅ Kelola *(prioritas rendah)* | 📤 Kumpulkan              |
| Laporan             | 👀 Lihat + Trigger AI    | ✅ Review & Publish | 👀 Lihat nilai mentah         | 👀 Lihat (jika dipub.)    |

### State Machine & Alur Status

#### Status Kuis & Pengerjaan Siswa
`NOT_STARTED` ➔ `IN_PROGRESS` ➔ `SUBMITTED` ➔ `GRADING_PENDING` (Review AI/Guru) ➔ `GRADED` ➔ `PUBLISHED`

#### Status Laporan Kemajuan Bulanan
`DRAFT` (Dihasilkan AI) ➔ `UNDER_REVIEW` (Ditinjau Wali Kelas) ➔ `PUBLISHED` (Terlihat oleh Siswa)

#### Status Job Pemrosesan AI (Queue)
`PENDING` ➔ `PROCESSING` ➔ `COMPLETED` / `FAILED`

### Alur Publikasi Nilai

```
Nilai Mentah (DB)
      │
      ▼
Guru Mapel me-review (privat, belum dipublikasikan)
      │
      ├── Guru mengedit jika diperlukan (remedial / tugas tambahan)
      │
      ▼
Guru menyetujui & mempublikasikan
      │
      ▼
Terlihat oleh Siswa
```

---

# 🚀 Lingkup MVP

- Autentikasi (Admin + Guru via undangan + Siswa via NISN/username generate)
- Manajemen sekolah
- Manajemen guru (peran wali kelas + guru mapel dalam satu akun)
- Manajemen siswa
- Materi pembelajaran
- Kuis (Generator Soal AI + Penilaian Otomatis AI)
- Kehadiran
- Laporan Kemajuan Bulanan (dihasilkan AI, dipicu via endpoint admin)
- Rapor Semester

### Prioritas Rendah (Stretch MVP)

- Tugas (berbasis teks saja, belum ada unggah file)

---

# 🔮 Roadmap Masa Depan

### Akademik
- Modul ujian/exam (formal, terbatas waktu, lingkungan terkontrol)
- Unggah file tugas (dokumen, gambar)
- Bank soal
- Persetujuan massal berbasis confidence score AI

### Platform
- Portal orang tua
- Pengumuman sekolah
- Notifikasi in-app (nilai keluar, laporan siap)
- Sistem chat
- Audit log (perubahan nilai/laporan)
- Modul pembayaran

### Infrastruktur & Integrasi
- Aplikasi mobile
- Integrasi sistem pemerintah (Dapodik, dll.)

### AI
- Laporan kemajuan AI terjadwal (berbasis cron, bukan hanya trigger admin)
- RAG untuk pembuatan soal yang lebih kontekstual

---

# 🛠 Tech Stack (Usulan)

## Backend

- Node.js
- Express.js
- PostgreSQL
- BullMQ + Redis (Queue & Background Job Pemrosesan AI)
- Zod (Validasi Skema & Structured AI Output)

## AI

- Google Gemini API (dengan Zod Structured Outputs)
- RAG *(opsional)*
- Vector database

## Frontend

- React
- Zustand

## Infrastruktur

- Docker
- GitHub Actions
- GCP Cloud Run

---

# 🎯 Visi

Memberdayakan guru dengan AI agar mereka dapat menghabiskan lebih sedikit waktu untuk pekerjaan administratif dan lebih banyak waktu untuk membantu siswa belajar.

---

Dibangun dengan ❤️ untuk pendidikan modern Indonesia.
