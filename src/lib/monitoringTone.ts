export type Tone = "good" | "ok" | "low";

export function tone(percent: number): Tone {
  if (percent >= 85) return "good";
  if (percent >= 60) return "ok";
  return "low";
}

export const BADGE_CLASS: Record<Tone, string> = {
  good: "bg-emerald-100 text-emerald-700",
  ok: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

export const BAR_CLASS: Record<Tone, string> = {
  good: "bg-emerald-500",
  ok: "bg-amber-500",
  low: "bg-red-500",
};
