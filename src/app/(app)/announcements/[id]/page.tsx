import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { getAnnouncementById } from "@/lib/data/announcements";
import { getCategoryBadgeClass } from "@/lib/announcement-categories";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AnnouncementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const announcement = await getAnnouncementById(id);
  if (!announcement) notFound();

  const backHref = page ? `/announcements?page=${page}` : "/announcements";

  return (
    <div className="space-y-6">
      <PageHeader icon="📣" title="Detail Pengumuman" />
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Pengumuman
      </Link>
      <Card className="rounded-3xl border-0 p-8 shadow-soft">
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryBadgeClass(announcement.category)}`}
        >
          {announcement.category}
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">{announcement.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {formatDate(announcement.created_at)}
        </div>
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{announcement.body}</p>
      </Card>
    </div>
  );
}
