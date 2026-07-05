import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/data/profile";
import { getStudentGamification } from "@/lib/data/gamification";
import { redeemReward } from "../actions";

export default async function RewardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { badges, rewards, stars } = await getStudentGamification(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🎁"
        title="Toko Bintang"
        subtitle="Tukarkan bintangmu dengan hadiah seru!"
        action={
          <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 shadow-soft">
            <Star className="h-5 w-5 fill-star text-star" />
            <span className="font-display text-2xl font-bold">{stars}</span>
            <span className="text-xs text-muted-foreground">bintang</span>
          </div>
        }
      />

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Lencana Saya</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center rounded-2xl border p-4 text-center transition ${
                b.earned ? "bg-accent/40 border-primary/30" : "opacity-40 grayscale"
              }`}
            >
              <div className="text-4xl">{b.emoji}</div>
              <div className="mt-2 text-xs font-semibold">{b.name}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Katalog Hadiah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((r) => (
            <Card key={r.id} className="rounded-3xl border-0 bg-gradient-to-br from-secondary to-accent/30 p-5 shadow-soft">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-card text-5xl">{r.emoji}</div>
              <div className="mt-4 font-semibold">{r.name}</div>
              <div className="mt-1 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-star text-star" />
                <span className="font-bold">{r.cost}</span>
                <span className="text-xs text-muted-foreground">bintang</span>
              </div>
              <form action={redeemReward.bind(null, r.id)}>
                <Button type="submit" className="mt-4 w-full rounded-xl" disabled={stars < r.cost}>
                  {stars < r.cost ? "Bintang Belum Cukup" : "Tukar"}
                </Button>
              </form>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
