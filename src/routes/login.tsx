import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { useAuth, DEMO_USERS, ROLE_LABELS, ROLE_COLORS, Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, login, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: user.role === "operator" ? "/scan" : "/" });
  }, [ready, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = login(username, password);
    if (!r.ok) setError(r.error || "Login failed");
  };

  const quick = (u: string) => {
    setUsername(u);
    setPassword(u);
    setError("");
    const r = login(u, u);
    if (!r.ok) setError(r.error || "Login failed");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-lg">BuahSafe</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Quality Intelligence</div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Access your role-based dashboard</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-xs text-rose-600">{error}</div>}
            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Quick sign-in (demo)</div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => quick(u.username)}
                  className={`p-2 rounded-lg border text-xs hover:bg-accent transition-colors ${ROLE_COLORS[u.role as Role]}`}
                >
                  <div className="font-semibold">{ROLE_LABELS[u.role as Role]}</div>
                  <div className="opacity-70 text-[10px] mt-0.5">{u.username}</div>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-3">
              Tip: username = password (operator/supervisor/owner)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
