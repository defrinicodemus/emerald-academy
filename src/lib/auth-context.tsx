"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Role = "student" | "teacher" | "principal" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  nisn?: string;
  nip?: string;
  classId?: string;
  className?: string;
  avatar?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  logout: () => void | Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({
  user,
  logout,
  children,
}: {
  user: AuthUser | null;
  logout: () => void | Promise<void>;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ user, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
