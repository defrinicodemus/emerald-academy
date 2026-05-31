export const SCHOOL = {
  name: "SD Inpres Nggodimeda",
  tagline: "Belajar dengan ceria, tumbuh bersama",
};

export const SUBJECTS = [
  { id: "mtk", name: "Matematika", emoji: "🔢", color: "oklch(0.78 0.14 50)" },
  { id: "ipa", name: "IPA", emoji: "🔬", color: "oklch(0.7 0.14 195)" },
  { id: "bi", name: "Bahasa Indonesia", emoji: "📖", color: "oklch(0.7 0.16 25)" },
  { id: "ppkn", name: "PPKn", emoji: "🇮🇩", color: "oklch(0.65 0.18 145)" },
  { id: "agama", name: "Agama", emoji: "🕊️", color: "oklch(0.72 0.12 280)" },
  { id: "sbdp", name: "SBdP", emoji: "🎨", color: "oklch(0.72 0.16 330)" },
];

export const CLASSES = ["Kelas 1A", "Kelas 2A", "Kelas 3A", "Kelas 4A", "Kelas 5A", "Kelas 6A"];

export const ANNOUNCEMENTS = [
  { id: 1, title: "Upacara Bendera Senin Pagi", body: "Seluruh siswa wajib hadir pukul 07.00 WITA dengan seragam lengkap.", date: "Senin, 02 Juni" },
  { id: 2, title: "Lomba Cerdas Cermat", body: "Pendaftaran dibuka untuk kelas 4–6. Daftar ke wali kelas masing-masing.", date: "10 Juni" },
];

export const ASSIGNMENTS = [
  { id: "a1", subject: "Matematika", title: "Latihan Pecahan Bab 3", due: "Besok", status: "belum" },
  { id: "a2", subject: "IPA", title: "Pengamatan Tumbuhan", due: "3 hari lagi", status: "dikerjakan" },
  { id: "a3", subject: "Bahasa Indonesia", title: "Menulis Cerita Liburan", due: "Minggu depan", status: "belum" },
];

export const BADGES = [
  { id: "b1", name: "Tepat Waktu", emoji: "⏰", earned: true },
  { id: "b2", name: "Rajin Belajar", emoji: "📚", earned: true },
  { id: "b3", name: "Juara Kuis", emoji: "🏆", earned: true },
  { id: "b4", name: "Aktif Bertanya", emoji: "🙋", earned: false },
  { id: "b5", name: "Pembaca Hebat", emoji: "🌟", earned: false },
  { id: "b6", name: "Sahabat Kelas", emoji: "🤝", earned: true },
];

export const REWARDS = [
  { id: "r1", name: "Tema Dashboard Pelangi", cost: 50, emoji: "🌈" },
  { id: "r2", name: "Avatar Kucing Lucu", cost: 30, emoji: "🐱" },
  { id: "r3", name: "Bingkai Profil Emas", cost: 80, emoji: "🥇" },
  { id: "r4", name: "Sticker Pack Hewan", cost: 25, emoji: "🐼" },
];

export const GRADE_TREND = [
  { name: "Jan", nilai: 78 },
  { name: "Feb", nilai: 82 },
  { name: "Mar", nilai: 85 },
  { name: "Apr", nilai: 80 },
  { name: "Mei", nilai: 88 },
  { name: "Jun", nilai: 91 },
];

export const STUDENTS = [
  { nisn: "0098765432", name: "Budi Santoso", login: "Aktif", avg: 88 },
  { nisn: "0098765433", name: "Ani Putri", login: "Aktif", avg: 92 },
  { nisn: "0098765434", name: "Citra Dewi", login: "Belum", avg: 75 },
  { nisn: "0098765435", name: "Dimas Pratama", login: "Aktif", avg: 81 },
  { nisn: "0098765436", name: "Eka Wijaya", login: "Aktif", avg: 79 },
];

export const TEACHERS = [
  { nip: "198501012010012001", name: "Sari Wulandari", subject: "Matematika", materials: 24, quizzes: 8 },
  { nip: "198902142011012003", name: "Rahmat Hidayat", subject: "IPA", materials: 19, quizzes: 6 },
  { nip: "199203212012011002", name: "Linda Marbun", subject: "Bahasa Indonesia", materials: 31, quizzes: 11 },
];
