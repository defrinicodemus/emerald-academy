# Data Dictionary

Dokumen ini dibuat dari schema/migration Supabase project saat ini dan disilang-cek dengan `docs/database-design.md`. Fokus dokumen ini adalah seluruh tabel `public` yang didefinisikan di migration, bukan view.

Catatan:
- `Nullable` mengikuti definisi `not null` pada migration. Primary key dianggap tidak nullable.
- `Default Value` ditulis sesuai SQL migration.
- `Referensi` berisi FK, enum, atau constraint terkait jika ada.
- `Digunakan Oleh` merangkum pemakaian oleh relasi database, RLS, seed, data loader, server actions, atau halaman aplikasi yang terverifikasi dari project.

## schools

Tujuan:
Menyimpan identitas sekolah yang menjadi induk data tahun ajaran, kelas, mata pelajaran, pengumuman, reward, dan profil pengguna.

### id

Deskripsi:
Identifier unik sekolah.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `academic_years.school_id`, `subjects.school_id`, `classes.school_id`, `profiles.school_id`, `announcements.school_id`, dan `rewards.school_id`; server actions pengaturan sekolah dan pembuatan data akademik/pengguna.

---

### name

Deskripsi:
Nama sekolah.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman login, settings, dan data profil sekolah melalui `getSchool()` dan `saveSchoolSettings()`.

---

### tagline

Deskripsi:
Tagline atau slogan sekolah.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed data dan loader profil sekolah; tidak terlihat diubah oleh server action settings saat ini.

---

### address

Deskripsi:
Alamat sekolah.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman settings melalui `getSchool()` dan `saveSchoolSettings()`.

---

### phone

Deskripsi:
Nomor telepon sekolah.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman settings melalui `getSchool()` dan `saveSchoolSettings()`.

---

### created_at

Deskripsi:
Waktu data sekolah dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan data; tidak terlihat dipakai langsung oleh UI saat ini.

---

### logo_url

Deskripsi:
URL publik logo sekolah yang disimpan melalui Supabase Storage.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Bucket storage `school-assets` dipakai oleh aplikasi, tetapi bucket tidak dibuat melalui migration SQL.

Digunakan Oleh:
Halaman login dan settings melalui `getSchool()` dan `uploadSchoolLogo()`.

---

## academic_years

Tujuan:
Menyimpan tahun ajaran dan semester milik sekolah, termasuk penanda tahun ajaran aktif.

### id

Deskripsi:
Identifier unik tahun ajaran.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `classes.academic_year_id` dan `grades.academic_year_id`; halaman Struktur Akademik.

---

### school_id

Deskripsi:
Sekolah pemilik tahun ajaran.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`schools.id` (`on delete cascade`)

Digunakan Oleh:
Constraint unik `(school_id, year_label, semester)`, server actions `createAcademicYear()` dan `setActiveAcademicYear()`.

---

### year_label

Deskripsi:
Label tahun ajaran, misalnya `2024/2025`.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Bagian dari unique constraint `(school_id, year_label, semester)`.

Digunakan Oleh:
Halaman Struktur Akademik dan server action `createAcademicYear()`.

---

### semester

Deskripsi:
Semester tahun ajaran.

Tipe Data:
`public.semester_type`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.semester_type`: `ganjil`, `genap`; bagian dari unique constraint `(school_id, year_label, semester)`.

Digunakan Oleh:
Halaman Struktur Akademik dan server action `createAcademicYear()`.

---

### is_active

Deskripsi:
Menandai tahun ajaran/semester yang sedang aktif untuk sekolah.

Tipe Data:
`boolean`

Nullable:
Tidak

Default Value:
`false`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Struktur Akademik, `createClass()` untuk memilih tahun ajaran default, dan `setActiveAcademicYear()`.

---

### created_at

Deskripsi:
Waktu data tahun ajaran dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan data; tidak terlihat dipakai langsung oleh UI saat ini.

---

## subjects

Tujuan:
Menyimpan master mata pelajaran per sekolah, termasuk kode, tampilan UI, dan batas tingkat kelas yang berlaku.

### id

Deskripsi:
Identifier unik mata pelajaran.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `class_teacher_subjects.subject_id`, `materials.subject_id`, `assignments.subject_id`, dan `grades.subject_id`; banyak halaman pembelajaran.

---

### school_id

Deskripsi:
Sekolah pemilik mata pelajaran.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`schools.id` (`on delete cascade`)

Digunakan Oleh:
Constraint unik `(school_id, code)` dan server action `createSubject()`.

---

### code

Deskripsi:
Kode unik mata pelajaran dalam satu sekolah.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Bagian dari unique constraint `(school_id, code)`.

Digunakan Oleh:
Seed data, server action `createSubject()`, dan identifikasi mapel demo.

---

### name

Deskripsi:
Nama mata pelajaran.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Struktur Akademik, Materi, Nilai, Dashboard, Subject Explorer, dan relasi embedded `subjects(name)`.

---

### emoji

Deskripsi:
Emoji atau ikon tampilan mata pelajaran.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Struktur Akademik, Master Kelas, Materi, Dashboard, dan Subject Explorer.

---

### color

Deskripsi:
Warna tampilan mata pelajaran untuk UI.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Dashboard siswa, Subject Explorer, seed data, dan server action `createSubject()` yang memilih warna dari palette.

---

### created_at

Deskripsi:
Waktu data mata pelajaran dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan data; tidak terlihat dipakai langsung oleh UI saat ini.

---

### min_grade

Deskripsi:
Tingkat kelas minimum untuk mata pelajaran. Jika kosong, mata pelajaran berlaku mulai semua kelas bawah.

Tipe Data:
`int`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Constraint `subjects_grade_range_check`: nilai harus 1 sampai 6 jika diisi.

Digunakan Oleh:
Filter mapel di Dashboard, Subject Explorer, Master Kelas, dan form Struktur Akademik.

---

### max_grade

Deskripsi:
Tingkat kelas maksimum untuk mata pelajaran. Jika kosong, mata pelajaran berlaku sampai semua kelas atas.

Tipe Data:
`int`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Constraint `subjects_grade_range_check`: nilai harus 1 sampai 6 jika diisi, dan `min_grade <= max_grade` jika keduanya diisi.

Digunakan Oleh:
Filter mapel di Dashboard, Subject Explorer, Master Kelas, dan form Struktur Akademik.

---

## classes

Tujuan:
Menyimpan kelas per sekolah dan tahun ajaran. Kelas menjadi konteks utama siswa, guru, materi, tugas, nilai, dan pengumuman kelas.

### id

Deskripsi:
Identifier unik kelas.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `profiles.class_id`, `class_teacher_subjects.class_id`, `announcements.target_class_id`, `materials.class_id`, `assignments.class_id`, dan `grades.class_id`.

---

### school_id

Deskripsi:
Sekolah pemilik kelas.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`schools.id` (`on delete cascade`)

Digunakan Oleh:
Constraint unik `(school_id, academic_year_id, name)` dan server action `createClass()`.

---

### academic_year_id

Deskripsi:
Tahun ajaran tempat kelas berjalan.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`academic_years.id` (`on delete cascade`)

Digunakan Oleh:
Halaman Struktur Akademik, seed kelas aktif, dan constraint unik `(school_id, academic_year_id, name)`.

---

### name

Deskripsi:
Nama kelas, misalnya `Kelas 4A`.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Bagian dari unique constraint `(school_id, academic_year_id, name)`.

Digunakan Oleh:
Class picker, Master Kelas, Profil, Manajemen Pengguna, Dashboard, dan embedded relation `classes(name)`.

---

### grade_level

Deskripsi:
Tingkat kelas numerik.

Tipe Data:
`int`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Filter mata pelajaran berdasarkan `subjects.min_grade` dan `subjects.max_grade`; halaman Struktur Akademik dan Master Kelas.

---

### homeroom_teacher_id

Deskripsi:
Profile guru yang menjadi wali kelas.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`), constraint `classes_homeroom_teacher_fk`

Digunakan Oleh:
Seed data menetapkan wali kelas `Kelas 4A`; belum terlihat dipakai langsung oleh UI saat ini.

---

### created_at

Deskripsi:
Waktu data kelas dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan data; tidak terlihat dipakai langsung oleh UI saat ini.

---

## profiles

Tujuan:
Menyimpan profil domain LMS untuk setiap user Supabase Auth, termasuk role, identitas, sekolah, dan kelas siswa.

### id

Deskripsi:
Identifier profile sekaligus identifier user Auth.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Ya

Foreign Key:
Ya

Referensi:
`auth.users.id` (`on delete cascade`)

Digunakan Oleh:
Auth context, seluruh relasi user, RLS helper, server actions pengguna, dan trigger `handle_new_user()`.

---

### school_id

Deskripsi:
Sekolah tempat user terdaftar.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`schools.id` (`on delete set null`)

Digunakan Oleh:
Metadata Auth saat membuat user, seed data, dan relasi multi-sekolah.

---

### role

Deskripsi:
Role user dalam aplikasi.

Tipe Data:
`public.user_role`

Nullable:
Tidak

Default Value:
`'student'`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.user_role`: `student`, `teacher`, `principal`, `admin`.

Digunakan Oleh:
RLS helper `current_role()`, `is_admin()`, `is_principal()`, `is_teacher()`, `is_student()`, Auth context, dashboard, dan akses menu.

---

### full_name

Deskripsi:
Nama lengkap user.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Profil, daftar siswa/guru/kepala sekolah, leaderboard, submission review, reset password, dan server actions pengguna.

---

### username

Deskripsi:
Username aplikasi yang dipakai untuk lookup email saat login.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Unique constraint pada kolom `username`.

Digunakan Oleh:
RPC `email_for_username()`, login, seed data, dan server actions create/update user.

---

### avatar_emoji

Deskripsi:
Emoji avatar user.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Profil, daftar siswa, ruang penilaian, seed data, dan Auth context.

---

### nisn

Deskripsi:
Nomor induk siswa nasional atau identifier siswa.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Unique constraint pada kolom `nisn`.

Digunakan Oleh:
Manajemen siswa, login username/password awal siswa, reset password default, profil siswa, dan daftar siswa.

---

### nip

Deskripsi:
Nomor induk pegawai untuk guru atau kepala sekolah.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Unique constraint pada kolom `nip`.

Digunakan Oleh:
Manajemen guru/kepala sekolah, login username/password awal staf, reset password default, dan profil staf.

---

### class_id

Deskripsi:
Kelas siswa. Pada seed dan server action saat ini, `class_id` diisi untuk siswa dan tidak diisi untuk akun staf.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`classes.id` (`on delete set null`)

Digunakan Oleh:
Profil user, Master Kelas, daftar siswa, dashboard, RLS `current_class_id()`, dan embedded relation `classes!profiles_class_id_fkey(name)`.

---

### created_at

Deskripsi:
Waktu profile dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan profile; tidak terlihat dipakai langsung oleh UI saat ini.

---

### updated_at

Deskripsi:
Waktu profile terakhir diperbarui.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Trigger `profiles_set_updated_at` menjalankan `set_updated_at()`.

Digunakan Oleh:
Audit perubahan profile melalui trigger update.

---

## class_teacher_subjects

Tujuan:
Menyimpan penugasan guru untuk satu mata pelajaran pada satu kelas, sekaligus menjadi dasar otorisasi guru lewat helper RLS `teaches_class()`.

### id

Deskripsi:
Identifier unik penugasan guru-mapel-kelas.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Manajemen Master Kelas dan relasi pengajaran guru.

---

### class_id

Deskripsi:
Kelas yang diajar.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`classes.id` (`on delete cascade`); bagian dari unique constraint `(class_id, subject_id)`.

Digunakan Oleh:
RLS `teaches_class()`, Master Kelas, dashboard/akses guru, dan server action `setClassSubjectTeacher()`.

---

### subject_id

Deskripsi:
Mata pelajaran yang diajar pada kelas tersebut.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`subjects.id` (`on delete cascade`); bagian dari unique constraint `(class_id, subject_id)`.

Digunakan Oleh:
Master Kelas, statistik guru, dan server action `setClassSubjectTeacher()`.

---

### teacher_id

Deskripsi:
Guru yang ditugaskan mengajar.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete cascade`)

Digunakan Oleh:
RLS `teaches_class()`, daftar guru, statistik guru, dan validasi hapus guru.

---

### created_at

Deskripsi:
Waktu penugasan dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan penugasan; tidak terlihat dipakai langsung oleh UI saat ini.

---

## announcements

Tujuan:
Menyimpan pengumuman sekolah, termasuk pembuat pengumuman dan target role atau kelas jika pengumuman diarahkan.

### id

Deskripsi:
Identifier unik pengumuman.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Daftar pengumuman, dashboard, dan validasi hapus kelas jika menjadi target pengumuman.

---

### school_id

Deskripsi:
Sekolah pemilik pengumuman.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`schools.id` (`on delete cascade`)

Digunakan Oleh:
Server action `publishAnnouncement()` dan seed pengumuman.

---

### author_id

Deskripsi:
Profile pembuat pengumuman.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Server action `publishAnnouncement()` dan RLS update/delete pengumuman berdasarkan author.

---

### title

Deskripsi:
Judul pengumuman.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Pengumuman, dashboard, dan form publish pengumuman.

---

### body

Deskripsi:
Isi pengumuman.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Pengumuman, dashboard, dan form publish pengumuman.

---

### target_role

Deskripsi:
Role target pengumuman. Jika kosong, pengumuman tidak dibatasi role.

Tipe Data:
`public.user_role`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.user_role`: `student`, `teacher`, `principal`, `admin`.

Digunakan Oleh:
Policy RLS `announcements_select`; server action saat ini tidak mengisi kolom ini.

---

### target_class_id

Deskripsi:
Kelas target pengumuman. Jika kosong, pengumuman tidak dibatasi kelas.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`classes.id` (`on delete cascade`)

Digunakan Oleh:
Policy RLS `announcements_select`, `announcements_write`, dan validasi `deleteClass()`.

---

### created_at

Deskripsi:
Waktu pengumuman dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Urutan pengumuman di halaman Pengumuman dan Dashboard.

---

## materials

Tujuan:
Menyimpan materi pembelajaran untuk kelas dan mata pelajaran tertentu.

### id

Deskripsi:
Identifier unik materi.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Materi, Dashboard, Subject Explorer, dan validasi hapus kelas/mapel.

---

### class_id

Deskripsi:
Kelas tujuan materi.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`classes.id` (`on delete cascade`)

Digunakan Oleh:
RLS materi, halaman Materi, Dashboard, Subject Explorer, dan validasi `deleteClass()`.

---

### subject_id

Deskripsi:
Mata pelajaran materi.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`subjects.id` (`on delete cascade`)

Digunakan Oleh:
Halaman Materi, Subject Explorer, dashboard aktivitas, dan validasi `deleteSubject()`.

---

### teacher_id

Deskripsi:
Guru pembuat atau pengampu materi.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Statistik guru dan seed materi.

---

### title

Deskripsi:
Judul materi.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Materi dan Subject Explorer.

---

### kind

Deskripsi:
Jenis materi.

Tipe Data:
`public.material_kind`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.material_kind`: `pdf`, `video`, `text`, `image`.

Digunakan Oleh:
Halaman Materi untuk label dan ikon jenis materi; Subject Explorer.

---

### url

Deskripsi:
URL atau lokasi konten materi.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed materi demo; UI menyiapkan tombol buka materi.

---

### created_at

Deskripsi:
Waktu materi dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Urutan materi terbaru dan perhitungan materi baru minggu ini di dashboard.

---

## assignments

Tujuan:
Menyimpan tugas atau asesmen untuk kelas dan mata pelajaran tertentu.

### id

Deskripsi:
Identifier unik tugas.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `submissions.assignment_id`, halaman Assessment, Subject Explorer, Dashboard, dan validasi hapus kelas/mapel.

---

### class_id

Deskripsi:
Kelas tujuan tugas.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`classes.id` (`on delete cascade`)

Digunakan Oleh:
RLS assignment, Dashboard, Assessment, Subject Explorer, dan validasi `deleteClass()`.

---

### subject_id

Deskripsi:
Mata pelajaran tugas.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`subjects.id` (`on delete cascade`)

Digunakan Oleh:
Dashboard, Assessment, Subject Explorer, embedded relation `subjects(name)`, dan validasi `deleteSubject()`.

---

### teacher_id

Deskripsi:
Guru pembuat atau pengampu tugas.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Statistik guru dan seed tugas.

---

### title

Deskripsi:
Judul tugas.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Dashboard siswa, Assessment, Subject Explorer, dan seed submission.

---

### kind

Deskripsi:
Jenis tugas.

Tipe Data:
`public.assignment_kind`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.assignment_kind`: `quiz`, `essay`, `photo`, `audio`, `text`.

Digunakan Oleh:
Halaman Assessment untuk label jenis tugas dan Subject Explorer.

---

### description

Deskripsi:
Deskripsi atau instruksi tugas.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Disiapkan oleh schema untuk detail tugas; tidak terlihat dipakai langsung oleh UI saat ini.

---

### due_at

Deskripsi:
Tenggat waktu tugas.

Tipe Data:
`timestamptz`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Dashboard siswa dan Subject Explorer untuk menampilkan tenggat.

---

### created_at

Deskripsi:
Waktu tugas dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan tugas; tidak terlihat dipakai langsung oleh UI saat ini.

---

## submissions

Tujuan:
Menyimpan pengumpulan tugas siswa, status pengerjaan, nilai tugas, komentar guru, dan waktu penilaian.

### id

Deskripsi:
Identifier unik submission.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Ruang Penilaian, validasi hapus siswa, dan seed submission.

---

### assignment_id

Deskripsi:
Tugas induk yang dikumpulkan.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`assignments.id` (`on delete cascade`); bagian dari unique constraint `(assignment_id, student_id)`.

Digunakan Oleh:
Ruang Penilaian, RLS submission, dan relasi tugas-submission.

---

### student_id

Deskripsi:
Siswa pemilik submission.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete cascade`); bagian dari unique constraint `(assignment_id, student_id)`.

Digunakan Oleh:
Ruang Penilaian, RLS submission, validasi hapus siswa, dan embedded relation `profiles!submissions_student_id_fkey`.

---

### content_url

Deskripsi:
URL atau lokasi file jawaban siswa.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Disiapkan oleh schema untuk file/jawaban submission; tidak terlihat dipakai langsung oleh UI saat ini.

---

### status

Deskripsi:
Status pengerjaan atau penilaian submission.

Tipe Data:
`public.submission_status`

Nullable:
Tidak

Default Value:
`'belum'`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.submission_status`: `belum`, `dikerjakan`, `submitted`, `graded`.

Digunakan Oleh:
Ruang Penilaian, dashboard guru, dan seed submission.

---

### score

Deskripsi:
Nilai submission.

Tipe Data:
`numeric(5,2)`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed submission dan data penilaian tugas.

---

### teacher_comment

Deskripsi:
Komentar guru pada submission.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed submission dan data penilaian tugas.

---

### submitted_at

Deskripsi:
Waktu siswa mengumpulkan tugas.

Tipe Data:
`timestamptz`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Dashboard guru dan ruang penilaian untuk status submission.

---

### graded_at

Deskripsi:
Waktu submission dinilai.

Tipe Data:
`timestamptz`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed submission dan audit penilaian tugas.

---

### graded_by

Deskripsi:
Profile guru/admin yang menilai submission.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Seed submission dan audit penilaian tugas.

---

### updated_at

Deskripsi:
Waktu submission terakhir diperbarui.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Trigger `submissions_set_updated_at` menjalankan `set_updated_at()`.

Digunakan Oleh:
Audit perubahan submission melalui trigger update.

---

## grades

Tujuan:
Menyimpan nilai rapor atau nilai periode per siswa, mata pelajaran, kelas, tahun ajaran, dan bulan periode.

### id

Deskripsi:
Identifier unik nilai.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Nilai, Dashboard, daftar siswa dengan rata-rata, dan validasi hapus siswa/kelas/mapel.

---

### student_id

Deskripsi:
Siswa pemilik nilai.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete cascade`)

Digunakan Oleh:
Halaman Nilai siswa, dashboard siswa, daftar siswa, dan validasi `deleteStudent()`.

---

### subject_id

Deskripsi:
Mata pelajaran dari nilai.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`subjects.id` (`on delete cascade`)

Digunakan Oleh:
Halaman Nilai, dashboard, embedded relation `subjects(name)`, dan validasi `deleteSubject()`.

---

### class_id

Deskripsi:
Kelas saat nilai dicatat.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`classes.id` (`on delete cascade`)

Digunakan Oleh:
Halaman Nilai per kelas, RLS grades, dan validasi `deleteClass()`.

---

### academic_year_id

Deskripsi:
Tahun ajaran nilai.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`academic_years.id` (`on delete cascade`)

Digunakan Oleh:
Seed nilai dan relasi nilai dengan tahun ajaran.

---

### period_month

Deskripsi:
Bulan periode nilai.

Tipe Data:
`date`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Nilai dan Dashboard untuk tren nilai per bulan.

---

### score

Deskripsi:
Skor nilai.

Tipe Data:
`numeric(5,2)`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Dashboard, grafik nilai, rata-rata siswa, dan laporan nilai.

---

### teacher_comment

Deskripsi:
Komentar guru untuk nilai.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Nilai siswa untuk komentar guru.

---

### created_by

Deskripsi:
Profile pembuat nilai.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Seed nilai dan audit pembuat nilai.

---

### created_at

Deskripsi:
Waktu nilai dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan nilai; tidak terlihat dipakai langsung oleh UI saat ini.

---

## badges

Tujuan:
Menyimpan katalog lencana gamifikasi yang dapat diberikan kepada siswa.

### id

Deskripsi:
Identifier unik badge.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `student_badges.badge_id`, katalog lencana di halaman Reward/Gamifikasi, dan dashboard siswa.

---

### code

Deskripsi:
Kode unik badge.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Unique constraint pada kolom `code`.

Digunakan Oleh:
Seed badge dan pengurutan katalog badge di `getStudentGamification()`.

---

### name

Deskripsi:
Nama badge.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Reward/Gamifikasi dan seed badge.

---

### emoji

Deskripsi:
Emoji badge untuk tampilan UI.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Reward/Gamifikasi dan seed badge.

---

### description

Deskripsi:
Deskripsi badge.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed badge; tidak terlihat dipakai langsung oleh UI saat ini.

---

### created_at

Deskripsi:
Waktu badge dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan badge; tidak terlihat dipakai langsung oleh UI saat ini.

---

## student_badges

Tujuan:
Menyimpan badge yang sudah diperoleh siswa, termasuk waktu perolehan dan pemberi badge.

### id

Deskripsi:
Identifier unik perolehan badge siswa.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Validasi hapus siswa dan relasi siswa-badge.

---

### student_id

Deskripsi:
Siswa pemilik badge.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete cascade`); bagian dari unique constraint `(student_id, badge_id)`.

Digunakan Oleh:
Dashboard siswa, halaman Reward/Gamifikasi, RLS `student_badges`, dan validasi `deleteStudent()`.

---

### badge_id

Deskripsi:
Badge yang diperoleh siswa.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`badges.id` (`on delete cascade`); bagian dari unique constraint `(student_id, badge_id)`.

Digunakan Oleh:
Halaman Reward/Gamifikasi untuk menandai badge yang sudah diperoleh.

---

### earned_at

Deskripsi:
Waktu badge diperoleh.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu perolehan badge; tidak terlihat dipakai langsung oleh UI saat ini.

---

### awarded_by

Deskripsi:
Profile yang memberikan badge.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Seed student badge dan audit pemberian badge.

---

## stars_ledger

Tujuan:
Menyimpan riwayat perubahan bintang siswa sebagai ledger append-only. Total bintang dihitung dari penjumlahan `delta`.

### id

Deskripsi:
Identifier unik transaksi bintang.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Validasi hapus siswa dan audit ledger bintang.

---

### student_id

Deskripsi:
Siswa pemilik transaksi bintang.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete cascade`)

Digunakan Oleh:
View `student_star_totals`, view `class_leaderboard`, RLS `stars_ledger`, Dashboard, Reward, Gamifikasi, dan validasi `deleteStudent()`.

---

### delta

Deskripsi:
Perubahan jumlah bintang. Nilai positif menambah bintang, nilai negatif mengurangi bintang.

Tipe Data:
`int`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
View `student_star_totals`, view `class_leaderboard`, seed saldo awal, dan `approveRedemption()` untuk pengurangan bintang.

---

### reason

Deskripsi:
Alasan perubahan bintang.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Seed saldo awal dan `approveRedemption()` saat penukaran hadiah disetujui.

---

### created_by

Deskripsi:
Profile pembuat transaksi bintang.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Seed ledger, `approveRedemption()`, dan audit pembuat transaksi bintang.

---

### created_at

Deskripsi:
Waktu transaksi bintang dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu transaksi bintang; tidak terlihat dipakai langsung oleh UI saat ini.

---

## rewards

Tujuan:
Menyimpan katalog hadiah yang dapat ditukar siswa dengan bintang.

### id

Deskripsi:
Identifier unik reward.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
FK dari `reward_redemptions.reward_id`, halaman Reward, dan server action `redeemReward()`.

---

### school_id

Deskripsi:
Sekolah pemilik reward.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`schools.id` (`on delete cascade`)

Digunakan Oleh:
Seed reward dan relasi katalog reward per sekolah.

---

### name

Deskripsi:
Nama reward.

Tipe Data:
`text`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Reward, halaman Gamifikasi untuk request penukaran, dan embedded relation `rewards(name)`.

---

### emoji

Deskripsi:
Emoji reward untuk tampilan UI.

Tipe Data:
`text`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Reward dan seed reward.

---

### cost

Deskripsi:
Biaya reward dalam satuan bintang.

Tipe Data:
`int`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Reward, `redeemReward()`, seed reward, dan disalin ke `reward_redemptions.cost`.

---

### is_active

Deskripsi:
Status aktif reward.

Tipe Data:
`boolean`

Nullable:
Tidak

Default Value:
`true`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
`getStudentGamification()` hanya menampilkan reward dengan `is_active = true`.

---

### created_at

Deskripsi:
Waktu reward dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu pembuatan reward; tidak terlihat dipakai langsung oleh UI saat ini.

---

## reward_redemptions

Tujuan:
Menyimpan permintaan penukaran reward oleh siswa, status keputusan, dan actor yang menyetujui atau menolak.

### id

Deskripsi:
Identifier unik request penukaran reward.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
`gen_random_uuid()`

Primary Key:
Ya

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Halaman Gamifikasi, server actions `approveRedemption()` dan `rejectRedemption()`, serta validasi hapus siswa.

---

### student_id

Deskripsi:
Siswa yang meminta penukaran reward.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete cascade`)

Digunakan Oleh:
RLS `reward_redemptions`, halaman Gamifikasi, `redeemReward()`, `approveRedemption()`, dan validasi `deleteStudent()`.

---

### reward_id

Deskripsi:
Reward yang diminta siswa.

Tipe Data:
`uuid`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`rewards.id` (`on delete cascade`)

Digunakan Oleh:
Halaman Gamifikasi, `redeemReward()`, seed redemption, dan embedded relation `rewards(name)`.

---

### cost

Deskripsi:
Biaya reward pada saat request dibuat.

Tipe Data:
`int`

Nullable:
Tidak

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Disalin dari `rewards.cost` oleh server action `redeemReward()`; tidak ada FK karena ini nilai snapshot.

Digunakan Oleh:
Halaman Gamifikasi dan `approveRedemption()` untuk membuat `stars_ledger.delta` negatif.

---

### status

Deskripsi:
Status request penukaran reward.

Tipe Data:
`public.redemption_status`

Nullable:
Tidak

Default Value:
`'pending'`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Enum `public.redemption_status`: `pending`, `approved`, `rejected`.

Digunakan Oleh:
Halaman Gamifikasi untuk menampilkan request pending, `approveRedemption()`, `rejectRedemption()`, dan RLS.

---

### requested_at

Deskripsi:
Waktu request penukaran dibuat.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Audit waktu request penukaran; tidak terlihat dipakai langsung oleh UI saat ini.

---

### decided_at

Deskripsi:
Waktu request disetujui atau ditolak.

Tipe Data:
`timestamptz`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Tidak ada.

Digunakan Oleh:
Server actions `approveRedemption()` dan `rejectRedemption()`.

---

### decided_by

Deskripsi:
Profile yang menyetujui atau menolak request penukaran.

Tipe Data:
`uuid`

Nullable:
Ya

Default Value:
Tidak ada.

Primary Key:
Tidak

Foreign Key:
Ya

Referensi:
`profiles.id` (`on delete set null`)

Digunakan Oleh:
Server actions `approveRedemption()` dan `rejectRedemption()` serta audit keputusan redemption.

---

### updated_at

Deskripsi:
Waktu request penukaran terakhir diperbarui.

Tipe Data:
`timestamptz`

Nullable:
Tidak

Default Value:
`now()`

Primary Key:
Tidak

Foreign Key:
Tidak

Referensi:
Trigger `reward_redemptions_set_updated_at` menjalankan `set_updated_at()`.

Digunakan Oleh:
Audit perubahan redemption melalui trigger update.

---
