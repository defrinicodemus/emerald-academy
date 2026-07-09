# Database Design

## Ringkasan

Database Emerald Academy LMS dibangun di Supabase/PostgreSQL untuk mengelola data sekolah dasar: profil sekolah, tahun ajaran, kelas, mata pelajaran, pengguna, materi, tugas, pengumpulan tugas, nilai, pengumuman, dan gamifikasi. Skema utama berada di schema `public`, sementara identitas login tetap memakai Supabase Auth (`auth.users`) dan dihubungkan 1:1 ke tabel `profiles`.

Model datanya berpusat pada `schools`, `academic_years`, `classes`, `subjects`, dan `profiles`. Aktivitas pembelajaran direkam melalui `materials`, `assignments`, `submissions`, dan `grades`. Fitur gamifikasi memakai `badges`, `student_badges`, `stars_ledger`, `rewards`, dan `reward_redemptions`. Semua tabel public sudah mengaktifkan Row Level Security (RLS) dengan pembagian akses untuk `student`, `teacher`, `principal`, dan `admin`.

Dokumentasi ini mencatat kondisi project saat ini berdasarkan migration SQL, seed Supabase, type/interface TypeScript lokal, server actions, dan query relasi yang dipakai aplikasi. Project belum memiliki generated Supabase `Database` type; tipe yang ada masih berupa interface/type lokal di komponen dan data loader.

## Sumber Struktur Database

- `supabase/migrations/20260705000001_schema.sql`: extension `pgcrypto`, enum, tabel, index, trigger `updated_at`.
- `supabase/migrations/20260705000002_functions.sql`: helper role/RLS, trigger pembuatan profile dari Auth, RPC login username, dan view reporting.
- `supabase/migrations/20260705000003_rls.sql`: RLS untuk semua tabel public.
- `supabase/migrations/20260709000001_subject_grade_range.sql`: kolom `min_grade` dan `max_grade` pada `subjects`.
- `supabase/migrations/20260709000002_school_logo.sql`: kolom `logo_url` pada `schools`.
- `supabase/seed.sql`: data demo sekolah, tahun ajaran, kelas, mapel, akun demo, materi, tugas, nilai, badge, bintang, reward, dan redemption.

## Tipe Enum

| Enum | Nilai | Digunakan oleh |
|--------|--------|--------|
| `public.user_role` | `student`, `teacher`, `principal`, `admin` | `profiles.role`, `announcements.target_role`, helper RLS |
| `public.semester_type` | `ganjil`, `genap` | `academic_years.semester` |
| `public.material_kind` | `pdf`, `video`, `text`, `image` | `materials.kind` |
| `public.assignment_kind` | `quiz`, `essay`, `photo`, `audio`, `text` | `assignments.kind` |
| `public.submission_status` | `belum`, `dikerjakan`, `submitted`, `graded` | `submissions.status` |
| `public.redemption_status` | `pending`, `approved`, `rejected` | `reward_redemptions.status` |

## Daftar Tabel

### `schools`

Menyimpan identitas sekolah. Project saat ini memakai satu sekolah utama untuk profil aplikasi, pengaturan, logo, kelas, mapel, tahun ajaran, pengumuman, dan reward.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `name` | `text` | Nama sekolah, wajib |
| `tagline` | `text` | Tagline sekolah, opsional |
| `address` | `text` | Alamat sekolah, opsional |
| `phone` | `text` | Nomor telepon, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |
| `logo_url` | `text` | URL logo sekolah dari storage, ditambahkan migration logo |

Primary Key: `id`

Foreign Key: Tidak ada.

Relasi:
- Satu `schools` memiliki banyak `academic_years`, `subjects`, `classes`, `announcements`, dan `rewards`.
- `profiles.school_id` dapat menunjuk ke `schools.id`.
- Pengaturan sekolah membaca baris pertama `schools` dan mengupdate `name`, `address`, `phone`, serta `logo_url`.

### `academic_years`

Menyimpan tahun ajaran dan semester. Satu tahun ajaran/semester dapat aktif untuk sekolah tertentu dan dipakai oleh kelas serta nilai.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `school_id` | `uuid` | Sekolah pemilik tahun ajaran, wajib |
| `year_label` | `text` | Label tahun ajaran, contoh `2024/2025`, wajib |
| `semester` | `public.semester_type` | Semester `ganjil` atau `genap`, wajib |
| `is_active` | `boolean` | Penanda tahun ajaran aktif, default `false` |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `school_id` -> `schools.id` (`on delete cascade`)

Relasi:
- Satu `academic_years` memiliki banyak `classes`.
- `grades.academic_year_id` menunjuk ke tahun ajaran nilai.
- Constraint unik: `(school_id, year_label, semester)`.
- Server action `setActiveAcademicYear` menonaktifkan tahun ajaran lain dalam sekolah yang sama sebelum mengaktifkan satu tahun ajaran.

### `subjects`

Menyimpan master mata pelajaran. Setiap mapel milik sekolah, memiliki kode unik per sekolah, warna/emoji untuk UI, dan bisa dibatasi hanya berlaku pada tingkat kelas tertentu.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `school_id` | `uuid` | Sekolah pemilik mapel, wajib |
| `code` | `text` | Kode mapel, wajib, unik per sekolah |
| `name` | `text` | Nama mapel, wajib |
| `emoji` | `text` | Emoji/ikon mapel untuk UI, opsional |
| `color` | `text` | Warna mapel untuk UI, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |
| `min_grade` | `int` | Tingkat kelas minimum, opsional |
| `max_grade` | `int` | Tingkat kelas maksimum, opsional |

Primary Key: `id`

Foreign Key:
- `school_id` -> `schools.id` (`on delete cascade`)

Relasi:
- Satu `subjects` dapat dipakai oleh banyak `class_teacher_subjects`, `materials`, `assignments`, dan `grades`.
- Constraint unik: `(school_id, code)`.
- Constraint `subjects_grade_range_check` memastikan `min_grade`/`max_grade` berada di 1 sampai 6 dan `min_grade <= max_grade` jika keduanya diisi.
- Aplikasi memfilter mapel berdasarkan `classes.grade_level`, `subjects.min_grade`, dan `subjects.max_grade`.

### `classes`

Menyimpan kelas per sekolah dan tahun ajaran, misalnya `Kelas 4A`. Kelas menjadi ruang utama untuk siswa, materi, tugas, nilai, pengumuman kelas, dan penugasan guru.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `school_id` | `uuid` | Sekolah pemilik kelas, wajib |
| `academic_year_id` | `uuid` | Tahun ajaran kelas, wajib |
| `name` | `text` | Nama kelas, wajib |
| `grade_level` | `int` | Tingkat kelas, dipakai filter mapel |
| `homeroom_teacher_id` | `uuid` | Wali kelas, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `school_id` -> `schools.id` (`on delete cascade`)
- `academic_year_id` -> `academic_years.id` (`on delete cascade`)
- `homeroom_teacher_id` -> `profiles.id` (`on delete set null`)

Relasi:
- Satu `classes` memiliki banyak siswa melalui `profiles.class_id`.
- Satu `classes` memiliki banyak `class_teacher_subjects`, `materials`, `assignments`, dan `grades`.
- `announcements.target_class_id` dapat menunjuk ke kelas tertentu.
- Constraint unik: `(school_id, academic_year_id, name)`.
- Server action `deleteClass` mencegah hapus kelas jika masih dipakai siswa, materi, tugas, nilai, penugasan guru, atau pengumuman.

### `profiles`

Menyimpan profil aplikasi untuk setiap pengguna Supabase Auth. Tabel ini menjadi sumber role, nama, NISN/NIP, avatar, dan kelas siswa.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key dan FK ke `auth.users.id` |
| `school_id` | `uuid` | Sekolah pengguna, opsional |
| `role` | `public.user_role` | Role pengguna, default `student` |
| `full_name` | `text` | Nama lengkap, wajib |
| `username` | `text` | Username login, unik, opsional |
| `avatar_emoji` | `text` | Avatar emoji, opsional |
| `nisn` | `text` | Nomor siswa, unik, opsional |
| `nip` | `text` | Nomor pegawai, unik, opsional |
| `class_id` | `uuid` | Kelas siswa, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |
| `updated_at` | `timestamptz` | Waktu update, default `now()`, diperbarui trigger |

Primary Key: `id`

Foreign Key:
- `id` -> `auth.users.id` (`on delete cascade`)
- `school_id` -> `schools.id` (`on delete set null`)
- `class_id` -> `classes.id` (`on delete set null`)

Relasi:
- Satu `auth.users` memiliki satu `profiles`.
- Siswa terhubung ke kelas melalui `class_id`.
- Guru dapat menjadi wali kelas melalui `classes.homeroom_teacher_id`.
- Guru terhubung ke kelas dan mapel melalui `class_teacher_subjects.teacher_id`.
- `profiles` juga dipakai sebagai author/actor di `announcements`, `materials`, `assignments`, `submissions`, `grades`, `student_badges`, `stars_ledger`, dan `reward_redemptions`.
- Trigger `handle_new_user` membuat baris `profiles` dari metadata `auth.users` saat user dibuat.
- Trigger `profiles_set_updated_at` memperbarui `updated_at`.

### `class_teacher_subjects`

Tabel pivot untuk menentukan guru yang mengajar mapel tertentu di kelas tertentu. Tabel ini juga menjadi dasar helper RLS `teaches_class`.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `class_id` | `uuid` | Kelas yang diajar, wajib |
| `subject_id` | `uuid` | Mapel yang diajar, wajib |
| `teacher_id` | `uuid` | Guru pengajar, wajib |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `class_id` -> `classes.id` (`on delete cascade`)
- `subject_id` -> `subjects.id` (`on delete cascade`)
- `teacher_id` -> `profiles.id` (`on delete cascade`)

Relasi:
- Banyak kelas dapat memiliki banyak mapel dan guru melalui tabel ini.
- Constraint unik `(class_id, subject_id)` berarti satu mapel pada satu kelas hanya memiliki satu guru aktif.
- Server action `setClassSubjectTeacher` melakukan `upsert` berdasarkan `(class_id, subject_id)` atau menghapus penugasan jika guru dikosongkan.

### `announcements`

Menyimpan pengumuman sekolah atau pengumuman terarah berdasarkan role/kelas. Form aplikasi saat ini membuat pengumuman umum dengan author user login.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `school_id` | `uuid` | Sekolah pemilik pengumuman, wajib |
| `author_id` | `uuid` | Pembuat pengumuman, opsional |
| `title` | `text` | Judul, wajib |
| `body` | `text` | Isi pengumuman, wajib |
| `target_role` | `public.user_role` | Target role, opsional |
| `target_class_id` | `uuid` | Target kelas, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `school_id` -> `schools.id` (`on delete cascade`)
- `author_id` -> `profiles.id` (`on delete set null`)
- `target_class_id` -> `classes.id` (`on delete cascade`)

Relasi:
- Pengumuman selalu milik sekolah.
- Pengumuman dapat dibuat oleh profile tertentu.
- Pengumuman dapat dibatasi ke role atau kelas tertentu, meskipun server action saat ini mengisi pengumuman umum.

### `materials`

Menyimpan materi pembelajaran untuk kelas dan mapel tertentu. Materi dapat berupa PDF, video, teks, atau gambar.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `class_id` | `uuid` | Kelas tujuan materi, wajib |
| `subject_id` | `uuid` | Mapel materi, wajib |
| `teacher_id` | `uuid` | Guru pembuat/pengampu, opsional |
| `title` | `text` | Judul materi, wajib |
| `kind` | `public.material_kind` | Jenis materi, wajib |
| `url` | `text` | Link/file materi, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `class_id` -> `classes.id` (`on delete cascade`)
- `subject_id` -> `subjects.id` (`on delete cascade`)
- `teacher_id` -> `profiles.id` (`on delete set null`)

Relasi:
- Materi selalu terkait satu kelas dan satu mapel.
- Guru dapat terkait sebagai pembuat, tetapi jika profile guru dihapus kolom menjadi `null`.
- Dashboard dan halaman materi membaca relasi embedded `subjects(name)`.

### `assignments`

Menyimpan tugas/asesmen untuk kelas dan mapel tertentu. Assignment menjadi induk dari submission siswa.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `class_id` | `uuid` | Kelas tujuan tugas, wajib |
| `subject_id` | `uuid` | Mapel tugas, wajib |
| `teacher_id` | `uuid` | Guru pembuat/pengampu, opsional |
| `title` | `text` | Judul tugas, wajib |
| `kind` | `public.assignment_kind` | Jenis tugas, wajib |
| `description` | `text` | Deskripsi tugas, opsional |
| `due_at` | `timestamptz` | Tenggat tugas, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `class_id` -> `classes.id` (`on delete cascade`)
- `subject_id` -> `subjects.id` (`on delete cascade`)
- `teacher_id` -> `profiles.id` (`on delete set null`)

Relasi:
- Satu `assignments` memiliki banyak `submissions`.
- Assignment selalu terkait kelas dan mapel.
- Dashboard, ruang penilaian, dan halaman subject explorer memakai relasi embedded `subjects(name)`.

### `submissions`

Menyimpan status dan hasil pengumpulan tugas siswa. Satu siswa hanya boleh memiliki satu submission per assignment.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `assignment_id` | `uuid` | Assignment induk, wajib |
| `student_id` | `uuid` | Siswa yang mengumpulkan, wajib |
| `content_url` | `text` | Link/file jawaban, opsional |
| `status` | `public.submission_status` | Status submission, default `belum` |
| `score` | `numeric(5,2)` | Nilai submission, opsional |
| `teacher_comment` | `text` | Komentar guru, opsional |
| `submitted_at` | `timestamptz` | Waktu submit, opsional |
| `graded_at` | `timestamptz` | Waktu dinilai, opsional |
| `graded_by` | `uuid` | Guru/admin penilai, opsional |
| `updated_at` | `timestamptz` | Waktu update, default `now()`, diperbarui trigger |

Primary Key: `id`

Foreign Key:
- `assignment_id` -> `assignments.id` (`on delete cascade`)
- `student_id` -> `profiles.id` (`on delete cascade`)
- `graded_by` -> `profiles.id` (`on delete set null`)

Relasi:
- Satu assignment dapat memiliki banyak submission.
- Satu siswa dapat memiliki banyak submission.
- Constraint unik `(assignment_id, student_id)`.
- Ruang penilaian memakai embedded relation `profiles!submissions_student_id_fkey(full_name, avatar_emoji)`.
- Trigger `submissions_set_updated_at` memperbarui `updated_at`.

### `grades`

Menyimpan nilai rapor/periode per siswa, mapel, kelas, dan tahun ajaran. Data ini dipakai untuk rata-rata siswa, chart nilai, tren nilai, dan komentar guru.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `student_id` | `uuid` | Siswa pemilik nilai, wajib |
| `subject_id` | `uuid` | Mapel nilai, wajib |
| `class_id` | `uuid` | Kelas saat nilai dibuat, wajib |
| `academic_year_id` | `uuid` | Tahun ajaran nilai, wajib |
| `period_month` | `date` | Periode bulan nilai, wajib |
| `score` | `numeric(5,2)` | Nilai, wajib |
| `teacher_comment` | `text` | Komentar guru, opsional |
| `created_by` | `uuid` | Pembuat nilai, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `student_id` -> `profiles.id` (`on delete cascade`)
- `subject_id` -> `subjects.id` (`on delete cascade`)
- `class_id` -> `classes.id` (`on delete cascade`)
- `academic_year_id` -> `academic_years.id` (`on delete cascade`)
- `created_by` -> `profiles.id` (`on delete set null`)

Relasi:
- Nilai selalu terkait siswa, mapel, kelas, dan tahun ajaran.
- Halaman nilai memakai embedded relation `subjects(name)`.
- Saat ini tidak ada unique constraint untuk kombinasi siswa/mapel/periode, sehingga schema mengizinkan lebih dari satu nilai untuk kombinasi yang sama.

### `badges`

Menyimpan katalog lencana gamifikasi yang dapat diberikan kepada siswa.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `code` | `text` | Kode badge, wajib dan unik |
| `name` | `text` | Nama badge, wajib |
| `emoji` | `text` | Emoji badge, opsional |
| `description` | `text` | Deskripsi badge, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key: Tidak ada.

Relasi:
- Satu badge dapat dimiliki banyak siswa melalui `student_badges`.
- Aplikasi membaca katalog badge dan menandai badge yang sudah diperoleh siswa.

### `student_badges`

Menyimpan lencana yang diperoleh siswa.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `student_id` | `uuid` | Siswa pemilik badge, wajib |
| `badge_id` | `uuid` | Badge yang diperoleh, wajib |
| `earned_at` | `timestamptz` | Waktu diperoleh, default `now()` |
| `awarded_by` | `uuid` | Pemberi badge, opsional |

Primary Key: `id`

Foreign Key:
- `student_id` -> `profiles.id` (`on delete cascade`)
- `badge_id` -> `badges.id` (`on delete cascade`)
- `awarded_by` -> `profiles.id` (`on delete set null`)

Relasi:
- Tabel ini adalah many-to-many antara siswa (`profiles`) dan `badges`.
- Constraint unik `(student_id, badge_id)` mencegah badge yang sama diberikan dua kali ke siswa yang sama.

### `stars_ledger`

Menyimpan riwayat perubahan bintang siswa sebagai ledger. Saldo bintang dihitung dari jumlah `delta`, bukan disimpan sebagai kolom saldo.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `student_id` | `uuid` | Siswa pemilik transaksi bintang, wajib |
| `delta` | `int` | Perubahan bintang, bisa positif atau negatif |
| `reason` | `text` | Alasan perubahan, opsional |
| `created_by` | `uuid` | Pembuat transaksi, opsional |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `student_id` -> `profiles.id` (`on delete cascade`)
- `created_by` -> `profiles.id` (`on delete set null`)

Relasi:
- Satu siswa memiliki banyak catatan ledger.
- View `student_star_totals` dan `class_leaderboard` menjumlahkan `delta` dari tabel ini.
- Server action `approveRedemption` menambah ledger negatif sesuai `reward_redemptions.cost`.
- RLS hanya mendefinisikan select dan insert, sehingga secara aplikasi tabel ini diperlakukan append-only.

### `rewards`

Menyimpan katalog hadiah yang bisa ditukar siswa dengan bintang.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `school_id` | `uuid` | Sekolah pemilik reward, wajib |
| `name` | `text` | Nama reward, wajib |
| `emoji` | `text` | Emoji reward, opsional |
| `cost` | `int` | Biaya bintang, wajib |
| `is_active` | `boolean` | Reward aktif, default `true` |
| `created_at` | `timestamptz` | Waktu dibuat, default `now()` |

Primary Key: `id`

Foreign Key:
- `school_id` -> `schools.id` (`on delete cascade`)

Relasi:
- Satu reward dapat memiliki banyak `reward_redemptions`.
- Halaman toko bintang hanya membaca reward dengan `is_active = true`.

### `reward_redemptions`

Menyimpan permintaan penukaran reward oleh siswa dan status persetujuan guru/admin.

Kolom:
| Kolom | Tipe | Keterangan |
|--------|--------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `student_id` | `uuid` | Siswa yang meminta penukaran, wajib |
| `reward_id` | `uuid` | Reward yang diminta, wajib |
| `cost` | `int` | Biaya reward saat request dibuat, wajib |
| `status` | `public.redemption_status` | Status request, default `pending` |
| `requested_at` | `timestamptz` | Waktu request, default `now()` |
| `decided_at` | `timestamptz` | Waktu disetujui/ditolak, opsional |
| `decided_by` | `uuid` | Pengambil keputusan, opsional |
| `updated_at` | `timestamptz` | Waktu update, default `now()`, diperbarui trigger |

Primary Key: `id`

Foreign Key:
- `student_id` -> `profiles.id` (`on delete cascade`)
- `reward_id` -> `rewards.id` (`on delete cascade`)
- `decided_by` -> `profiles.id` (`on delete set null`)

Relasi:
- Satu siswa dapat membuat banyak request penukaran.
- Satu reward dapat diminta berkali-kali oleh siswa.
- Halaman gamifikasi memakai embedded relation `profiles!reward_redemptions_student_id_fkey(full_name, class_id)` dan `rewards(name)`.
- Trigger `reward_redemptions_set_updated_at` memperbarui `updated_at`.

## Index dan Constraint Penting

| Tabel | Index/Constraint |
|--------|--------|
| `academic_years` | Index `academic_years_school_id_idx`; unique `(school_id, year_label, semester)` |
| `subjects` | Index `subjects_school_id_idx`; unique `(school_id, code)`; check `subjects_grade_range_check` |
| `classes` | Index `classes_school_id_idx`, `classes_academic_year_id_idx`, `classes_homeroom_teacher_id_idx`; unique `(school_id, academic_year_id, name)` |
| `profiles` | Index `profiles_role_idx`, `profiles_class_id_idx`, `profiles_school_id_idx`; unique `username`, `nisn`, `nip` |
| `class_teacher_subjects` | Index `cts_class_id_idx`, `cts_teacher_id_idx`, `cts_subject_id_idx`; unique `(class_id, subject_id)` |
| `announcements` | Index `announcements_school_id_idx`, `announcements_target_class_id_idx` |
| `materials` | Index `materials_class_id_idx`, `materials_subject_id_idx`, `materials_teacher_id_idx` |
| `assignments` | Index `assignments_class_id_idx`, `assignments_subject_id_idx` |
| `submissions` | Index `submissions_assignment_id_idx`, `submissions_student_id_idx`; unique `(assignment_id, student_id)` |
| `grades` | Index `grades_student_id_idx`, `grades_class_id_idx`, `grades_subject_id_idx` |
| `badges` | Unique `code` |
| `student_badges` | Index `student_badges_student_id_idx`; unique `(student_id, badge_id)` |
| `stars_ledger` | Index `stars_ledger_student_id_idx` |
| `rewards` | Index `rewards_school_id_idx` |
| `reward_redemptions` | Index `reward_redemptions_student_id_idx`, `reward_redemptions_status_idx` |

## View dan Function Pendukung

### View

| View | Kolom | Fungsi |
|--------|--------|--------|
| `student_star_totals` | `student_id`, `total_stars` | Menjumlahkan `stars_ledger.delta` per siswa. Dipakai dashboard siswa dan toko reward. |
| `class_leaderboard` | `student_id`, `full_name`, `class_id`, `total_stars` | Menampilkan leaderboard siswa per kelas berdasarkan total bintang. |

Kedua view dibuat dengan `security_invoker = true` dan diberi grant `select` ke role `authenticated`.

### Function dan Trigger

| Nama | Fungsi |
|--------|--------|
| `set_updated_at()` | Trigger helper untuk mengisi `updated_at = now()` sebelum update. |
| `current_role()` | Mengambil `profiles.role` user login. |
| `current_class_id()` | Mengambil `profiles.class_id` user login. |
| `is_admin()` | Helper boolean role admin untuk RLS. |
| `is_principal()` | Helper boolean role principal untuk RLS. |
| `is_teacher()` | Helper boolean role teacher untuk RLS. |
| `is_student()` | Helper boolean role student untuk RLS. |
| `teaches_class(p_class_id uuid)` | Mengecek apakah user login adalah guru yang mengajar kelas tertentu berdasarkan `class_teacher_subjects`. |
| `handle_new_user()` | Trigger function setelah insert `auth.users`, membuat baris `profiles` dari `raw_user_meta_data`. |
| `email_for_username(p_username text)` | RPC login untuk mencari email Auth dari `profiles.username`. Diberi grant ke `anon` dan `authenticated`. |

Trigger:
- `profiles_set_updated_at` pada `profiles`.
- `submissions_set_updated_at` pada `submissions`.
- `reward_redemptions_set_updated_at` pada `reward_redemptions`.
- `on_auth_user_created` pada `auth.users`.

## Relasi Antar Tabel

Secara hierarki, `schools` berada di tingkat paling atas. Di bawahnya ada `academic_years`, `subjects`, `classes`, `announcements`, dan `rewards`. `classes` selalu terkait ke satu `academic_years` dan menjadi pusat operasional kelas.

`profiles` adalah representasi user aplikasi yang terhubung 1:1 dengan `auth.users`. Siswa memiliki `class_id`, sedangkan guru memiliki relasi mengajar melalui `class_teacher_subjects`. Tabel `class_teacher_subjects` menghubungkan `classes`, `subjects`, dan `profiles` role guru, serta digunakan oleh RLS untuk menentukan hak akses guru terhadap kelas.

Konten pembelajaran memakai relasi langsung ke kelas dan mapel. `materials` dan `assignments` sama-sama memiliki `class_id`, `subject_id`, dan `teacher_id`. `assignments` menjadi induk `submissions`; setiap submission menghubungkan satu assignment dengan satu siswa dan dapat memiliki guru penilai (`graded_by`).

Nilai rapor disimpan di `grades`, yang mengikat siswa, mapel, kelas, dan tahun ajaran dalam satu baris. Desain ini membuat nilai bisa dianalisis berdasarkan siswa, kelas, mapel, periode bulan, dan tahun ajaran.

Gamifikasi dipisah menjadi katalog dan transaksi. `badges` adalah katalog lencana, sedangkan `student_badges` adalah relasi many-to-many siswa-lencana. `stars_ledger` menyimpan perubahan bintang sebagai catatan transaksi. `student_star_totals` dan `class_leaderboard` menghitung saldo dan ranking dari ledger. `rewards` adalah katalog hadiah, sedangkan `reward_redemptions` menyimpan request penukaran.

Pengumuman (`announcements`) milik sekolah, dibuat oleh profile tertentu, dan dapat diarahkan ke role atau kelas tertentu. Saat ini server action `publishAnnouncement` membuat pengumuman umum tanpa `target_role` dan `target_class_id`.

## Relasi Yang Dipakai Aplikasi

Aplikasi memakai embedded select Supabase untuk beberapa relasi:

- `profiles` -> `classes` melalui FK `profiles_class_id_fkey`, dipakai di profil user, daftar siswa, dan master kelas.
- `class_teacher_subjects` -> `subjects` dan `classes`, dipakai untuk statistik/daftar penugasan guru.
- `materials` -> `subjects`, dipakai halaman materi dan dashboard.
- `assignments` -> `subjects`, dipakai dashboard siswa, subject explorer, dan ruang penilaian.
- `grades` -> `subjects`, dipakai halaman laporan nilai.
- `submissions` -> `profiles` melalui FK `submissions_student_id_fkey`, dipakai ruang penilaian.
- `reward_redemptions` -> `profiles` melalui FK `reward_redemptions_student_id_fkey`, dipakai halaman gamifikasi untuk memfilter request per kelas.
- `reward_redemptions` -> `rewards`, dipakai untuk nama reward pada request penukaran.
- View `student_star_totals`, dipakai dashboard siswa dan toko reward.
- View `class_leaderboard`, dipakai papan bintang per kelas.

## Type Definitions Di Project

Project saat ini belum memiliki generated Supabase type seperti `Database`, `Tables<>`, atau `Enums<>`. Supabase client dibuat tanpa generic database type di `src/lib/supabase/client.ts` dan `src/lib/supabase/server.ts`.

Tipe lokal yang relevan:

| File | Tipe | Keterangan |
|--------|--------|--------|
| `src/lib/auth-context.tsx` | `Role` | Union role aplikasi: `student`, `teacher`, `principal`, `admin`. |
| `src/lib/auth-context.tsx` | `AuthUser` | Bentuk user aktif di UI, berasal dari `profiles` dan relasi kelas. |
| `src/lib/data/announcements.ts` | `AnnouncementRow` | Hasil select `announcements`: `id`, `title`, `body`, `created_at`. |
| `src/lib/data/subjects.ts` | `ContentRow` | Bentuk item materi/tugas di subject explorer. |
| Komponen/page UI | `ClassRow`, `YearRow`, `SubjectRow`, `StudentRow`, `GradeRow`, `PendingRow`, `LeaderRow`, `RequestRow` | Tipe lokal untuk data hasil query Supabase per halaman. |

Karena belum ada generated database types, beberapa relasi embedded di-cast manual, misalnya `subjects as unknown as { name: string }` atau `classes as unknown as { name: string }`.

## Server Actions Dan Operasi Data

Server actions utama berada di `src/app/(app)/actions.ts`, `src/app/(app)/users/actions.ts`, dan `src/app/login/actions.ts`.

Operasi autentikasi:
- `login`: memanggil RPC `email_for_username`, lalu `supabase.auth.signInWithPassword`.
- `logout`: `supabase.auth.signOut`.
- `changePassword`: verifikasi password lama dengan login ulang, lalu `supabase.auth.updateUser`.
- `resetPasswordToDefault`: admin client mengubah password ke NISN/NIP.

Operasi sekolah:
- `saveSchoolSettings`: update `schools.name`, `schools.address`, dan `schools.phone`.
- `uploadSchoolLogo`: upload file ke bucket storage `school-assets`, lalu update `schools.logo_url`.

Operasi struktur akademik:
- `createClass`, `updateClass`, `deleteClass`: insert/update/delete `classes`, dengan blocker delete terhadap siswa, materi, tugas, nilai, penugasan guru, dan pengumuman.
- `createSubject`, `updateSubject`, `deleteSubject`: insert/update/delete `subjects`, termasuk `min_grade` dan `max_grade`, dengan blocker terhadap materi, tugas, nilai, dan penugasan guru.
- `createAcademicYear`, `setActiveAcademicYear`, `deleteAcademicYear`: kelola `academic_years`, termasuk aturan tidak menghapus tahun ajaran aktif dan tidak menghapus tahun ajaran yang masih memiliki kelas.
- `setClassSubjectTeacher`: upsert/delete `class_teacher_subjects`.
- `assignStudentToClass`: update `profiles.class_id`.

Operasi pengguna:
- `createStudent`: admin auth membuat user dengan email berbasis NISN; `handle_new_user` membuat `profiles`.
- `updateStudent`: admin auth update email, lalu update `profiles.full_name`, `username`, `nisn`, dan `class_id`.
- `deleteStudent`: cek blocker `submissions`, `grades`, `student_badges`, `stars_ledger`, dan `reward_redemptions`, lalu delete user auth.
- `createTeacher`: admin auth membuat user role teacher berbasis NIP.
- `createPrincipal`: memastikan hanya ada satu principal, lalu membuat user role principal.
- `updateStaff`: admin auth update email, lalu update `profiles.full_name`, `username`, dan `nip`.
- `deleteTeacher`: cek blocker `class_teacher_subjects`, lalu delete user auth.

Operasi pengumuman dan gamifikasi:
- `publishAnnouncement`: insert `announcements`.
- `redeemReward`: insert `reward_redemptions` status `pending` dengan cost reward saat request dibuat.
- `approveRedemption`: update `reward_redemptions` menjadi `approved`, isi `decided_at`/`decided_by`, lalu insert `stars_ledger` negatif.
- `rejectRedemption`: update `reward_redemptions` menjadi `rejected`, isi `decided_at`/`decided_by`.

Catatan Supabase Storage:
- Aplikasi memakai bucket `school-assets` untuk logo sekolah.
- Tidak ada migration SQL di project saat ini yang membuat bucket tersebut; bucket diasumsikan sudah ada di Supabase project.

## Seed Data Saat Ini

`supabase/seed.sql` mengisi data demo untuk membuat aplikasi langsung dapat digunakan setelah `supabase db reset`.

Isi utama seed:
- Satu sekolah: `SD Inpres Nggodimeda`.
- Tiga tahun ajaran/semester: `2024/2025 genap` aktif, `2024/2025 ganjil`, dan `2023/2024 genap`.
- Enam mata pelajaran awal: `mtk`, `ipa`, `bi`, `ppkn`, `agama`, `sbdp`.
- Enam kelas awal: `Kelas 1A` sampai `Kelas 6A` pada tahun ajaran aktif.
- Sepuluh akun demo: `admin`, `kepsek`, `guru`, `rahmat`, `linda`, `budi`, `ani`, `citra`, `dimas`, `eka`.
- Penugasan guru untuk `Kelas 4A`: `guru` untuk Matematika, `rahmat` untuk IPA, dan `linda` untuk Bahasa Indonesia.
- Data demo pengumuman, materi, tugas, submission, nilai, badge, ledger bintang, reward, dan dua request redemption pending.

Seed menulis langsung ke `auth.users` dan `auth.identities`. Karena trigger `on_auth_user_created` aktif, metadata Auth dari seed otomatis membuat baris `profiles`.

## RLS Saat Ini

Semua tabel public mengaktifkan RLS. Pola akses utamanya:

- `admin`: akses tulis penuh untuk master data utama seperti sekolah, tahun ajaran, mapel, kelas, CTS, badge, dan reward; dapat mengelola data lain sesuai policy.
- `principal`: umumnya read-only untuk data sekolah, kelas, konten, nilai, dan gamifikasi.
- `teacher`: dapat membaca/menulis data yang terkait kelas yang diajar berdasarkan `class_teacher_subjects` dan helper `teaches_class`.
- `student`: dapat membaca data kelasnya, submission/nilai/badge/bintang/redemption miliknya, dan membuat redemption/submission sesuai policy.

Beberapa tabel katalog (`schools`, `academic_years`, `subjects`, `classes`, `class_teacher_subjects`, `badges`, `rewards`) memiliki policy select yang terbuka untuk authenticated user sesuai definisi RLS saat ini. `profiles` lebih ketat: user dapat membaca dirinya sendiri, admin/principal dapat membaca, dan guru dapat membaca siswa pada kelas yang diajar.

## Catatan Desain

Database memakai Supabase Auth sebagai sumber autentikasi, lalu `profiles` sebagai profil domain LMS. Desain ini memisahkan credential dari data sekolah, tetapi tetap menjaga relasi kuat melalui `profiles.id -> auth.users.id`.

`school_id` disimpan di banyak tabel master agar schema siap untuk multi-school, meskipun aplikasi saat ini mengambil baris sekolah pertama dan seed hanya membuat satu sekolah demo.

`class_teacher_subjects` dipakai sebagai pivot akademik sekaligus dasar otorisasi guru. Karena constraint unik `(class_id, subject_id)`, satu mapel di satu kelas hanya punya satu guru aktif pada kondisi schema saat ini.

`subjects.min_grade` dan `subjects.max_grade` membuat mapel bisa berlaku hanya untuk rentang kelas tertentu tanpa perlu tabel pivot tambahan antara kelas dan mapel. UI master kelas dan subject explorer memfilter mapel berdasarkan rentang ini.

`grades` menyimpan snapshot nilai berdasarkan periode bulan dan tidak berasal langsung dari `submissions`. Ini membuat nilai rapor bisa diinput sebagai rekap terpisah dari tugas harian.

`stars_ledger` memakai pola ledger agar saldo bintang dapat diaudit dari riwayat transaksi. Saldo tidak disimpan sebagai kolom tersendiri, melainkan dihitung melalui view.

Server actions menambahkan validasi hapus di level aplikasi untuk mencegah kehilangan data terkait, walaupun beberapa FK memakai `on delete cascade`. Artinya desain database mengizinkan cascade, tetapi UI/admin flow saat ini memilih menolak hapus jika data masih dipakai.

Data demo pada `seed.sql` juga langsung mengisi `auth.users` dan `auth.identities`, sehingga trigger `handle_new_user` membuat `profiles` otomatis dari metadata user. Ini sesuai kebutuhan demo lokal, tetapi kredensial demo perlu diganti/dihapus sebelum produksi.
