# 🔄 Eleva LMS - User Flow (Bagan Alir Pengguna)

Dokumen ini menggambarkan alur interaksi pengguna (*user flow*) untuk setiap peran dalam sistem **Eleva LMS**, berdasarkan spesifikasi pada [design.md](file:///c:/Users/Hp/Documents/projects/kada/capstone/eleva-backend/docs/design.md) dan [deps_tree.md](file:///c:/Users/Hp/Documents/projects/kada/capstone/eleva-backend/docs/deps_tree.md).

---

## 👨‍💼 Admin Flow

Admin adalah pengguna pertama yang menggunakan sistem. Semua data master (sekolah, kelas, mapel, akun guru & siswa) dikelola oleh Admin.

```mermaid
flowchart TD
    A_START([Admin Login]) --> A_DASHBOARD[Dashboard Admin]

    A_DASHBOARD --> SCHOOL[Kelola Struktur Sekolah]
    SCHOOL --> GRADE_LEVEL[Buat / Edit Tingkat Kelas\ne.g. Kelas 7, 8, 9]
    GRADE_LEVEL --> CLASS[Buat / Edit Kelas\ne.g. 7A, 7B, 8A]

    A_DASHBOARD --> SUBJECT[Kelola Mata Pelajaran]
    SUBJECT --> SUBJECT_CRUD[Tambah / Edit / Hapus Mapel\ne.g. Matematika, IPA]

    A_DASHBOARD --> TEACHER[Kelola Akun Guru]
    TEACHER --> INVITE[Kirim Undangan via Email\nWhitelist]
    INVITE --> ASSIGN_HR[Tetapkan Wali Kelas\nGuru ↔ Kelas]
    INVITE --> ASSIGN_SUBJ[Tetapkan Guru Mapel\nGuru ↔ Mapel ↔ Kelas]

    A_DASHBOARD --> STUDENT[Kelola Akun Siswa]
    STUDENT --> CREATE_STUDENT[Buat Akun Siswa\nGenerate Username + NISN]
    CREATE_STUDENT --> ENROLL[Tempatkan Siswa ke Kelas]

    A_DASHBOARD --> REPORT_TRIGGER[Trigger Laporan AI]
    REPORT_TRIGGER --> TRIGGER_MONTHLY[Memicu Job AI Laporan Bulanan\nvia API Endpoint]
    TRIGGER_MONTHLY --> JOB_QUEUE[Job Masuk ke Queue\nBullMQ + Redis]
    JOB_QUEUE --> JOB_DONE{Job Selesai?}
    JOB_DONE -- Ya --> DRAFT_READY[Draft Laporan AI Siap\nDiteruskan ke Wali Kelas]
    JOB_DONE -- Gagal --> JOB_FAILED[Status: FAILED\nAdmin Dapat Re-trigger]

    A_DASHBOARD --> VIEW_DATA[Lihat Data Akademik\nNilai / Kehadiran / Laporan]
```

---

## 👨‍🏫 Guru Flow (Wali Kelas + Guru Mata Pelajaran)

Satu akun guru dapat memiliki peran ganda: **Wali Kelas** dan/atau **Guru Mata Pelajaran**. UI menyesuaikan fitur berdasarkan peran yang ditugaskan.

### Alur Registrasi Guru

```mermaid
flowchart TD
    T_INVITE([Guru Menerima Email Undangan]) --> T_REG_CHOICE{Metode Registrasi}
    T_REG_CHOICE -- Email + Password --> T_REG_MANUAL[Registrasi Manual\nUsername / Email + Password]
    T_REG_CHOICE -- Google OAuth --> T_REG_OAUTH[Login via Google OAuth]
    T_REG_MANUAL --> T_DASHBOARD[Dashboard Guru]
    T_REG_OAUTH --> T_DASHBOARD
```

### Alur Guru Mata Pelajaran

```mermaid
flowchart TD
    T_DASHBOARD([Dashboard Guru Mapel]) --> T_SELECT_CLASS[Pilih Kelas yang Diajar]

    T_SELECT_CLASS --> MATERIALS[Kelola Materi Pembelajaran]
    MATERIALS --> UPLOAD_MAT[Upload / Buat Materi Baru]

    T_SELECT_CLASS --> ATTENDANCE[Catat Kehadiran Sesi]
    ATTENDANCE --> ATT_RECORD[Tandai Hadir / Sakit / Izin / Alfa\nPer Siswa Per Sesi Mapel]

    T_SELECT_CLASS --> QUIZ_FLOW[Kelola Kuis]
    QUIZ_FLOW --> AI_GEN{Gunakan AI Generator?}
    AI_GEN -- Ya --> AI_GENERATE[Upload Materi ke AI\nGenerate Soal PG + Jawaban Singkat]
    AI_GENERATE --> EDIT_QUESTIONS[Edit Soal yang Dihasilkan AI]
    AI_GEN -- Tidak --> MANUAL_CREATE[Buat Soal Manual]
    EDIT_QUESTIONS --> PUBLISH_QUIZ[Publikasikan Kuis ke Siswa]
    MANUAL_CREATE --> PUBLISH_QUIZ

    PUBLISH_QUIZ --> WAIT_SUBMIT[Tunggu Siswa Mengerjakan]
    WAIT_SUBMIT --> AUTO_GRADE[Penilaian Otomatis\nPG: Otomatis Penuh\nJawaban Singkat: AI Generate Skor]
    AUTO_GRADE --> REVIEW_GRADE[Review Nilai & Feedback AI]
    REVIEW_GRADE --> EDIT_GRADE{Perlu Koreksi?}
    EDIT_GRADE -- Ya --> MODIFY[Edit Nilai / Tambah Remedial]
    MODIFY --> PUBLISH_GRADE[Setujui & Publikasikan Nilai]
    EDIT_GRADE -- Tidak --> PUBLISH_GRADE
    PUBLISH_GRADE --> VISIBLE_STUDENT[Nilai Terlihat oleh Siswa]
```

### Alur Wali Kelas

```mermaid
flowchart TD
    HR_DASHBOARD([Dashboard Wali Kelas]) --> HR_PERF[Lihat Dashboard Performa Siswa\nLintas Semua Mata Pelajaran]

    HR_DASHBOARD --> HR_MONTHLY[Moderasi Laporan Kemajuan Bulanan]
    HR_MONTHLY --> HR_REVIEW[Review Draft Laporan AI]
    HR_REVIEW --> HR_EDIT{Perlu Edit?}
    HR_EDIT -- Ya --> HR_MODIFY[Edit / Hapus Rekomendasi AI]
    HR_MODIFY --> HR_PUBLISH[Publikasikan Laporan Bulanan]
    HR_EDIT -- Tidak --> HR_PUBLISH
    HR_PUBLISH --> HR_VISIBLE[Laporan Terlihat oleh Siswa]

    HR_DASHBOARD --> HR_SEMESTER[Buat Rapor Semester]
    HR_SEMESTER --> HR_COMPILE[Kompilasi Nilai Sumatif\nDari Semua Guru Mapel]
    HR_COMPILE --> HR_FINALIZE[Finalisasi Rapor]
    HR_FINALIZE --> HR_LOCK[Rapor Dikunci\nSnapshot Permanen]
```

---

## 👨‍🎓 Siswa Flow

Siswa tidak melakukan registrasi mandiri. Semua akun dibuat oleh Admin (Lihat rincian teknis di [auth-siswa.md](file:///e:/file%20rivan/Bootcamp/KADA-BATCH-4/Eleva-Capstone/eleva-backend/docs/technical/auth-siswa.md)).

### Alur Login Siswa

```mermaid
flowchart TD
    S_START([Siswa Mendapat Kredensial dari Admin]) --> S_LOGIN_CHOICE{Metode Login}
    S_LOGIN_CHOICE -- NISN --> S_LOGIN_NISN[Login dengan NISN + Password]
    S_LOGIN_CHOICE -- Username --> S_LOGIN_USER[Login dengan Username\ne.g. budi.santoso.42 + Password]
    S_LOGIN_NISN --> S_DASHBOARD[Dashboard Siswa]
    S_LOGIN_USER --> S_DASHBOARD
```

### Alur Aktivitas Siswa

```mermaid
flowchart TD
    S_DASHBOARD([Dashboard Siswa]) --> S_MATERIALS[Lihat Materi Pembelajaran]

    S_DASHBOARD --> S_QUIZ[Kerjakan Kuis]
    S_QUIZ --> S_SELECT_QUIZ[Pilih Kuis yang Tersedia]
    S_SELECT_QUIZ --> S_START_QUIZ[Mulai Mengerjakan\nStatus: IN_PROGRESS]
    S_START_QUIZ --> S_ANSWER[Jawab Soal PG & Jawaban Singkat]
    S_ANSWER --> S_SUBMIT[Kirim Jawaban\nStatus: SUBMITTED]
    S_SUBMIT --> S_WAIT[Menunggu Penilaian\nStatus: GRADING_PENDING]
    S_WAIT --> S_RESULT{Nilai Sudah Dipublikasikan?}
    S_RESULT -- Belum --> S_WAIT
    S_RESULT -- Ya --> S_VIEW_GRADE[Lihat Nilai + Feedback AI\nStatus: PUBLISHED]

    S_DASHBOARD --> S_ATTENDANCE[Pantau Riwayat Kehadiran]

    S_DASHBOARD --> S_REPORTS[Lihat Laporan Kemajuan]
    S_REPORTS --> S_MONTHLY[Laporan Bulanan\nRekomendasi AI + Ringkasan Kehadiran]
    S_REPORTS --> S_SEMESTER[Rapor Semester\nNilai Akhir Resmi]
```

---

## 🔄 Alur Interaksi Antar Peran (Cross-Role Interaction)

Diagram berikut menunjukkan bagaimana ketiga peran saling berinteraksi dalam satu siklus akademik lengkap.

```mermaid
sequenceDiagram
    participant Admin
    participant Guru Mapel
    participant AI Engine
    participant Wali Kelas
    participant Siswa

    Note over Admin: === SETUP AWAL ===
    Admin->>Admin: Buat Struktur Sekolah, Kelas, Mapel
    Admin->>Guru Mapel: Undang Guru via Email Whitelist
    Admin->>Siswa: Buat Akun Siswa (NISN + Username)
    Admin->>Guru Mapel: Tetapkan sebagai Guru Mapel + Wali Kelas

    Note over Guru Mapel: === KEGIATAN MENGAJAR ===
    Guru Mapel->>Guru Mapel: Upload Materi Pembelajaran
    Guru Mapel->>AI Engine: Kirim Materi untuk Generate Soal
    AI Engine-->>Guru Mapel: Soal PG + Jawaban Singkat (Draft)
    Guru Mapel->>Guru Mapel: Review & Edit Soal
    Guru Mapel->>Siswa: Publikasikan Kuis

    Note over Siswa: === PENGERJAAN KUIS ===
    Siswa->>Siswa: Kerjakan Kuis (NOT_STARTED → IN_PROGRESS)
    Siswa->>Guru Mapel: Kirim Jawaban (SUBMITTED)

    Note over AI Engine: === PENILAIAN ===
    Guru Mapel->>AI Engine: Proses Penilaian Otomatis
    AI Engine-->>Guru Mapel: Skor + Feedback (GRADING_PENDING)
    Guru Mapel->>Guru Mapel: Review & Approve Nilai (GRADED)
    Guru Mapel->>Siswa: Publikasikan Nilai (PUBLISHED)

    Note over Guru Mapel: === PRESENSI ===
    Guru Mapel->>Guru Mapel: Catat Kehadiran Per Sesi Mapel

    Note over Admin: === LAPORAN BULANAN ===
    Admin->>AI Engine: Trigger Job Laporan Bulanan (BullMQ)
    AI Engine-->>Wali Kelas: Draft Laporan AI (DRAFT)
    Wali Kelas->>Wali Kelas: Review & Edit Rekomendasi (UNDER_REVIEW)
    Wali Kelas->>Siswa: Publikasikan Laporan Bulanan (PUBLISHED)

    Note over Wali Kelas: === RAPOR SEMESTER ===
    Wali Kelas->>Wali Kelas: Kompilasi Nilai Sumatif
    Wali Kelas->>Wali Kelas: Finalisasi & Kunci Rapor
    Wali Kelas->>Siswa: Rapor Semester Tersedia (Snapshot Locked)
```

---

## 📊 Ringkasan Status Transisi Per Peran

| Entitas | Status Flow | Aktor yang Mengubah |
| :--- | :--- | :--- |
| **Kuis (Quiz)** | `NOT_STARTED` → `IN_PROGRESS` → `SUBMITTED` → `GRADING_PENDING` → `GRADED` → `PUBLISHED` | Siswa (submit) → AI (grade) → Guru (review & publish) |
| **Laporan Bulanan** | `DRAFT` → `UNDER_REVIEW` → `PUBLISHED` | AI (generate) → Wali Kelas (review & publish) |
| **Job AI (Queue)** | `PENDING` → `PROCESSING` → `COMPLETED` / `FAILED` | Admin (trigger) → System (process) |
| **Rapor Semester** | Draft → Finalized → Locked | Wali Kelas (compile & lock) |
