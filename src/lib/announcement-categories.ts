export const ANNOUNCEMENT_CATEGORIES = [
  "Umum",
  "Akademik",
  "Kegiatan",
  "Libur",
  "Prestasi",
] as const;

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  Umum: "bg-slate-100 text-slate-700",
  Akademik: "bg-blue-100 text-blue-700",
  Kegiatan: "bg-purple-100 text-purple-700",
  Libur: "bg-amber-100 text-amber-700",
  Prestasi: "bg-emerald-100 text-emerald-700",
};

export function getCategoryBadgeClass(category: string): string {
  return CATEGORY_BADGE_CLASSES[category] ?? "bg-primary-soft/50 text-primary";
}
