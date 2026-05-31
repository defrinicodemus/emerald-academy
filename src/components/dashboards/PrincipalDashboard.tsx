import { Card } from "@/components/ui/card";
import { TEACHERS } from "@/lib/mock-data";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye } from "lucide-react";

const activity = [
  { name: "Sen", guru: 78, siswa: 82 },
  { name: "Sel", guru: 80, siswa: 88 },
  { name: "Rab", guru: 75, siswa: 79 },
  { name: "Kam", guru: 85, siswa: 91 },
  { name: "Jum", guru: 82, siswa: 86 },
];

export function PrincipalDashboard() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs"><Eye className="h-3.5 w-3.5" /> Mode Pemantauan</div>
        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Selamat datang, Bapak Kepala Sekolah</h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">Ringkasan aktivitas LMS SD Inpres Nggodimeda hari ini.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Siswa" value="168" hint="6 rombel" />
        <Stat label="Total Guru" value="14" hint="3 honorer" />
        <Stat label="Total Mapel" value="9" hint="Kurikulum aktif" />
        <Stat label="Keaktifan" value="86%" hint="Minggu ini" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Aktivitas LMS</h2>
          <div className="mt-1 text-xs text-muted-foreground">% guru mengunggah vs % siswa belajar</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activity}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Line type="monotone" dataKey="guru" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="siswa" stroke="var(--color-warning)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Kinerja Guru</h2>
          <div className="mt-4 space-y-3">
            {TEACHERS.map((t) => (
              <div key={t.nip} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.name}</div>
                  <span className="text-xs text-muted-foreground">{t.subject}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.materials} materi · {t.quizzes} kuis
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}
