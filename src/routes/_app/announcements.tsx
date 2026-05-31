import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ANNOUNCEMENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/announcements")({ component: AnnouncementsPage });

function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="📣" title="Pengumuman" subtitle="Buat dan kelola pengumuman sekolah" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-1">
          <h2 className="font-display text-xl font-bold">Buat Pengumuman</h2>
          <div className="mt-4 space-y-3">
            <Input placeholder="Judul pengumuman" />
            <Textarea placeholder="Isi pengumuman..." rows={6} />
            <Button className="w-full rounded-xl">Terbitkan</Button>
          </div>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {ANNOUNCEMENTS.map((a) => (
            <Card key={a.id} className="rounded-3xl border-0 p-6 shadow-soft">
              <div className="text-xs font-medium text-primary">{a.date}</div>
              <h3 className="mt-1 font-display text-xl font-bold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
