# Pengingat: Perbaikan Keamanan Lanjutan (belum dikerjakan)

Status: RBAC (Tahap 1-3 & 5 — admin, guru, murid, kepala sekolah, termasuk 20+ fungsi tambahan di `classroom`/`attendance`/`curriculum`/`gradebook`) **sudah selesai**. Idle timeout 30 menit **ditunda** (menunggu diskusi terpisah). 4 item di bawah ini **baru rencana**, belum diimplementasikan — lanjutkan kapan-kapan.

---

## 1. Validasi upload file (tipe & ukuran)

**Masalah:** Server menerima file apa pun yang dikirim browser tanpa mengecek tipe (MIME) atau ukurannya — cuma percaya `file.type` dari klien, yang bisa dipalsukan. Siapa pun yang lolos pengecekan role bisa upload file besar/sembarangan ke storage bucket publik.

**Titik yang perlu diperbaiki:**
- ~~`uploadSchoolLogo` — `src/app/(app)/actions.ts`~~ **sudah selesai** (dikerjakan bareng redesain frame logo + crop UI: `src/lib/validateUpload.ts` + dipanggil di `uploadSchoolLogo`).
- `createMaterial` (cabang upload file, saat `kind` = pdf/image) — `src/app/(app)/classroom/actions.ts`
- `uploadAssignmentImage` — `src/app/(app)/classroom/actions.ts`

**Rencana:**
- Buat `src/lib/validateUpload.ts`:
  ```ts
  export function validateFileUpload(
    file: File,
    opts: { allowedTypes: string[]; maxSizeMB: number },
  ): { ok: true } | { ok: false; message: string }
  ```
- Terapkan dengan batas per konteks: logo sekolah (image only, ~2MB), materi berkas (pdf/image tergantung `kind`, ~10MB), lampiran gambar tugas (image only, ~5MB).

---

## 2. Pesan error tidak boleh bocor ke client

**Masalah:** Banyak Server Action mengembalikan `error.message` mentah dari Postgres langsung ke pengguna (misal nama constraint/kolom asli seperti `assignments_teacher_id_fkey`). Severity rendah (cuma dilihat user yang sudah login), tapi bukan best practice.

**Rencana:**
- Buat `friendlyDbError(error): string` — perluasan dari pola `friendlyAuthError` yang sudah ada di `src/app/(app)/users/actions.ts`. Map kode Postgres umum (23505 unique violation, 23503 FK violation, 23502 not null) ke pesan Indonesia yang ramah; selain itu fallback ke "Terjadi kesalahan, silakan coba lagi." + tetap `console.error(error)` di server untuk debugging.
- Ganti semua `return { ok: false, message: error.message }` mentah di 8 file `actions.ts` yang sudah diaudit (`actions.ts`, `users/actions.ts`, `classroom/actions.ts`, `attendance/actions.ts`, `curriculum/actions.ts`, `gradebook/actions.ts`, `subjects/actions.ts`, `assessments/actions.ts`) — jumlahnya puluhan titik, kerjakan per file.

---

## 3. Rate limiting login

**Masalah:** Tidak ada pembatasan percobaan login gagal di level aplikasi (tidak ada hitungan percobaan, cooldown, atau CAPTCHA). Satu-satunya proteksi adalah rate-limit bawaan Supabase Auth.

**Rencana (paling berat secara arsitektur dari 4 item ini — perlu migration DB baru):**
- Tabel baru `login_attempts` (`username`, `attempted_at`, `success`) via migration Supabase baru.
- Di `src/app/login/actions.ts` (fungsi `login`): sebelum memproses percobaan login, hitung jumlah percobaan gagal untuk username tsb dalam window waktu tertentu (misal 5x dalam 15 menit). Kalau melebihi, tolak dengan pesan cooldown tanpa memproses ke Supabase Auth.
- Next.js Server Actions tidak punya in-memory state persisten antar-request (terutama di deployment serverless), jadi penyimpanan HARUS di database, bukan variabel biasa.

---

## 4. Security headers

**Masalah:** `next.config.ts` belum punya konfigurasi header keamanan sama sekali (CSP, X-Frame-Options, HSTS, dll.) — mengandalkan default platform hosting saja.

**Rencana:**
- Tambah fungsi `headers()` di `next.config.ts`:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Strict-Transport-Security`
- **Hati-hati:** CSP harus tetap mengizinkan:
  - Embed YouTube (`extractYoutubeId`) dan Google Slides (`extractGoogleSlidesId`) di halaman materi → perlu `frame-src` yang mengizinkan `https://www.youtube.com` dan `https://docs.google.com`.
  - Domain storage Supabase untuk gambar/logo/lampiran → perlu `img-src`/`connect-src` yang sesuai.
  - Jangan sampai konfigurasi ini mematahkan fitur embed yang sudah berjalan — test manual setelah diterapkan.

---

## Verifikasi setelah masing-masing dikerjakan
- `npx tsc --noEmit` dan `npx eslint` bersih.
- Coba upload file salah tipe/kelebihan ukuran di 3 titik upload → harus ditolak dengan pesan jelas, bukan diteruskan ke storage.
- Trigger error database sengaja (misal input duplikat) → pesan yang tampil ke user harus ramah, bukan teks Postgres mentah.
- Coba login gagal berkali-kali dengan 1 username → setelah batas tercapai, percobaan berikutnya harus ditolak dengan pesan cooldown, walau password yang dimasukkan benar.
- Setelah header keamanan aktif: buka halaman materi yang berisi embed YouTube dan Google Slides → pastikan masih tampil normal, tidak diblokir CSP (cek console browser untuk error CSP).
