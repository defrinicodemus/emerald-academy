# Analisis Penggunaan Database — Emerald Academy LMS

Dokumen ini memetakan **seluruh tabel dan view database** (Supabase/Postgres) terhadap kode aplikasi yang benar-benar memanggilnya: query langsung (`supabase.from(...)`), RPC, Server Actions (`"use server"`), API Route, data layer (`src/lib/data/*.ts`), dan komponen React (server maupun client).

## Metodologi

- **Sumber skema**: seluruh file di `supabase/migrations/` (16 file migrasi, dari `20260705000001_schema.sql` sampai `20260713000000_announcement_category.sql`).
- **Sumber pemakaian**: pencarian menyeluruh pola `.from("nama_tabel")`, `.rpc(...)`, `supabase.storage`, pada seluruh `src/` — mencakup:
  - Data layer (`src/lib/data/*.ts`) — lapisan query utama, dipanggil dari Server Component (`page.tsx`)
  - Server Actions (`src/app/**/actions.ts`) — mutasi (insert/update/delete/upsert)
  - 1 API Route (`src/app/api/reports/school-pdf/route.tsx`)
  - Komponen client — hanya **`TeacherDashboard.tsx`** yang melakukan query langsung ke Supabase dari client; komponen client lain menerima data lewat props dari Server Component induknya.
- **Status ditentukan dari keterjangkauan kode nyata (reachability)**, bukan asumsi: sebuah tabel dianggap "Aktif Digunakan" hanya jika ada jalur dari halaman/route yang benar-benar bisa diakses pengguna menuju query tabel tersebut. Kode yang ada tapi tidak pernah dipanggil (fungsi diekspor tapi tidak diimpor di manapun, atau halaman yang isinya hanya `redirect()`) dihitung **tidak digunakan**, walau secara sintaks kodenya "ada".

## Arsitektur Akses Data (ringkas)

- Hampir seluruh halaman adalah **Next.js Server Component** yang memanggil fungsi dari `src/lib/data/*.ts` (misal `getMonitoringPembelajaranData()`, `getGradebookData()`) — fungsi ini membuka koneksi Supabase server-side (`@/lib/supabase/server`) dan tunduk pada RLS (Row Level Security) sesuai role pengguna yang login.
- Mutasi (create/update/delete) hampir selalu lewat **Server Actions** di file `actions.ts` per-fitur (`src/app/(app)/<fitur>/actions.ts`), dipanggil dari form/tombol di client component.
- Operasi admin yang butuh hak istimewa (buat/hapus akun `auth.users`, upload Storage) memakai `createAdminClient()` (service role) di `src/app/(app)/users/actions.ts` dan `src/app/(app)/actions.ts`.
- `getCurrentUser()` (`src/lib/data/profile.ts`) adalah fungsi yang **paling sering dipanggil di seluruh sistem** — dipakai di hampir setiap `page.tsx` dan `actions.ts` untuk resolusi identitas + role check, sehingga tabel `profiles` secara praktis diakses di setiap request halaman yang dilindungi login.
- Storage: ada satu bucket Supabase Storage (`school-assets`) untuk logo sekolah — ini **bukan tabel database**, disebutkan di sini untuk kelengkapan saja (`uploadSchoolLogo` di `src/app/(app)/actions.ts`).

---

## Daftar Tabel & View

### 1. `schools`

- **Fungsi Tabel**: Data induk sekolah — nama, tagline, alamat, telepon, logo (`logo_url`). Satu baris per sekolah (aplikasi ini single-tenant secara praktik, selalu diambil dengan `.limit(1).single()`).
- **Halaman yang Menggunakan**: `/login`, `/settings`, `/academic`, `/users`, `/master-kelas`, `/grades` (cabang Laporan Sekolah), seluruh halaman di dalam `(app)/layout.tsx` (nama & logo sekolah di sidebar).
- **Fitur yang Menggunakan**: Login, Pengaturan Sekolah, Struktur Akademik (lookup `school_id` sebelum insert kelas/mapel/tahun ajaran), Manajemen User (lookup sebelum buat akun), Laporan Sekolah & Ekspor PDF (nama/logo di cover).
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/school.ts:getSchool()`; lookup `.limit(1).single()` berulang di `src/app/(app)/actions.ts` dan `src/app/(app)/users/actions.ts` sebelum insert.
  - UPDATE — `saveSchoolSettings()`, `uploadSchoolLogo()` (`src/app/(app)/actions.ts`).
- **Relasi yang Digunakan**: `schools.id` ← `academic_years.school_id`, `subjects.school_id`, `classes.school_id`, `profiles.school_id`, `announcements.school_id`, `rewards.school_id`.
- **Status**: ✅ **Aktif Digunakan**

### 2. `academic_years`

- **Fungsi Tabel**: Tahun ajaran + semester (`ganjil`/`genap`), dengan flag `is_active` yang menentukan periode aktif sistem saat ini. Hanya boleh ada satu baris aktif per sekolah.
- **Halaman yang Menggunakan**: `/academic` (CRUD + aktivasi), `/students`, `/students/[classId]`, `/grades` (cabang principal, dropdown filter periode), `/api/reports/school-pdf`.
- **Fitur yang Menggunakan**: Struktur Akademik, Monitoring Pembelajaran, Laporan Sekolah, Ekspor PDF Laporan.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/academic.ts`, `src/lib/data/school.ts:listAcademicYears()`, `src/lib/data/monitoring.ts` (×2, aggregate & per-kelas), `src/lib/data/schoolReport.ts`.
  - INSERT — `createAcademicYear()` (`src/app/(app)/actions.ts`).
  - UPDATE — `setActiveAcademicYear()` (nonaktifkan semua tahun ajaran sekolah, lalu aktifkan satu — dua statement UPDATE berurutan).
  - DELETE — `deleteAcademicYear()` (diblokir jika `is_active=true` atau masih dipakai kelas).
- **Relasi yang Digunakan**: `academic_years.school_id` → `schools.id`; `classes.academic_year_id` → `academic_years.id`; `grades.academic_year_id` → `academic_years.id`.
- **Status**: ✅ **Aktif Digunakan**

### 3. `subjects`

- **Fungsi Tabel**: Master mata pelajaran — kode, nama, emoji, warna, dan rentang kelas berlaku (`min_grade`/`max_grade`, mis. Bahasa Inggris hanya kelas 3–6).
- **Halaman yang Menggunakan**: Nyaris seluruh halaman akademik — `/academic`, `/master-kelas`, `/subjects`, `/dashboard`, `/gradebook`, `/grades`, `/grades/[subjectId]`, `/classroom`, `/curriculum`, `/attendance`, `/my-attendance`, `/roster`, `/assessments`, `/students`, `/students/[classId]`.
- **Fitur yang Menggunakan**: Struktur Akademik, Master Kelas, Mata Pelajaran (Murid), Buku Nilai, Rapor & Nilai, Kelola Pembelajaran, Kelola Kurikulum, Presensi & Jurnal, Presensi Saya, Kelola Siswa & Kelas, Ruang Periksa, Monitoring Pembelajaran, Laporan Sekolah, Dashboard (semua role).
- **Query yang Menggunakan**:
  - SELECT — dipanggil dari hampir setiap file `src/lib/data/*.ts` (>15 titik panggilan berbeda), selalu di-filter grade-level lewat helper `appliesToGrade()` (`src/lib/data/subjects.ts`).
  - INSERT — `createSubject()`.
  - UPDATE — `updateSubject()`.
  - DELETE — `deleteSubject()` (diblokir jika masih dipakai materi/tugas/nilai/penugasan guru).
- **Relasi yang Digunakan**: `subjects.school_id` → `schools.id`; direferensikan oleh `materials.subject_id`, `assignments.subject_id`, `grades.subject_id`, `curriculum_plans.subject_id`, `class_meetings.subject_id`, `gradebook_locks.subject_id`, `class_teacher_subjects.subject_id`.
- **Status**: ✅ **Aktif Digunakan**

### 4. `classes`

- **Fungsi Tabel**: Rombongan belajar (kelas) per tahun ajaran — nama, tingkat (`grade_level`), wali kelas (`homeroom_teacher_id`).
- **Halaman yang Menggunakan**: Nyaris semua halaman — `/academic`, `/master-kelas`, `/users`, `(app)/layout.tsx` (dropdown `ClassPicker`), `/students`, `/students/[classId]`, `/grades`, `/dashboard`, `/subjects`, `/gradebook`, `/attendance`, `/my-attendance`, `/roster`, `/assessments`, `/curriculum`.
- **Fitur yang Menggunakan**: Hampir seluruh fitur akademik & administratif.
- **Query yang Menggunakan**:
  - SELECT — sangat luas, dipakai di >15 file data layer.
  - INSERT — `createClass()`.
  - UPDATE — `updateClass()`; juga di `assignStudentToClass()`/`promoteClasses()` (memindah `profiles.class_id`, bukan mengubah baris `classes` itu sendiri, dicatat di sini karena relevan).
  - DELETE — `deleteClass()` (diblokir jika masih dipakai siswa/materi/tugas/nilai/penugasan guru/pengumuman target).
- **Relasi yang Digunakan**: `classes.school_id` → `schools`; `classes.academic_year_id` → `academic_years`; `classes.homeroom_teacher_id` → `profiles`; direferensikan oleh `profiles.class_id`, `materials.class_id`, `assignments.class_id`, `grades.class_id`, `curriculum_plans.class_id`, `class_meetings.class_id`, `class_teacher_subjects.class_id`, `announcements.target_class_id`, `gradebook_locks.class_id`.
- **Status**: ✅ **Aktif Digunakan**

### 5. `profiles`

- **Fungsi Tabel**: Identitas semua pengguna (1:1 dengan `auth.users`) — role, nama, NISN (siswa)/NIP (guru/kepsek), kelas siswa, avatar, `last_seen_announcements_at` (penanda baca pengumuman).
- **Halaman yang Menggunakan**: **Seluruh halaman terautentikasi** — `getCurrentUser()` dipanggil di nyaris setiap `page.tsx` dan setiap file `actions.ts` untuk resolusi identitas & pengecekan role.
- **Fitur yang Menggunakan**: Seluruh fitur di seluruh role (Murid, Guru, Kepala Sekolah, Admin) — autentikasi, dashboard, roster, penilaian, presensi, monitoring, manajemen user, dsb.
- **Query yang Menggunakan**:
  - SELECT — di hampir setiap file data layer; juga `email_for_username()` (RPC, `src/app/login/actions.ts`) untuk resolusi username→email saat login.
  - INSERT — tidak langsung dari kode aplikasi; dibuat otomatis oleh trigger `handle_new_user()` (Postgres) saat `admin.auth.admin.createUser()` dipanggil dari `createStudent()`/`createTeacher()`/`createPrincipal()`.
  - UPDATE — `updateOwnProfile()`, `updateStudent()`, `updateStaff()`, `assignStudentToClass()`, `promoteClasses()` (mutasi massal `class_id`), `markAnnouncementsSeen()`.
  - DELETE — tidak langsung; via cascade saat `admin.auth.admin.deleteUser()` dipanggil dari `deleteStudent()`/`deleteTeacher()`.
- **Relasi yang Digunakan**: `profiles.id` → `auth.users.id`; `profiles.school_id` → `schools`; `profiles.class_id` → `classes`; direferensikan sebagai `teacher_id`/`student_id`/`created_by`/`author_id`/`graded_by`/`decided_by`/`locked_by`/`awarded_by` di hampir seluruh tabel lain.
- **Status**: ✅ **Aktif Digunakan** (tabel paling sering diakses di seluruh sistem)

### 6. `class_teacher_subjects`

- **Fungsi Tabel**: Penugasan guru — "siapa mengajar mapel apa di kelas mana". Juga menjadi basis fungsi RLS `teaches_class()` yang menentukan hak akses guru ke data kelasnya.
- **Halaman yang Menggunakan**: `/master-kelas` (admin assign guru), `/dashboard`, `/curriculum`, `/classroom`, `/attendance`, `/gradebook`, `/roster`, `/assessments` (semua lewat `getTeacherClassSubjects()`), `/teacher-monitoring/[teacherId]`, `/users` (statistik guru), `/grades` (cabang principal, roster guru per periode).
- **Fitur yang Menggunakan**: Master Kelas, Dashboard Guru, Kelola Kurikulum, Kelola Pembelajaran, Presensi & Jurnal, Buku Nilai, Kelola Siswa & Kelas, Ruang Periksa, Kinerja Guru, Manajemen User, Laporan Sekolah.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/teaching.ts`, `src/lib/data/people.ts`, `src/lib/data/teacher-monitoring.ts`, `src/lib/data/masterKelas.ts`, `src/lib/data/schoolReport.ts`.
  - UPSERT — `setClassSubjectTeacher()`, `promoteClasses()` (salin penugasan ke kelas hasil kenaikan).
  - DELETE — `setClassSubjectTeacher()` (saat guru dilepas dari kelas/mapel, `teacher_id` dikosongkan).
- **Relasi yang Digunakan**: `class_id` → `classes`, `subject_id` → `subjects`, `teacher_id` → `profiles`.
- **Status**: ✅ **Aktif Digunakan**

### 7. `announcements`

- **Fungsi Tabel**: Pengumuman sekolah — judul, isi, kategori, target role/kelas opsional.
- **Halaman yang Menggunakan**: `/announcements`, `/announcements/[id]`, `/dashboard` (ringkasan 3 pengumuman terbaru di semua dashboard role), `(app)/layout.tsx` (badge notifikasi lonceng).
- **Fitur yang Menggunakan**: Pengumuman, Dashboard (semua role), Notifikasi.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/announcements.ts` (`listAnnouncements`, `listAnnouncementsPage`, `getAnnouncementById`, `getNotificationsData`), `src/lib/data/dashboard.ts`.
  - INSERT — `publishAnnouncement()` (`src/app/(app)/actions.ts`, khusus role admin).
  - Tidak ditemukan fungsi UPDATE/DELETE — pengumuman yang sudah diterbitkan tidak bisa diedit/dihapus lewat UI manapun saat ini.
- **Relasi yang Digunakan**: `school_id` → `schools`, `author_id` → `profiles`, `target_class_id` → `classes`.
- **Status**: ✅ **Aktif Digunakan**

### 8. `materials`

- **Fungsi Tabel**: Materi ajar (PDF/video/teks/gambar) per kelas+mapel, opsional berisi teks langsung (`content`) dan tertaut ke Tujuan Pembelajaran (`learning_objective_id`).
- **Halaman yang Menggunakan**: `/classroom` (CRUD oleh guru), `/subjects` (murid melihat & menandai terlihat), `/dashboard`, `/roster`, `/students`, `/students/[classId]`, `/teacher-monitoring`, `/teacher-monitoring/[teacherId]`, `/users`, `/master-kelas`, `/grades` (cabang principal).
- **Fitur yang Menggunakan**: Kelola Pembelajaran, Mata Pelajaran (Murid), Dashboard, Kelola Siswa & Kelas, Monitoring Pembelajaran, Kinerja Guru, Manajemen User, Laporan Sekolah.
- **Query yang Menggunakan**:
  - SELECT — sangat luas (>10 file data layer).
  - INSERT — `createMaterial()` (`src/app/(app)/classroom/actions.ts`).
  - UPDATE — `updateMaterial()` (judul & TP saja).
  - DELETE — `deleteMaterial()`.
- **Relasi yang Digunakan**: `class_id` → `classes`, `subject_id` → `subjects`, `teacher_id` → `profiles`, `learning_objective_id` → `learning_objectives`.
- **Status**: ✅ **Aktif Digunakan**

### 9. `assignments`

- **Fungsi Tabel**: Tugas & kuis (`kind`: quiz/essay/photo/audio/text), deadline, flag `is_published` (khusus kuis — murid hanya lihat kuis yang sudah dipublikasikan guru), opsional tertaut TP.
- **Halaman yang Menggunakan**: `/classroom` (CRUD tugas & kuis oleh guru), `/subjects` (murid mengerjakan), `/assessments` (guru menilai/lihat hasil), `/dashboard`, `/gradebook`, `/roster`, `/students`, `/students/[classId]`, `/teacher-monitoring`, `/grades` (cabang principal).
- **Fitur yang Menggunakan**: Kelola Pembelajaran, Mata Pelajaran (Murid), Ruang Periksa, Dashboard, Buku Nilai, Kelola Siswa & Kelas, Monitoring Pembelajaran, Kinerja Guru, Laporan Sekolah.
- **Query yang Menggunakan**:
  - SELECT — sangat luas.
  - INSERT — `createAssignment()`, `createQuiz()`.
  - UPDATE — `updateAssignment()`, `updateQuiz()`, `publishQuiz()` (set `is_published=true`).
  - DELETE — `deleteAssignment()`, `deleteQuiz()`.
- **Relasi yang Digunakan**: `class_id` → `classes`, `subject_id` → `subjects`, `teacher_id` → `profiles`, `learning_objective_id` → `learning_objectives`; induk dari `submissions` dan `quiz_questions`.
- **Status**: ✅ **Aktif Digunakan**

### 10. `submissions`

- **Fungsi Tabel**: Jawaban/pengumpulan siswa atas satu `assignment` — status (`belum`/`dikerjakan`/`submitted`/`graded`), skor, komentar guru, waktu kumpul/nilai.
- **Halaman yang Menggunakan**: `/subjects` (murid kumpul tugas & kerjakan kuis — auto-grading kuis), `/assessments` (guru menilai tugas, lihat hasil kuis), `/classroom` (hitung status), `/dashboard`, `/gradebook`, `/roster`, `/students`, `/students/[classId]`, `/grades` (cabang principal).
- **Fitur yang Menggunakan**: Mata Pelajaran (Murid), Ruang Periksa, Kelola Pembelajaran, Dashboard, Buku Nilai, Kelola Siswa & Kelas, Monitoring Pembelajaran, Laporan Sekolah.
- **Query yang Menggunakan**:
  - SELECT — sangat luas.
  - UPSERT — `submitAssignment()`, `submitQuizAnswers()` (auto-grading: cocokkan jawaban ke `quiz_options`/`correct_answer_text`, hitung skor langsung).
  - UPDATE — `gradeSubmission()` (guru beri nilai manual untuk tugas non-kuis; diblokir jika `gradebook_locks` sudah terkunci).
- **Relasi yang Digunakan**: `assignment_id` → `assignments`, `student_id` → `profiles`, `graded_by` → `profiles`.
- **Status**: ✅ **Aktif Digunakan**

### 11. `grades`

- **Fungsi Tabel**: Nilai rapor final per siswa/mapel/bulan (`period_month`) — snapshot yang dibuat sekali saat guru mengunci buku nilai (`gradebook_locks`), bukan nilai per-tugas.
- **Halaman yang Menggunakan**: `/gradebook` (guru: kunci nilai → generate baris `grades`), `/grades`, `/grades/[subjectId]` (murid melihat rapor), `/users` (rata-rata nilai per siswa), `/academic` (pengecekan blocker sebelum hapus kelas/mapel).
- **Fitur yang Menggunakan**: Buku Nilai, Rapor & Nilai, Manajemen User, Struktur Akademik.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/gradebook.ts`, `src/lib/data/people.ts`.
  - INSERT — `lockAndCalculateGrades()` (`src/app/(app)/gradebook/actions.ts`) — insert massal (bulk insert) satu baris per siswa saat guru mengunci buku nilai bulan berjalan.
  - Tidak ditemukan UPDATE/DELETE — nilai yang sudah dikunci bersifat permanen kecuali `gradebook_locks` dibuka lagi (`unlockGradebook`), setelah itu guru mengunci ulang (insert baris baru, bukan mengubah baris lama).
- **Relasi yang Digunakan**: `student_id` → `profiles`, `subject_id` → `subjects`, `class_id` → `classes`, `academic_year_id` → `academic_years`, `created_by` → `profiles`.
- **Status**: ✅ **Aktif Digunakan**

### 12. `badges`

- **Fungsi Tabel**: Katalog lencana gamifikasi (kode, nama, emoji, deskripsi) yang bisa diraih siswa.
- **Halaman yang Menggunakan**: **Tidak ada.** Satu-satunya pemanggil adalah `getStudentGamification()` (`src/lib/data/gamification.ts`), namun fungsi ini **tidak diimpor di file manapun** dalam codebase. Halaman `/gamification` hanya berisi `redirect("/dashboard")`.
- **Fitur yang Menggunakan**: Gamifikasi — Lencana & Bintang *(fitur tidak aktif/dinonaktifkan)*.
- **Query yang Menggunakan**: SELECT (kode ada di `gamification.ts`, tapi tidak pernah tereksekusi karena tidak dipanggil).
- **Relasi yang Digunakan**: Direferensikan oleh `student_badges.badge_id`.
- **Status**: ❌ **Tidak Digunakan**

### 13. `student_badges`

- **Fungsi Tabel**: Pencatatan lencana yang sudah diraih tiap siswa.
- **Halaman yang Menggunakan**: Tidak ada halaman yang menampilkannya. Satu-satunya jalur kode yang benar-benar tereksekusi: `deleteStudent()` (`src/app/(app)/users/actions.ts`) — SELECT count sebagai *guard* sebelum menghapus akun siswa (mencegah hapus siswa yang masih punya riwayat lencana).
- **Fitur yang Menggunakan**: Manajemen User (hanya sebagai pengecekan sebelum hapus akun) — bukan untuk fitur Gamifikasi itu sendiri (tidak aktif).
- **Query yang Menggunakan**: SELECT count (`deleteStudent`, `src/app/(app)/users/actions.ts`). Tidak ada INSERT yang reachable (tidak ada fitur pemberian lencana yang aktif).
- **Relasi yang Digunakan**: `student_id` → `profiles`, `badge_id` → `badges`.
- **Status**: ⚠️ **Jarang Digunakan** — hanya sebagai *delete-guard* pada Manajemen User, bukan untuk fungsi aslinya.

### 14. `stars_ledger`

- **Fungsi Tabel**: Buku besar poin bintang siswa (append-only: setiap baris adalah `delta`, total dihitung lewat view `student_star_totals`).
- **Halaman yang Menggunakan**: Tidak ada. `approveRedemption()` (`src/app/(app)/actions.ts`) melakukan INSERT ke tabel ini, tapi fungsi tersebut sendiri tidak dipanggil dari komponen manapun (terhubung ke `/gamification` yang stub). Jalur yang benar-benar tereksekusi: `deleteStudent()` — SELECT count sebagai guard.
- **Fitur yang Menggunakan**: Manajemen User (delete-guard saja); Gamifikasi *(tidak aktif)*.
- **Query yang Menggunakan**: SELECT count (`deleteStudent`). INSERT ada di kode (`approveRedemption`) tapi tidak reachable dari UI manapun.
- **Relasi yang Digunakan**: `student_id` → `profiles`, `created_by` → `profiles`; basis agregasi untuk view `student_star_totals` dan `class_leaderboard`.
- **Status**: ⚠️ **Jarang Digunakan** — hanya sebagai *delete-guard* pada Manajemen User.

### 15. `rewards`

- **Fungsi Tabel**: Katalog hadiah yang bisa ditukar siswa dengan bintang (nama, emoji, biaya).
- **Halaman yang Menggunakan**: **Tidak ada.** Dipanggil dari `getStudentGamification()` (tidak diimpor di manapun) dan `redeemReward()` (terhubung ke `/rewards`, yang juga hanya `redirect("/dashboard")`).
- **Fitur yang Menggunakan**: Tukar Hadiah *(fitur tidak aktif/dinonaktifkan)*.
- **Query yang Menggunakan**: SELECT (kode ada, tidak tereksekusi).
- **Relasi yang Digunakan**: `school_id` → `schools`; direferensikan oleh `reward_redemptions.reward_id`.
- **Status**: ❌ **Tidak Digunakan**

### 16. `reward_redemptions`

- **Fungsi Tabel**: Pengajuan penukaran hadiah oleh siswa beserta status persetujuan (`pending`/`approved`/`rejected`).
- **Halaman yang Menggunakan**: Tidak ada. `redeemReward()`, `approveRedemption()`, `rejectRedemption()` ada di kode tapi tidak dipanggil dari komponen manapun. Jalur yang benar-benar tereksekusi: `deleteStudent()` — SELECT count sebagai guard.
- **Fitur yang Menggunakan**: Manajemen User (delete-guard saja); Tukar Hadiah *(tidak aktif)*.
- **Query yang Menggunakan**: SELECT count (`deleteStudent`). INSERT/UPDATE ada di kode (`redeemReward`/`approveRedemption`/`rejectRedemption`) tapi tidak reachable.
- **Relasi yang Digunakan**: `student_id` → `profiles`, `reward_id` → `rewards`, `decided_by` → `profiles`.
- **Status**: ⚠️ **Jarang Digunakan** — hanya sebagai *delete-guard* pada Manajemen User.

### 17. `curriculum_plans`

- **Fungsi Tabel**: Capaian Pembelajaran (CP) — teks CP per kombinasi kelas+mapel; induk dari daftar Tujuan Pembelajaran (TP).
- **Halaman yang Menggunakan**: `/curriculum` (guru menulis/menyimpan CP), `/attendance` (ambil daftar TP untuk jurnal mengajar), `/gradebook` (kolom nilai per-TP).
- **Fitur yang Menggunakan**: Kelola Kurikulum, Presensi & Jurnal, Buku Nilai.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/curriculum.ts`, `src/lib/data/attendance.ts`, `src/lib/data/gradebook.ts`.
  - UPSERT — `saveCurriculumPlan()` (`src/app/(app)/curriculum/actions.ts`).
- **Relasi yang Digunakan**: `class_id` → `classes`, `subject_id` → `subjects`, `teacher_id` → `profiles`; induk dari `learning_objectives`.
- **Status**: ✅ **Aktif Digunakan**

### 18. `learning_objectives`

- **Fungsi Tabel**: Daftar Tujuan Pembelajaran (TP) berurutan (`sort_order`) di bawah satu CP — dipakai untuk mengaitkan materi/tugas/pertemuan/nilai ke TP tertentu (Kurikulum Merdeka).
- **Halaman yang Menggunakan**: `/curriculum` (CRUD + reorder TP), `/classroom` (pilih TP saat buat materi/tugas), `/attendance` (pilih TP saat isi jurnal), `/gradebook` (kolom rata-rata per TP), `/subjects` (murid melihat label TP pada materi/tugas), `/my-attendance` (tidak langsung).
- **Fitur yang Menggunakan**: Kelola Kurikulum, Kelola Pembelajaran, Presensi & Jurnal, Buku Nilai, Mata Pelajaran (Murid).
- **Query yang Menggunakan**:
  - SELECT — luas (>6 file data layer).
  - INSERT — `addLearningObjective()`.
  - UPDATE — `updateLearningObjective()`, `moveLearningObjective()` (tukar `sort_order` dua baris untuk reorder).
  - DELETE — `deleteLearningObjective()`.
- **Relasi yang Digunakan**: `curriculum_plan_id` → `curriculum_plans`; direferensikan oleh `materials.learning_objective_id`, `assignments.learning_objective_id`, `class_meetings.learning_objective_id`.
- **Status**: ✅ **Aktif Digunakan**

### 19. `quiz_questions`

- **Fungsi Tabel**: Bank soal kuis (pilihan ganda/isian singkat) untuk satu `assignment` berjenis `quiz`.
- **Halaman yang Menggunakan**: `/classroom` (guru menyusun soal), `/subjects` (murid mengerjakan kuis, auto-grading).
- **Fitur yang Menggunakan**: Kelola Pembelajaran, Mata Pelajaran (Murid).
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/classroom.ts`, `src/lib/data/subjects.ts` (keduanya nested-select dengan `quiz_options`).
  - INSERT — `addQuizQuestion()` (`src/app/(app)/classroom/actions.ts`).
  - UPDATE — `updateQuizQuestion()` (teks soal & jawaban benar isian singkat saja — opsi pilihan ganda tidak bisa diedit lewat fungsi ini), `moveQuizQuestion()` (tukar `sort_order`).
  - DELETE — `deleteQuizQuestion()`.
- **Relasi yang Digunakan**: `assignment_id` → `assignments`; induk dari `quiz_options`.
- **Status**: ✅ **Aktif Digunakan**

### 20. `quiz_options`

- **Fungsi Tabel**: Pilihan jawaban untuk soal pilihan ganda (teks opsi + flag `is_correct`).
- **Halaman yang Menggunakan**: `/classroom` (dibuat bersamaan saat guru menambah soal pilihan ganda), `/subjects` (ditampilkan saat murid mengerjakan kuis, dicocokkan otomatis saat submit).
- **Fitur yang Menggunakan**: Kelola Pembelajaran, Mata Pelajaran (Murid).
- **Query yang Menggunakan**:
  - SELECT — selalu lewat *nested embed* `quiz_questions(...quiz_options(...))`, tidak pernah query langsung terpisah (`src/lib/data/classroom.ts`, `src/lib/data/subjects.ts`, `src/app/(app)/subjects/actions.ts`).
  - INSERT — `addQuizQuestion()` (`src/app/(app)/classroom/actions.ts`), dibuat bersamaan dengan soal barunya.
  - Tidak ada UPDATE/DELETE langsung — opsi lama tidak bisa diedit satu-per-satu; hapus terjadi otomatis lewat `on delete cascade` saat baris `quiz_questions` induknya dihapus.
- **Relasi yang Digunakan**: `question_id` → `quiz_questions`.
- **Status**: ✅ **Aktif Digunakan** (SELECT + INSERT saja, tanpa kapabilitas edit/hapus opsi individual)

### 21. `material_views`

- **Fungsi Tabel**: Pencatatan materi yang sudah dibuka/dilihat siswa (dasar hitung progres "materi dipelajari").
- **Halaman yang Menggunakan**: `/subjects` (tandai terlihat saat murid membuka materi), `/dashboard` (hitung `materialsStudiedCount`), `/roster` (progres per siswa), `/gradebook` (riwayat belajar siswa per mapel).
- **Fitur yang Menggunakan**: Mata Pelajaran (Murid), Dashboard Murid, Kelola Siswa & Kelas, Buku Nilai (riwayat belajar).
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/dashboard.ts`, `src/lib/data/roster.ts`, `src/lib/data/gradebook.ts`, `src/lib/data/subjects.ts`.
  - UPSERT — `markMaterialViewed()` (`src/app/(app)/subjects/actions.ts`, `ignoreDuplicates: true`).
- **Relasi yang Digunakan**: `material_id` → `materials`, `student_id` → `profiles`.
- **Status**: ✅ **Aktif Digunakan**

### 22. `gradebook_locks`

- **Fungsi Tabel**: Penanda buku nilai kelas+mapel+bulan (`period_month`) yang sudah dikunci — nilai final, tidak bisa diubah lagi sampai dibuka ulang.
- **Halaman yang Menggunakan**: `/gradebook` (guru mengunci/membuka kunci), `/assessments` (cek status kunci sebelum guru boleh memberi nilai).
- **Fitur yang Menggunakan**: Buku Nilai, Ruang Periksa.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/gradebook.ts`, `src/app/(app)/assessments/actions.ts:gradeSubmission()`.
  - INSERT — `lockAndCalculateGrades()`.
  - DELETE — `unlockGradebook()`.
- **Relasi yang Digunakan**: `class_id` → `classes`, `subject_id` → `subjects`, `locked_by` → `profiles`.
- **Status**: ✅ **Aktif Digunakan**

### 23. `class_meetings`

- **Fungsi Tabel**: Pertemuan ke-1 s/d 20 per kelas+mapel — tanggal, materi yang diajarkan, TP terkait, catatan. Sekaligus berfungsi sebagai jurnal mengajar guru.
- **Halaman yang Menggunakan**: `/attendance` (guru isi jurnal+presensi per pertemuan), `/my-attendance` (murid lihat riwayat kehadiran), `/students`, `/students/[classId]`, `/grades` (cabang principal, hitung kehadiran per kelas), `/teacher-monitoring`, `/teacher-monitoring/[teacherId]` (hitung presensi/jurnal per guru), `/dashboard` (aktivitas hari ini/mingguan, widget `TeacherDashboard`).
- **Fitur yang Menggunakan**: Presensi & Jurnal, Presensi Saya, Monitoring Pembelajaran, Laporan Sekolah, Kinerja Guru, Dashboard (Guru & Kepsek).
- **Query yang Menggunakan**:
  - SELECT — luas (>8 file data layer + komponen client `TeacherDashboard.tsx`).
  - UPSERT — `saveMeeting()` (`src/app/(app)/attendance/actions.ts`, `onConflict: "class_id,subject_id,meeting_number"`).
- **Relasi yang Digunakan**: `class_id` → `classes`, `subject_id` → `subjects`, `learning_objective_id` → `learning_objectives`, `teacher_id` → `profiles`; induk dari `attendance_records`.
- **Status**: ✅ **Aktif Digunakan**

### 24. `attendance_records`

- **Fungsi Tabel**: Status kehadiran (`hadir`/`sakit`/`izin`/`alfa`) per siswa per pertemuan (`class_meetings`).
- **Halaman yang Menggunakan**: `/attendance` (input oleh guru), `/my-attendance` (murid lihat riwayat), `/students`, `/students/[classId]`, `/grades` (cabang principal, hitung persentase kehadiran), `/dashboard` (widget `TeacherDashboard`).
- **Fitur yang Menggunakan**: Presensi & Jurnal, Presensi Saya, Monitoring Pembelajaran, Laporan Sekolah, Dashboard Guru.
- **Query yang Menggunakan**:
  - SELECT — `src/lib/data/attendance.ts`, `src/lib/data/monitoring.ts`, `src/lib/data/schoolReport.ts`, `src/components/dashboards/TeacherDashboard.tsx` (client-side).
  - UPSERT — `saveMeeting()` (`src/app/(app)/attendance/actions.ts`, bersamaan dengan penyimpanan jurnal, `onConflict: "meeting_id,student_id"`).
- **Relasi yang Digunakan**: `meeting_id` → `class_meetings`, `student_id` → `profiles`.
- **Status**: ✅ **Aktif Digunakan**

---

## View Database (bukan tabel, tapi query-able seperti tabel)

### 25. `student_star_totals` (VIEW)

- **Fungsi**: `SUM(delta)` dari `stars_ledger`, dikelompokkan per siswa — total bintang seorang siswa.
- **Halaman yang Menggunakan**: Tidak ada. Hanya dipanggil dari `getStudentGamification()` (`src/lib/data/gamification.ts`), yang tidak diimpor di manapun.
- **Fitur yang Menggunakan**: Gamifikasi *(tidak aktif)*.
- **Query yang Menggunakan**: SELECT (tidak reachable).
- **Relasi yang Digunakan**: Dibangun dari `stars_ledger` (`group by student_id`).
- **Status**: ❌ **Tidak Digunakan**

### 26. `class_leaderboard` (VIEW)

- **Fungsi**: Peringkat total bintang siswa per kelas (join `profiles` + `stars_ledger`).
- **Halaman yang Menggunakan**: **Tidak ada sama sekali** — tidak ditemukan satu pun pemanggilan `.from("class_leaderboard")` di seluruh `src/`, bahkan di `gamification.ts` sekalipun. View ini didefinisikan di migrasi tapi tidak pernah dipakai kode aplikasi.
- **Fitur yang Menggunakan**: Tidak ada.
- **Query yang Menggunakan**: Tidak ada.
- **Relasi yang Digunakan**: Dibangun dari `profiles` + `stars_ledger`.
- **Status**: ❌ **Tidak Digunakan**

---

## Catatan Tambahan (di luar cakupan tabel, untuk konteks)

- **RPC**: `email_for_username(p_username)` — dipanggil dari `src/app/login/actions.ts` saat proses login (mengubah username menjadi email untuk `auth.signInWithPassword`). Aktif digunakan.
- **Supabase Storage** (bukan tabel Postgres): bucket `school-assets` dipakai `uploadSchoolLogo()` (`src/app/(app)/actions.ts`) untuk menyimpan file logo sekolah. Aktif digunakan, dicatat di sini karena bukan bagian dari skema tabel yang diminta.
- **Fitur mati (dead feature) yang teridentifikasi**: seluruh sistem **Gamifikasi (Lencana & Bintang)** dan **Tukar Hadiah** — routing (`/gamification`, `/rewards`), Server Actions (`redeemReward`, `approveRedemption`, `rejectRedemption`), dan data layer (`getStudentGamification`) sudah ditulis lengkap, tapi **tidak ada komponen UI yang memanggilnya**. Enam tabel/view terkait (`badges`, `student_badges`, `stars_ledger`, `rewards`, `reward_redemptions`, `student_star_totals`, `class_leaderboard`) karena itu berstatus Tidak Digunakan / Jarang Digunakan.

---

## Matriks Fitur × Tabel

Setiap baris adalah satu fitur; kolom **Tabel** berisi semua tabel/view yang benar-benar diakses (SELECT/INSERT/UPDATE/DELETE) oleh jalur kode fitur tersebut.

| Fitur | Tabel |
|---|---|
| Login & Autentikasi | `profiles`, `schools` |
| Dashboard Murid | `announcements`, `assignments`, `subjects`, `materials`, `classes`, `submissions`, `material_views` |
| Dashboard Guru | `profiles`, `materials`, `assignments`, `class_meetings`, `submissions`, `attendance_records` |
| Dashboard Kepala Sekolah | `profiles`, `classes`, `subjects`, `materials`, `assignments`, `class_meetings`, `submissions`, `announcements` |
| Dashboard Admin | `profiles`, `classes` |
| Mata Pelajaran (Murid) | `subjects`, `classes`, `materials`, `assignments`, `material_views`, `submissions`, `quiz_questions`, `quiz_options`, `learning_objectives` |
| Presensi Saya (Murid) | `subjects`, `classes`, `class_meetings`, `attendance_records` |
| Rapor & Nilai (Murid) | `subjects`, `classes`, `curriculum_plans`, `learning_objectives`, `assignments`, `submissions` |
| Kelola Kurikulum (Guru) | `class_teacher_subjects`, `curriculum_plans`, `learning_objectives` |
| Kelola Siswa & Kelas / Roster (Guru) | `class_teacher_subjects`, `profiles`, `materials`, `assignments`, `material_views`, `submissions` |
| Kelola Pembelajaran (Guru) | `class_teacher_subjects`, `curriculum_plans`, `learning_objectives`, `materials`, `assignments`, `quiz_questions`, `quiz_options` |
| Ruang Periksa (Guru) | `class_teacher_subjects`, `assignments`, `profiles`, `submissions`, `gradebook_locks` |
| Presensi & Jurnal (Guru) | `class_teacher_subjects`, `curriculum_plans`, `learning_objectives`, `profiles`, `class_meetings`, `attendance_records` |
| Buku Nilai (Guru) | `class_teacher_subjects`, `classes`, `curriculum_plans`, `learning_objectives`, `profiles`, `assignments`, `submissions`, `grades`, `gradebook_locks`, `materials`, `material_views` |
| Kinerja Guru (Kepsek) | `profiles`, `materials`, `assignments`, `class_meetings`, `class_teacher_subjects`, `subjects`, `classes` |
| Monitoring Pembelajaran (Kepsek) | `academic_years`, `classes`, `subjects`, `profiles`, `class_meetings`, `attendance_records`, `assignments`, `submissions`, `materials` |
| Laporan Sekolah (Kepsek) | `academic_years`, `classes`, `profiles`, `class_teacher_subjects`, `class_meetings`, `materials`, `assignments`, `attendance_records`, `submissions` |
| Ekspor PDF Laporan Sekolah | `schools`, `academic_years`, `classes`, `profiles`, `class_teacher_subjects`, `class_meetings`, `materials`, `assignments`, `attendance_records`, `submissions` |
| Manajemen User (Admin) | `profiles`, `schools`, `class_teacher_subjects`, `submissions`, `grades`, `student_badges`, `stars_ledger`, `reward_redemptions` |
| Struktur Akademik (Admin) | `classes`, `subjects`, `academic_years`, `schools`, `materials`, `assignments`, `grades`, `class_teacher_subjects`, `announcements` |
| Master Kelas (Admin) | `classes`, `subjects`, `profiles`, `class_teacher_subjects`, `materials`, `assignments`, `material_views`, `submissions` |
| Pengaturan Sekolah (Admin) | `schools` |
| Pengumuman (semua role) | `announcements`, `profiles` |
| Profil (semua role) | `profiles` |
| Gamifikasi — Lencana & Bintang *(tidak aktif)* | `badges`, `student_badges`, `rewards`, `stars_ledger`, `student_star_totals` |
| Tukar Hadiah *(tidak aktif)* | `rewards`, `reward_redemptions`, `stars_ledger` |

---

## Ringkasan Status

| Status | Jumlah | Tabel/View |
|---|---|---|
| ✅ Aktif Digunakan | 19 | `schools`, `academic_years`, `subjects`, `classes`, `profiles`, `class_teacher_subjects`, `announcements`, `materials`, `assignments`, `submissions`, `grades`, `curriculum_plans`, `learning_objectives`, `quiz_questions`, `quiz_options`, `material_views`, `gradebook_locks`, `class_meetings`, `attendance_records` |
| ⚠️ Jarang Digunakan | 3 | `student_badges`, `stars_ledger`, `reward_redemptions` (hanya sebagai *delete-guard* di Manajemen User) |
| ❌ Tidak Digunakan | 4 | `badges`, `rewards`, `student_star_totals` (view), `class_leaderboard` (view) |

**Total objek database yang dianalisis**: 24 tabel + 2 view = 26 objek.
