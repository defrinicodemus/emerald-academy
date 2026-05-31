import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ClassPicker, ClassProvider } from "@/components/ClassPicker";
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AuthProvider>
      <ClassProvider>
        <Guard>
          <Shell />
        </Guard>
      </ClassProvider>
    </AuthProvider>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  if (!user) {
    if (typeof window !== "undefined") window.location.replace("/login");
    return null;
  }
  return <>{children}</>;
}

function Shell() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const showClassPicker = user && (user.role === "teacher" || user.role === "principal");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-grain">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
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
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function breadcrumb(p: string) {
  const seg = p.split("/").filter(Boolean).pop() ?? "dashboard";
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
