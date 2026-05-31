import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { STUDENTS } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/students")({ component: StudentsPage });

function StudentsPage() {
  const { user } = useAuth();
  const { active } = useActiveClass();
  const readOnly = user?.role === "principal";

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="👨‍🎓" title="Siswa" subtitle="Daftar siswa per kelas" />
        <EmptyClassState message={readOnly
          ? "Data kelas tidak dapat dimuat. Silakan pilih kelas terlebih dahulu pada menu bagian atas halaman untuk memantau aktivitas siswa."
          : "Data siswa tidak dapat ditampilkan. Silakan pilih kelas terlebih dahulu pada menu di bagian atas halaman."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="👨‍🎓"
        title={`Siswa ${active}`}
        subtitle={`${STUDENTS.length} siswa terdaftar`}
        action={!readOnly && <Button className="rounded-xl">+ Tambah Siswa</Button>}
      />
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama atau NISN..." className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">NISN</th>
                <th className="px-4 py-3">Status Login</th>
                <th className="px-4 py-3">Rata-rata</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {STUDENTS.map((s) => (
                <tr key={s.nisn} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft/50 text-lg">🦊</div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.nisn}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.login === "Aktif" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {s.login}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{s.avg}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" className="rounded-lg">Lihat</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
