import { Card } from "@/components/ui/card";
import { useActiveClass, ClassPicker } from "@/components/ClassPicker";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardList, FileText, Users, AlertCircle } from "lucide-react";

const submissions = [
  { name: "Sen", value: 12 },
  { name: "Sel", value: 18 },
  { name: "Rab", value: 9 },
  { name: "Kam", value: 22 },
  { name: "Jum", value: 16 },
];

export function TeacherDashboard() {
  const { active } = useActiveClass();

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Selamat mengajar, Ibu Sari 👩‍🏫</h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">
          Pilih kelas aktif untuk mulai membuat materi, kuis, dan menilai pekerjaan siswa.
        </p>
        <div className="mt-5">
          <ClassPicker />
        </div>
      </Card>

      {!active ? (
        <Card className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary-soft/20 p-10 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-3 font-display text-xl font-bold">Belum memilih kelas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Beberapa data terkunci sampai Anda memilih kelas aktif. Gunakan pemilih kelas di atas atau di header.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat icon={Users} label="Total Siswa" value="28" hint={active} />
            <Stat icon={FileText} label="Materi Aktif" value="24" hint="+3 minggu ini" />
            <Stat icon={ClipboardList} label="Belum Dinilai" value="7" hint="Esai & lisan" />
            <Stat icon={ClipboardList} label="Submisi Hari Ini" value="22" hint="Lihat detail" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
              <h2 className="font-display text-xl font-bold">Submisi Tugas Minggu Ini</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={submissions}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: 12 }} cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="rounded-3xl border-0 p-6 shadow-soft">
              <h2 className="font-display text-xl font-bold">Aksi Cepat</h2>
              <div className="mt-4 grid gap-2">
                <Button className="h-12 justify-start rounded-xl text-base">+ Tambah Materi</Button>
                <Button variant="secondary" className="h-12 justify-start rounded-xl text-base">+ Buat Kuis</Button>
                <Button variant="outline" className="h-12 justify-start rounded-xl text-base">Beri Bintang Bonus</Button>
                <Button variant="outline" className="h-12 justify-start rounded-xl text-base">Buat Pengumuman</Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft/50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
