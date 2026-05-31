import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "student" | "teacher" | "principal" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  nisn?: string;
  nip?: string;
  className?: string;
  avatar?: string;
}

const MOCK_USERS: Record<string, AuthUser> = {
  "budi": { id: "s1", name: "Budi Santoso", role: "student", nisn: "0098765432", className: "Kelas 4A", avatar: "🦊" },
  "guru": { id: "t1", name: "Ibu Sari Wulandari", role: "teacher", nip: "198501012010012001", avatar: "👩‍🏫" },
  "kepsek": { id: "p1", name: "Bapak Yohanes Bele", role: "principal", nip: "197003121995011001", avatar: "👨‍💼" },
  "admin": { id: "a1", name: "Admin Sekolah", role: "admin", avatar: "🛠️" },
};

interface AuthCtx {
  user: AuthUser | null;
  login: (username: string) => AuthUser | null;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const STORAGE_KEY = "lms_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (username: string) => {
    const u = MOCK_USERS[username.toLowerCase().trim()];
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      setUser(u);
      return u;
    }
    return null;
  };
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

export const DEMO_ACCOUNTS = [
  { username: "budi", label: "Murid (Budi)", role: "student" as const },
  { username: "guru", label: "Guru (Ibu Sari)", role: "teacher" as const },
  { username: "kepsek", label: "Kepala Sekolah", role: "principal" as const },
  { username: "admin", label: "Admin", role: "admin" as const },
];
