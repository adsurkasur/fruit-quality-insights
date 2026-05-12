import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "operator" | "supervisor" | "owner";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

const DEMO_USERS: (AuthUser & { password: string })[] = [
  { id: "u-op-1", name: "Budi Santoso", username: "operator", password: "operator", role: "operator" },
  { id: "u-sv-1", name: "Sari Wijaya", username: "supervisor", password: "supervisor", role: "supervisor" },
  { id: "u-ow-1", name: "Pak Hendra", username: "owner", password: "owner", role: "owner" },
];

const KEY = "buahsafe.auth.v1";

interface Ctx {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) try { setUser(JSON.parse(raw)); } catch {}
    setReady(true);
  }, []);

  const login: Ctx["login"] = (username, password) => {
    const found = DEMO_USERS.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    );
    if (!found) return { ok: false, error: "Invalid username or password" };
    const u: AuthUser = { id: found.id, name: found.name, username: found.username, role: found.role };
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  const hasRole = (roles: Role[]) => !!user && roles.includes(user.role);

  return <AuthCtx.Provider value={{ user, ready, login, logout, hasRole }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}

export const ROLE_LABELS: Record<Role, string> = {
  operator: "Operator",
  supervisor: "Supervisor",
  owner: "Owner",
};

export const ROLE_COLORS: Record<Role, string> = {
  operator: "bg-blue-50 text-blue-700 border-blue-200",
  supervisor: "bg-violet-50 text-violet-700 border-violet-200",
  owner: "bg-amber-50 text-amber-700 border-amber-200",
};

export { DEMO_USERS };
