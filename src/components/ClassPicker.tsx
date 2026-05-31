import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSES } from "@/lib/mock-data";
import { School } from "lucide-react";

const Ctx = createContext<{ active: string | null; setActive: (v: string | null) => void } | null>(null);
const KEY = "lms_active_class";

export function ClassProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<string | null>(null);
  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (v) setActiveState(v);
  }, []);
  const setActive = (v: string | null) => {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
    setActiveState(v);
  };
  return <Ctx.Provider value={{ active, setActive }}>{children}</Ctx.Provider>;
}

export function useActiveClass() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useActiveClass outside provider");
  return c;
}

export function ClassPicker() {
  const { active, setActive } = useActiveClass();
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-soft">
      <School className="h-4 w-4 text-primary" />
      <Select value={active ?? ""} onValueChange={(v) => setActive(v || null)}>
        <SelectTrigger className="h-7 w-[160px] border-0 bg-transparent p-0 text-sm font-medium shadow-none focus:ring-0">
          <SelectValue placeholder="Pilih kelas aktif" />
        </SelectTrigger>
        <SelectContent>
          {CLASSES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EmptyClassState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-3xl border-2 border-dashed border-primary/30 bg-primary-soft/20 px-6 py-16 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-warning/20 text-3xl">⚠️</div>
      <h3 className="font-display text-xl font-semibold">Pilih kelas terlebih dahulu</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
