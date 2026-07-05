"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ClassPicker } from "@/components/ClassPicker";
import { useAuth } from "@/lib/auth-context";
import { Bell, Moon, Sun } from "lucide-react";

function breadcrumb(p: string) {
  const seg = p.split("/").filter(Boolean).pop() ?? "dashboard";
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppHeader() {
  const { user } = useAuth();
  const path = usePathname();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const showClassPicker = user && (user.role === "teacher" || user.role === "principal");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="text-foreground" />
      <div className="hidden text-sm text-muted-foreground md:block">{breadcrumb(path)}</div>
      <div className="ml-auto flex items-center gap-2">
        {showClassPicker && <ClassPicker />}
        <Button size="icon" variant="ghost" className="rounded-full" aria-label="Notifikasi">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setDark((d) => !d)}
          aria-label="Ganti tema"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
