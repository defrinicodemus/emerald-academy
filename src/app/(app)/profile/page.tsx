import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/data/profile";
import { logout } from "../actions";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader icon="👤" title="Profil Saya" subtitle="Informasi akun dan pengaturan" />
      <Card className="rounded-3xl border-0 p-8 shadow-soft">
        <div className="flex flex-wrap items-center gap-6">
          <div className="grid h-24 w-24 place-items-center rounded-3xl gradient-primary text-5xl text-primary-foreground shadow-glow">
            {user.avatar ?? "🙂"}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{user.name}</h2>
            <div className="mt-1 text-sm capitalize text-muted-foreground">{user.role}</div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {user.nisn && <Info label="NISN" value={user.nisn} />}
              {user.nip && <Info label="NIP" value={user.nip} />}
              {user.className && <Info label="Kelas" value={user.className} />}
            </div>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit" className="rounded-xl">
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </form>
        </div>
      </Card>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h3 className="font-display text-lg font-bold">Pengaturan Akun</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="h-12 justify-start rounded-xl">
            Ganti Kata Sandi
          </Button>
          <Button variant="outline" className="h-12 justify-start rounded-xl">
            Notifikasi
          </Button>
          <Button variant="outline" className="h-12 justify-start rounded-xl">
            Bahasa
          </Button>
          <Button variant="outline" className="h-12 justify-start rounded-xl">
            Bantuan
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
