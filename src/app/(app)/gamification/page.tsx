"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { approveRedemption, rejectRedemption } from "../actions";

interface LeaderRow {
  student_id: string;
  name: string;
  stars: number;
}
interface RequestRow {
  id: string;
  name: string;
  reward: string;
  cost: number;
}

export default function GamificationPage() {
  const { active, activeClassId } = useActiveClass();
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);

  const load = useCallback(async () => {
    if (!activeClassId) {
      setLeaderboard([]);
      setRequests([]);
      return;
    }
    const supabase = createClient();

    const { data: leaders } = await supabase
      .from("class_leaderboard")
      .select("student_id, full_name, total_stars")
      .eq("class_id", activeClassId)
      .order("total_stars", { ascending: false });
    setLeaderboard(
      (leaders ?? []).map((l) => ({ student_id: l.student_id, name: l.full_name, stars: l.total_stars })),
    );

    const { data: pendingRequests } = await supabase
      .from("reward_redemptions")
      .select("id, cost, profiles(full_name, class_id), rewards(name)")
      .eq("status", "pending");
    const filtered = (pendingRequests ?? []).filter(
      (r) => (r.profiles as unknown as { class_id: string | null } | null)?.class_id === activeClassId,
    );
    setRequests(
      filtered.map((r) => ({
        id: r.id,
        name: (r.profiles as unknown as { full_name: string } | null)?.full_name ?? "-",
        reward: (r.rewards as unknown as { name: string } | null)?.name ?? "-",
        cost: r.cost,
      })),
    );
  }, [activeClassId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!activeClassId) {
    return (
      <div className="space-y-6">
        <PageHeader icon="🏆" title="Gamifikasi" subtitle="Bintang & lencana siswa" />
        <EmptyClassState message="Sistem gamifikasi terkunci. Silakan pilih kelas Anda untuk memantau perolehan bintang siswa." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon="🏆" title={`Gamifikasi — ${active}`} subtitle="Kelola bintang dan persetujuan hadiah" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Permintaan Penukaran</h2>
          <div className="mt-4 space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.reward} · {r.cost} bintang
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={async () => {
                    await rejectRedemption(r.id);
                    load();
                  }}
                >
                  Tolak
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg"
                  onClick={async () => {
                    await approveRedemption(r.id);
                    load();
                  }}
                >
                  Setujui
                </Button>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ada permintaan yang menunggu.</p>
            )}
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Papan Bintang</h2>
            <Button size="sm" variant="outline" className="rounded-lg">
              + Bonus Bintang
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {leaderboard.map((l, i) => (
              <div key={l.student_id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 font-medium">{l.name}</div>
                <div className="flex items-center gap-1 font-bold">
                  <Star className="h-4 w-4 fill-star text-star" /> {l.stars}
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data bintang untuk kelas ini.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
