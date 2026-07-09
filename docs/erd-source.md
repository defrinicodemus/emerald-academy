# Entity Relationship Diagram Source

Dokumen ini adalah sumber teks untuk ERD berdasarkan relasi foreign key yang terverifikasi dari migration SQL dan dokumentasi database project. Dokumen ini tidak membuat gambar dan tidak menambahkan SQL.

Catatan:
- `auth.users` adalah tabel Supabase Auth yang direferensikan oleh `profiles.id`.
- Tidak ada tabel `students` terpisah. Siswa direpresentasikan oleh baris `profiles` dengan `role = 'student'`; karena itu relasi kelas ke siswa ditulis sebagai `classes (1) ----- (N) profiles [students]`.
- Relasi dengan FK nullable tetap ditulis sebagai `(1) ----- (N)`, tetapi implementasinya mengizinkan sisi child tidak memiliki parent aktif karena `on delete set null` atau kolom nullable.

## Entitas

### auth.users

Primary Key:
`id`

Foreign Key:
Tidak didokumentasikan di migration project ini.

Relasi:
- `auth.users (1) ----- (1) profiles`
- Relasi ini berasal dari `profiles.id references auth.users(id) on delete cascade`.

### schools

Primary Key:
`id`

Foreign Key:
Tidak ada.

Relasi:
- `schools (1) ----- (N) academic_years`
- `schools (1) ----- (N) subjects`
- `schools (1) ----- (N) classes`
- `schools (1) ----- (N) profiles`
- `schools (1) ----- (N) announcements`
- `schools (1) ----- (N) rewards`

### academic_years

Primary Key:
`id`

Foreign Key:
- `school_id` -> `schools.id`

Relasi:
- `schools (1) ----- (N) academic_years`
- `academic_years (1) ----- (N) classes`
- `academic_years (1) ----- (N) grades`

### subjects

Primary Key:
`id`

Foreign Key:
- `school_id` -> `schools.id`

Relasi:
- `schools (1) ----- (N) subjects`
- `subjects (1) ----- (N) class_teacher_subjects`
- `subjects (1) ----- (N) materials`
- `subjects (1) ----- (N) assignments`
- `subjects (1) ----- (N) grades`

### classes

Primary Key:
`id`

Foreign Key:
- `school_id` -> `schools.id`
- `academic_year_id` -> `academic_years.id`
- `homeroom_teacher_id` -> `profiles.id`

Relasi:
- `schools (1) ----- (N) classes`
- `academic_years (1) ----- (N) classes`
- `profiles (1) ----- (N) classes [homeroom_teacher]`
- `classes (1) ----- (N) profiles [students]`
- `classes (1) ----- (N) class_teacher_subjects`
- `classes (1) ----- (N) announcements [target_class]`
- `classes (1) ----- (N) materials`
- `classes (1) ----- (N) assignments`
- `classes (1) ----- (N) grades`

### profiles

Primary Key:
`id`

Foreign Key:
- `id` -> `auth.users.id`
- `school_id` -> `schools.id`
- `class_id` -> `classes.id`

Relasi:
- `auth.users (1) ----- (1) profiles`
- `schools (1) ----- (N) profiles`
- `classes (1) ----- (N) profiles [students]`
- `profiles (1) ----- (N) classes [homeroom_teacher]`
- `profiles (1) ----- (N) class_teacher_subjects [teacher]`
- `profiles (1) ----- (N) announcements [author]`
- `profiles (1) ----- (N) materials [teacher]`
- `profiles (1) ----- (N) assignments [teacher]`
- `profiles (1) ----- (N) submissions [student]`
- `profiles (1) ----- (N) submissions [graded_by]`
- `profiles (1) ----- (N) grades [student]`
- `profiles (1) ----- (N) grades [created_by]`
- `profiles (1) ----- (N) student_badges [student]`
- `profiles (1) ----- (N) student_badges [awarded_by]`
- `profiles (1) ----- (N) stars_ledger [student]`
- `profiles (1) ----- (N) stars_ledger [created_by]`
- `profiles (1) ----- (N) reward_redemptions [student]`
- `profiles (1) ----- (N) reward_redemptions [decided_by]`

### class_teacher_subjects

Primary Key:
`id`

Foreign Key:
- `class_id` -> `classes.id`
- `subject_id` -> `subjects.id`
- `teacher_id` -> `profiles.id`

Relasi:
- `classes (1) ----- (N) class_teacher_subjects`
- `subjects (1) ----- (N) class_teacher_subjects`
- `profiles (1) ----- (N) class_teacher_subjects [teacher]`
- Pivot ini membentuk relasi mengajar antara kelas, mata pelajaran, dan guru.

### announcements

Primary Key:
`id`

Foreign Key:
- `school_id` -> `schools.id`
- `author_id` -> `profiles.id`
- `target_class_id` -> `classes.id`

Relasi:
- `schools (1) ----- (N) announcements`
- `profiles (1) ----- (N) announcements [author]`
- `classes (1) ----- (N) announcements [target_class]`

### materials

Primary Key:
`id`

Foreign Key:
- `class_id` -> `classes.id`
- `subject_id` -> `subjects.id`
- `teacher_id` -> `profiles.id`

Relasi:
- `classes (1) ----- (N) materials`
- `subjects (1) ----- (N) materials`
- `profiles (1) ----- (N) materials [teacher]`

### assignments

Primary Key:
`id`

Foreign Key:
- `class_id` -> `classes.id`
- `subject_id` -> `subjects.id`
- `teacher_id` -> `profiles.id`

Relasi:
- `classes (1) ----- (N) assignments`
- `subjects (1) ----- (N) assignments`
- `profiles (1) ----- (N) assignments [teacher]`
- `assignments (1) ----- (N) submissions`

### submissions

Primary Key:
`id`

Foreign Key:
- `assignment_id` -> `assignments.id`
- `student_id` -> `profiles.id`
- `graded_by` -> `profiles.id`

Relasi:
- `assignments (1) ----- (N) submissions`
- `profiles (1) ----- (N) submissions [student]`
- `profiles (1) ----- (N) submissions [graded_by]`

### grades

Primary Key:
`id`

Foreign Key:
- `student_id` -> `profiles.id`
- `subject_id` -> `subjects.id`
- `class_id` -> `classes.id`
- `academic_year_id` -> `academic_years.id`
- `created_by` -> `profiles.id`

Relasi:
- `profiles (1) ----- (N) grades [student]`
- `subjects (1) ----- (N) grades`
- `classes (1) ----- (N) grades`
- `academic_years (1) ----- (N) grades`
- `profiles (1) ----- (N) grades [created_by]`

### badges

Primary Key:
`id`

Foreign Key:
Tidak ada.

Relasi:
- `badges (1) ----- (N) student_badges`

### student_badges

Primary Key:
`id`

Foreign Key:
- `student_id` -> `profiles.id`
- `badge_id` -> `badges.id`
- `awarded_by` -> `profiles.id`

Relasi:
- `profiles (1) ----- (N) student_badges [student]`
- `badges (1) ----- (N) student_badges`
- `profiles (1) ----- (N) student_badges [awarded_by]`
- Pivot ini membentuk relasi siswa dengan katalog badge.

### stars_ledger

Primary Key:
`id`

Foreign Key:
- `student_id` -> `profiles.id`
- `created_by` -> `profiles.id`

Relasi:
- `profiles (1) ----- (N) stars_ledger [student]`
- `profiles (1) ----- (N) stars_ledger [created_by]`

### rewards

Primary Key:
`id`

Foreign Key:
- `school_id` -> `schools.id`

Relasi:
- `schools (1) ----- (N) rewards`
- `rewards (1) ----- (N) reward_redemptions`

### reward_redemptions

Primary Key:
`id`

Foreign Key:
- `student_id` -> `profiles.id`
- `reward_id` -> `rewards.id`
- `decided_by` -> `profiles.id`

Relasi:
- `profiles (1) ----- (N) reward_redemptions [student]`
- `rewards (1) ----- (N) reward_redemptions`
- `profiles (1) ----- (N) reward_redemptions [decided_by]`

## Relasi Lengkap

`auth.users (1) ----- (1) profiles`

`schools (1) ----- (N) academic_years`

`schools (1) ----- (N) subjects`

`schools (1) ----- (N) classes`

`academic_years (1) ----- (N) classes`

`schools (1) ----- (N) profiles`

`classes (1) ----- (N) profiles [students]`

`profiles (1) ----- (N) classes [homeroom_teacher]`

`classes (1) ----- (N) class_teacher_subjects`

`subjects (1) ----- (N) class_teacher_subjects`

`profiles (1) ----- (N) class_teacher_subjects [teacher]`

`schools (1) ----- (N) announcements`

`profiles (1) ----- (N) announcements [author]`

`classes (1) ----- (N) announcements [target_class]`

`classes (1) ----- (N) materials`

`subjects (1) ----- (N) materials`

`profiles (1) ----- (N) materials [teacher]`

`classes (1) ----- (N) assignments`

`subjects (1) ----- (N) assignments`

`profiles (1) ----- (N) assignments [teacher]`

`assignments (1) ----- (N) submissions`

`profiles (1) ----- (N) submissions [student]`

`profiles (1) ----- (N) submissions [graded_by]`

`profiles (1) ----- (N) grades [student]`

`subjects (1) ----- (N) grades`

`classes (1) ----- (N) grades`

`academic_years (1) ----- (N) grades`

`profiles (1) ----- (N) grades [created_by]`

`profiles (1) ----- (N) student_badges [student]`

`badges (1) ----- (N) student_badges`

`profiles (1) ----- (N) student_badges [awarded_by]`

`profiles (1) ----- (N) stars_ledger [student]`

`profiles (1) ----- (N) stars_ledger [created_by]`

`schools (1) ----- (N) rewards`

`profiles (1) ----- (N) reward_redemptions [student]`

`rewards (1) ----- (N) reward_redemptions`

`profiles (1) ----- (N) reward_redemptions [decided_by]`

## Catatan Relasi

- `auth.users (1) ----- (1) profiles`: `profiles.id` adalah primary key sekaligus FK ke `auth.users.id`. Trigger `handle_new_user()` membuat profile saat user Auth dibuat.
- `schools (1) ----- (N) academic_years`: setiap tahun ajaran memiliki `school_id`; aplikasi mengelola tahun ajaran per sekolah.
- `schools (1) ----- (N) subjects`: setiap mata pelajaran memiliki `school_id`; kode mapel unik per sekolah.
- `schools (1) ----- (N) classes`: setiap kelas memiliki `school_id`; kelas dibuat untuk sekolah yang aktif di aplikasi.
- `academic_years (1) ----- (N) classes`: setiap kelas wajib berada pada satu tahun ajaran.
- `schools (1) ----- (N) profiles`: profile dapat terikat ke sekolah melalui `school_id`; metadata Auth saat pembuatan user mengisi nilai ini.
- `classes (1) ----- (N) profiles [students]`: siswa adalah `profiles` dengan `role = 'student'` dan `class_id` mengarah ke `classes.id`.
- `profiles (1) ----- (N) classes [homeroom_teacher]`: `classes.homeroom_teacher_id` menunjuk profile guru wali kelas.
- `classes (1) ----- (N) class_teacher_subjects`: satu kelas dapat memiliki banyak penugasan guru-mapel.
- `subjects (1) ----- (N) class_teacher_subjects`: satu mata pelajaran dapat ditugaskan pada banyak kelas.
- `profiles (1) ----- (N) class_teacher_subjects [teacher]`: guru pengajar disimpan sebagai `teacher_id`; helper RLS `teaches_class()` memakai relasi ini.
- `schools (1) ----- (N) announcements`: pengumuman selalu memiliki `school_id`.
- `profiles (1) ----- (N) announcements [author]`: pembuat pengumuman disimpan di `author_id`; RLS update/delete mengizinkan author mengubah pengumuman.
- `classes (1) ----- (N) announcements [target_class]`: pengumuman dapat diarahkan ke kelas tertentu melalui `target_class_id`.
- `classes (1) ----- (N) materials`: materi wajib memiliki kelas tujuan.
- `subjects (1) ----- (N) materials`: materi wajib memiliki mata pelajaran.
- `profiles (1) ----- (N) materials [teacher]`: materi dapat menyimpan guru pembuat/pengampu melalui `teacher_id`.
- `classes (1) ----- (N) assignments`: tugas wajib memiliki kelas tujuan.
- `subjects (1) ----- (N) assignments`: tugas wajib memiliki mata pelajaran.
- `profiles (1) ----- (N) assignments [teacher]`: tugas dapat menyimpan guru pembuat/pengampu melalui `teacher_id`.
- `assignments (1) ----- (N) submissions`: submission selalu milik satu assignment; constraint unik `(assignment_id, student_id)` membatasi satu submission per siswa untuk tugas yang sama.
- `profiles (1) ----- (N) submissions [student]`: siswa pengumpul tugas disimpan di `student_id`.
- `profiles (1) ----- (N) submissions [graded_by]`: guru/admin penilai dapat disimpan di `graded_by`.
- `profiles (1) ----- (N) grades [student]`: nilai rapor/periode selalu terkait siswa melalui `student_id`.
- `subjects (1) ----- (N) grades`: nilai selalu terkait mata pelajaran.
- `classes (1) ----- (N) grades`: nilai selalu terkait kelas.
- `academic_years (1) ----- (N) grades`: nilai selalu terkait tahun ajaran.
- `profiles (1) ----- (N) grades [created_by]`: pembuat nilai dapat dicatat melalui `created_by`.
- `profiles (1) ----- (N) student_badges [student]`: badge yang diperoleh siswa disimpan melalui `student_id`.
- `badges (1) ----- (N) student_badges`: `student_badges.badge_id` menunjuk katalog badge; constraint unik `(student_id, badge_id)` mencegah duplikasi badge untuk siswa yang sama.
- `profiles (1) ----- (N) student_badges [awarded_by]`: pemberi badge dapat dicatat melalui `awarded_by`.
- `profiles (1) ----- (N) stars_ledger [student]`: transaksi bintang selalu terkait siswa melalui `student_id`.
- `profiles (1) ----- (N) stars_ledger [created_by]`: pembuat transaksi bintang dapat dicatat melalui `created_by`.
- `schools (1) ----- (N) rewards`: reward katalog memiliki `school_id`.
- `profiles (1) ----- (N) reward_redemptions [student]`: request penukaran reward dibuat oleh siswa melalui `student_id`.
- `rewards (1) ----- (N) reward_redemptions`: request penukaran menunjuk reward yang diminta melalui `reward_id`.
- `profiles (1) ----- (N) reward_redemptions [decided_by]`: profile yang menyetujui atau menolak request dicatat melalui `decided_by`.
