import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL } from "@/lib/mock-data";
import { Database, KeyRound, School } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="⚙️" title="Pengaturan Sistem" subtitle="Profil sekolah, reset password, dan backup" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="flex items-center gap-2"><School className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-bold">Profil Sekolah</h2></div>
          <div className="mt-4 space-y-3">
            <div><Label>Nama Sekolah</Label><Input className="mt-1" defaultValue={SCHOOL.name} /></div>
            <div><Label>Alamat</Label><Input className="mt-1" defaultValue="Desa Nggodimeda, Kecamatan ..." /></div>
            <div><Label>No. Telepon</Label><Input className="mt-1" defaultValue="0380-000-000" /></div>
            <Button className="rounded-xl">Simpan Perubahan</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-bold">Reset Password</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Cari pengguna dan kirim ulang password baru.</p>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Cari nama atau NISN/NIP..." />
              <Button className="rounded-xl">Cari</Button>
            </div>
          </Card>

          <Card className="rounded-3xl border-0 p-6 shadow-soft">
            <div className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-bold">Backup Database</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Cadangkan seluruh data sistem dalam satu klik.</p>
            <Button className="mt-4 rounded-xl">Unduh Backup (.zip)</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
