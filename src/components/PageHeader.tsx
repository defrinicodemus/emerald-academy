import { Card } from "@/components/ui/card";

export function PageHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-0 gradient-soft p-6 shadow-soft md:p-8">
      <div className="flex items-center gap-4">
        {icon && <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card text-3xl shadow-soft">{icon}</div>}
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </Card>
  );
}
