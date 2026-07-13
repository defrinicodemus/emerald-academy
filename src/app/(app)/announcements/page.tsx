import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listAnnouncementsPage } from "@/lib/data/announcements";
import { getCurrentUser } from "@/lib/data/profile";
import { getCategoryBadgeClass } from "@/lib/announcement-categories";
import { PublishAnnouncementForm } from "./PublishAnnouncementForm";

const PAGE_SIZE = 5;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ items, totalCount }, user] = await Promise.all([
    listAnnouncementsPage(page, PAGE_SIZE),
    getCurrentUser(),
  ]);
  const isAdmin = user?.role === "admin";
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📣"
        title="Pengumuman"
        subtitle={isAdmin ? "Buat dan kelola pengumuman sekolah" : "Daftar pengumuman sekolah"}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {isAdmin && (
          <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-1">
            <h2 className="font-display text-xl font-bold">Buat Pengumuman</h2>
            <PublishAnnouncementForm />
          </Card>
        )}
        <div className={isAdmin ? "space-y-3 lg:col-span-2" : "space-y-3 lg:col-span-3"}>
          {items.map((a) => (
            <Card key={a.id} className="rounded-3xl border-0 p-6 shadow-soft">
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryBadgeClass(a.category)}`}
              >
                {a.category}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold">{a.title}</h3>
              <div className="mt-1 text-xs text-muted-foreground">{formatDate(a.created_at)}</div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
              <Link
                href={`/announcements/${a.id}?page=${page}`}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Baca Selengkapnya →
              </Link>
            </Card>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <PageLink page={page - 1} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </PageLink>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/announcements?page=${n}`}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-medium ${
                    n === page
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card hover:border-primary"
                  }`}
                >
                  {n}
                </Link>
              ))}
              <PageLink page={page + 1} disabled={page >= totalPages}>
                Selanjutnya <ChevronRight className="h-4 w-4" />
              </PageLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex cursor-not-allowed items-center gap-1 rounded-xl border px-3 py-2 text-sm text-muted-foreground opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/announcements?page=${page}`}
      className="flex items-center gap-1 rounded-xl border bg-card px-3 py-2 text-sm font-medium hover:border-primary"
    >
      {children}
    </Link>
  );
}
