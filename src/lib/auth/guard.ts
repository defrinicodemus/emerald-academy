import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import type { AuthUser, Role } from "@/lib/auth-context";

// For Server Components/pages: redirects instead of returning an error shape.
export async function requireRole(allowedRoles: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowedRoles.includes(user.role)) redirect("/dashboard");
  return user;
}

// For Server Actions: returns the same { ok: false, message } shape every
// action already uses, so callers can just `if (err) return err;`.
export function assertRole(
  user: AuthUser | null,
  allowedRoles: Role[],
): { ok: false; message: string } | null {
  if (!user || !allowedRoles.includes(user.role)) {
    return { ok: false, message: "Tidak diizinkan." };
  }
  return null;
}
