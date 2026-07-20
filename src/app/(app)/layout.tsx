import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { AuthProvider } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/data/profile";
import { getSchool } from "@/lib/data/school";
import { getNotificationsData } from "@/lib/data/announcements";
import { logout, markAnnouncementsSeen } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, school] = await Promise.all([getCurrentUser(), getSchool()]);
  if (!user) redirect("/login");

  const notifications = await getNotificationsData(user.id);

  return (
    <AuthProvider user={user} logout={logout}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background bg-grain">
          <AppSidebar schoolName={school?.name ?? null} logoUrl={school?.logo_url ?? null} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader
              unreadCount={notifications.unreadCount}
              recentAnnouncements={notifications.recent}
              markSeen={markAnnouncementsSeen}
            />
            <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
