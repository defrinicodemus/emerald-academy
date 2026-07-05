"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  Gift,
  User,
  Users,
  GraduationCap,
  ClipboardList,
  Award,
  Settings,
  Building2,
  BarChart3,
  Bell,
  LogOut,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const NAV: Record<Role, { title: string; url: string; icon: LucideIcon }[]> = {
  student: [
    { title: "Beranda", url: "/dashboard", icon: LayoutDashboard },
    { title: "Mata Pelajaran", url: "/subjects", icon: BookOpen },
    { title: "Rapor & Nilai", url: "/grades", icon: BarChart3 },
    { title: "Toko Bintang", url: "/rewards", icon: Gift },
    { title: "Profil", url: "/profile", icon: User },
  ],
  teacher: [
    { title: "Beranda", url: "/dashboard", icon: LayoutDashboard },
    { title: "Siswa Saya", url: "/students", icon: Users },
    { title: "Materi Ajar", url: "/materials", icon: BookOpen },
    { title: "Penilaian", url: "/assessments", icon: ClipboardList },
    { title: "Gamifikasi", url: "/gamification", icon: Award },
    { title: "Profil", url: "/profile", icon: User },
  ],
  principal: [
    { title: "Beranda", url: "/dashboard", icon: LayoutDashboard },
    { title: "Kinerja Guru", url: "/teacher-monitoring", icon: GraduationCap },
    { title: "Pantau Kelas", url: "/students", icon: Users },
    { title: "Kurikulum", url: "/materials", icon: BookOpen },
    { title: "Laporan Sekolah", url: "/grades", icon: BarChart3 },
    { title: "Profil", url: "/profile", icon: User },
  ],
  admin: [
    { title: "Beranda", url: "/dashboard", icon: LayoutDashboard },
    { title: "Manajemen User", url: "/users", icon: Users },
    { title: "Struktur Akademik", url: "/academic", icon: Building2 },
    { title: "Pengumuman", url: "/announcements", icon: Bell },
    { title: "Pengaturan", url: "/settings", icon: Settings },
    { title: "Profil", url: "/profile", icon: User },
  ],
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const path = usePathname();
  if (!user) return null;
  const items = NAV[user.role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="font-display text-base font-bold leading-tight text-sidebar-foreground">
              SD Inpres
            </div>
            <div className="truncate text-xs text-sidebar-foreground/70">Nggodimeda</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                      <Link href={it.url} className="flex items-center gap-3">
                        <it.icon className="h-4 w-4 shrink-0" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-accent text-lg">
            {user.avatar ?? "🙂"}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</div>
            <div className="truncate text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              {user.role}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 pb-3 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          SD Inpres Nggodimeda
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
