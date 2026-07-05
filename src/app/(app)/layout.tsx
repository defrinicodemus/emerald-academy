import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { AuthProvider } from "@/lib/auth-context";
import { ClassProvider } from "@/components/ClassPicker";
import { getCurrentUser } from "@/lib/data/profile";
import { listClasses } from "@/lib/data/school";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const needsClasses = user.role === "teacher" || user.role === "principal";
  const classes = needsClasses ? await listClasses() : [];

  return (
    <AuthProvider user={user} logout={logout}>
      <ClassProvider classes={classes}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background bg-grain">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <AppHeader />
              <main className="flex-1 p-4 md:p-8">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </ClassProvider>
    </AuthProvider>
  );
}
