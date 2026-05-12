import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AppSidebar, MobileNav } from "./Sidebar";
import { format } from "date-fns";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth, Role } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  roles?: Role[];
}

export function PageLayout({ title, subtitle, children, roles }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (ready && !user && path !== "/login") {
      navigate({ to: "/login" });
    }
  }, [ready, user, path, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const allowed = !roles || roles.includes(user.role);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                {now ? `Updated ${format(now, "HH:mm:ss")}` : ""}
              </div>
              <NotificationPanel />
            </div>
          </div>
        </header>
        <div className="px-6 lg:px-10 py-6 lg:py-8">
          {allowed ? (
            children
          ) : (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="mt-3 text-lg font-semibold">Access restricted</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your role ({user.role}) doesn't have access to this page.
              </p>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
