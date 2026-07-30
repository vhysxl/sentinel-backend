# 🌳 Eleva LMS - Feature Dependency Tree (Pohon Dependensi Fitur)

Dokumen ini memetakan ketergantungan (*dependency tree*) antar fitur dalam sistem **Eleva LMS** berdasarkan spesifikasi pada [design-id.md](file:///c:/Users/Hp/Documents/projects/kada/capstone/eleva-backend/docs/design-id.md) dan [design.md](file:///c:/Users/Hp/Documents/projects/kada/capstone/eleva-backend/docs/design.md).

Pemetaan ini menjadi panduan urutan pengembangan (*build order*) backend API dan skema database (ERD).

---

## 📊 Diagram Alur Ketergantungan (Mermaid DAG)

```mermaid
flowchart TD
    %% TIER 0: Foundation & Authentication
    subgraph TIER_0["Tier 0: Fondasi & Autentikasi"]
        AUTH_ADMIN["Auth Admin"]
        INVITE_TEACHER["Whitelist Invite Guru"]
        AUTH_TEACHER["Auth Guru (Email/OAuth)"]
        AUTH_STUDENT["Auth Siswa (NISN/Username)"]
    end

    %% TIER 1: School Structure & Assignments
    subgraph TIER_1["Tier 1: Struktur Sekolah & Penugasan"]
        SCHOOL_STRUCT["Struktur Sekolah (Tingkat & Kelas)"]
        SUBJECTS["Manajemen Mata Pelajaran"]
        TEACHER_ROLES["Penugasan Peran Guru (Wali Kelas & Guru Mapel)"]
        STUDENT_ENROLLMENT["Pendaftaran & Penempatan Siswa ke Kelas"]
    end

    %% TIER 2: Academic Content & Attendance
    subgraph TIER_2["Tier 2: Akademik Dasar & Presensi"]
        MATERIALS["Materi Pembelajaran"]
        ATTENDANCE["Pencatatan Kehadiran (Per Mapel/Sesi)"]
    end

    %% TIER 3: Quiz & AI Auto-Grading Engine
    subgraph TIER_3["Tier 3: Kuis & Mesin AI Generator/Penilaian"]
        AI_QUESTION_GEN["AI Question Generator (dari Materi)"]
        QUIZ_MGMT["Manajemen Kuis (Draft -> Publish)"]
        QUIZ_SUBMIT["Pengerjaan Kuis Siswa"]
        AI_GRADING["AI Auto-Grading (PG + Jawaban Singkat)"]
        TEACHER_REVIEW["Review & Publikasi Nilai Guru"]
        ASSIGNMENTS["Tugas Teks (Low Priority)"]
    end

    %% TIER 4: AI Progress Reporting & Rapor
    subgraph TIER_4["Tier 4: Pelaporan AI & Rapor Semester"]
        RAW_SCORES["Raw Scores Aggregator (Kuis + Presensi)"]
        AI_MONTHLY_JOB["Job Async AI Laporan Bulanan (BullMQ)"]
        MONTHLY_REPORT["Moderasi & Publikasi Laporan Bulanan Wali Kelas"]
        SEMESTER_REPORT["Rapor Semester (Snapshot Locked)"]
    end

    %% DEPENDENCY RELATIONS
    INVITE_TEACHER --> AUTH_TEACHER
    AUTH_ADMIN --> SCHOOL_STRUCT
    AUTH_ADMIN --> SUBJECTS
    AUTH_ADMIN --> INVITE_TEACHER
    
    SCHOOL_STRUCT --> TEACHER_ROLES
    SUBJECTS --> TEACHER_ROLES
    SCHOOL_STRUCT --> STUDENT_ENROLLMENT

    AUTH_TEACHER --> TEACHER_ROLES
    AUTH_STUDENT --> STUDENT_ENROLLMENT

    TEACHER_ROLES --> MATERIALS
    TEACHER_ROLES --> ATTENDANCE
    STUDENT_ENROLLMENT --> ATTENDANCE

    MATERIALS --> AI_QUESTION_GEN
    AI_QUESTION_GEN --> QUIZ_MGMT
    QUIZ_MGMT --> QUIZ_SUBMIT
    STUDENT_ENROLLMENT --> QUIZ_SUBMIT
    
    QUIZ_SUBMIT --> AI_GRADING
    AI_GRADING --> TEACHER_REVIEW
    TEACHER_ROLES --> TEACHER_REVIEW

    TEACHER_REVIEW --> RAW_SCORES
    ATTENDANCE --> RAW_SCORES
    ASSIGNMENTS --> RAW_SCORES

    RAW_SCORES --> AI_MONTHLY_JOB
    AUTH_ADMIN --> AI_MONTHLY_JOB
    AI_MONTHLY_JOB --> MONTHLY_REPORT
    TEACHER_ROLES --> MONTHLY_REPORT

    RAW_SCORES --> SEMESTER_REPORT
    SCHOOL_STRUCT --> SEMESTER_REPORT
```

---

## 🗂️ Rincian Ketergantungan Per Layer (Tier Breakdown)

### 🔹 Tier 0: Fondasi & Autentikasi (Base Level)
Layer ini tidak memiliki dependensi lain dan harus dibangun paling awal.

| Fitur | Prasyarat (Dependencies) | Fitur yang Bergantung Padanya |
| :--- | :--- | :--- |
| **Auth Admin** | Tidak Ada | Manajemen Sekolah, Whitelist Guru, Job Trigger AI |
| **Whitelist Invite Guru** | Auth Admin | Registrasi/Auth Guru |
| **Auth Guru** | Whitelist Email | Penugasan Peran, Manajemen Kuis, Presensi |
| **Auth Siswa** | Di-generate Admin | Login Siswa, Pengerjaan Kuis, Lihat Nilai |

---

### 🔹 Tier 1: Struktur Sekolah & Penugasan
Memetakan hubungan hirarki sekolah di Indonesia.

| Fitur | Prasyarat (Dependencies) | Fitur yang Bergantung Padanya |
| :--- | :--- | :--- |
| **Struktur Kelas** | Auth Admin | Penugasan Wali Kelas, Penempatan Siswa |
| **Manajemen Mapel** | Auth Admin | Penugasan Guru Mapel, Kuis, Materi |
| **Penugasan Peran Guru** | Auth Guru, Kelas, Mapel | Pembuatan Materi, Kuis, Presensi, Review Nilai |
| **Penempatan Siswa** | Auth Siswa, Kelas | Presensi, Pengerjaan Kuis, Laporan Bulanan |

---

### 🔹 Tier 2: Akademik Dasar & Presensi
Input kegiatan belajar mengajar harian.

| Fitur | Prasyarat (Dependencies) | Fitur yang Bergantung Padanya |
| :--- | :--- | :--- |
| **Materi Pembelajaran** | Guru Mapel | AI Question Generator |
| **Pencatatan Kehadiran** | Guru Mapel, Siswa di Kelas | Raw Scores, Laporan Kemajuan AI |

---

### 🔹 Tier 3: Kuis & Mesin AI Auto-Grading
Sistem asesmen berbasis AI dengan persetujuan guru (*Human-in-the-Loop*).

| Fitur | Prasyarat (Dependencies) | Fitur yang Bergantung Padanya |
| :--- | :--- | :--- |
| **AI Question Generator** | Materi Pembelajaran | Draft Soal Kuis (PG & Jawaban Singkat) |
| **Manajemen Kuis** | Guru Mapel, AI Generator | Pengerjaan Kuis Siswa |
| **Pengerjaan Kuis Siswa** | Siswa, Kuis Terbit | AI Auto-Grading Engine |
| **AI Auto-Grading** | Jawaban Siswa | Review & Modifikasi Nilai oleh Guru |
| **Review & Publish Nilai** | Guru Mapel, AI Grading | Raw Scores (Single Source of Truth) |

---

### 🔹 Tier 4: Pelaporan AI & Rapor Semester
Layer teratas yang mengagregasi data dari seluruh kegiatan akademik.

| Fitur | Prasyarat (Dependencies) | Fitur yang Bergantung Padanya |
| :--- | :--- | :--- |
| **Raw Scores Aggregator** | Nilai Kuis Terbit, Presensi | Job AI Laporan Bulanan, Rapor Semester |
| **Job Async AI Laporan Bulanan** | Raw Scores, Admin Trigger (BullMQ) | Draft Laporan Kemajuan Bulanan |
| **Moderasi Laporan Bulanan** | Wali Kelas, Draft AI | Laporan Bulanan Siswa (Published) |
| **Rapor Semester** | Raw Scores Sumatif, Bobot Sekolah | Rapor Cetak / Locked Snapshot |

---

## 🎯 Rekomendasi Urutan Eksekusi Backend (Build Order)

Untuk meminimalkan *blocker* saat *coding*, ikuti urutan pengembangan berikut:

1. **Phase 1 (Core Foundations)**:
   - Module `auth` (Admin, Guru invite/whitelist, Siswa NISN/Username).
   - Module `school` (Classes, Grade Levels, Subjects).
   - Module `users` (Teacher & Student profile management).

2. **Phase 2 (Academic & Attendance)**:
   - Module `materials` (Upload/create learning materials).
   - Module `attendance` (Per-session attendance logging).

3. **Phase 3 (Quiz & AI Engine)**:
   - Module `ai-generator` (Integration with Gemini API using Zod Structured Output).
   - Module `quizzes` & `submissions` (Quiz lifecycle & student submission).
   - Module `grading` (AI evaluation + teacher approval & publication flow).

4. **Phase 4 (Reporting & Async Queue)**:
   - Module `queue` (BullMQ setup for background AI progress report generation).
   - Module `reports` (Monthly Progress Report moderation & Semester Report Card snapshot).
