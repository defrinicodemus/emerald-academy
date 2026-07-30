export function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return "-";
  const due = new Date(dueAt);
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  const time = due.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Hari ini, ${time}`;
  if (diffDays === 1) return `Besok, ${time}`;
  const sameYear = due.getFullYear() === now.getFullYear();
  return due.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  });
}
