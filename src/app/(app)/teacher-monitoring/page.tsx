import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { listTeachersWithStats } from "@/lib/data/people";

export default async function TeacherMonitoringPage() {
  const teachers = await listTeachersWithStats();

  return (
    <div className="space-y-6">
      <PageHeader icon="👩‍🏫" title="Kinerja Guru" subtitle="Pantau aktivitas mengajar para guru" />
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nama Guru</th>
                <th className="px-4 py-3">Mata Pelajaran</th>
                <th className="px-4 py-3">Materi</th>
                <th className="px-4 py-3">Tugas</th>
                <th className="px-4 py-3">Status Penilaian</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.subject}</td>
                  <td className="px-4 py-3 font-semibold">{t.materials}</td>
                  <td className="px-4 py-3 font-semibold">{t.quizzes}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" /> Selesai
                    </span>
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
