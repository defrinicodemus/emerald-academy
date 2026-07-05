import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { listAnnouncements } from "@/lib/data/announcements";
import { publishAnnouncement } from "../actions";

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <div className="space-y-6">
      <PageHeader icon="📣" title="Pengumuman" subtitle="Buat dan kelola pengumuman sekolah" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-1">
          <h2 className="font-display text-xl font-bold">Buat Pengumuman</h2>
          <form action={publishAnnouncement} className="mt-4 space-y-3">
            <Input name="title" placeholder="Judul pengumuman" required />
            <Textarea name="body" placeholder="Isi pengumuman..." rows={6} required />
            <Button type="submit" className="w-full rounded-xl">
              Terbitkan
            </Button>
          </form>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {announcements.map((a) => (
            <Card key={a.id} className="rounded-3xl border-0 p-6 shadow-soft">
              <div className="text-xs font-medium text-primary">
                {new Date(a.created_at).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <h3 className="mt-1 font-display text-xl font-bold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
            </Card>
          ))}
          {announcements.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
          )}
        </div>
      </div>
    </div>
  );
}
