import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_app/gamification")({ component: GamificationPage });

function GamificationPage() {
  const { active } = useActiveClass();
  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="🏆" title="Gamifikasi" subtitle="Bintang & lencana siswa" />
        <EmptyClassState message="Sistem gamifikasi terkunci. Silakan pilih kelas Anda untuk memantau perolehan bintang siswa." />
      </div>
    );
  }

  const leaderboard = [
    { name: "Ani Putri", stars: 152 },
    { name: "Budi Santoso", stars: 128 },
    { name: "Dimas Pratama", stars: 96 },
    { name: "Eka Wijaya", stars: 88 },
    { name: "Citra Dewi", stars: 64 },
  ];
  const requests = [
    { name: "Budi Santoso", reward: "Avatar Kucing Lucu", cost: 30 },
    { name: "Ani Putri", reward: "Tema Dashboard Pelangi", cost: 50 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon="🏆" title={`Gamifikasi — ${active}`} subtitle="Kelola bintang dan persetujuan hadiah" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Permintaan Penukaran</h2>
          <div className="mt-4 space-y-3">
            {requests.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.reward} · {r.cost} bintang</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg">Tolak</Button>
                <Button size="sm" className="rounded-lg">Setujui</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Papan Bintang</h2>
            <Button size="sm" variant="outline" className="rounded-lg">+ Bonus Bintang</Button>
          </div>
          <div className="mt-4 space-y-2">
            {leaderboard.map((l, i) => (
              <div key={l.name} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold">{i + 1}</div>
                <div className="flex-1 font-medium">{l.name}</div>
                <div className="flex items-center gap-1 font-bold">
                  <Star className="h-4 w-4 fill-star text-star" /> {l.stars}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
