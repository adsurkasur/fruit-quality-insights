import { ReactNode, useEffect, useState } from "react";
import { AppSidebar, MobileNav } from "./Sidebar";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { getScans } from "@/lib/buahsafe-data";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, children }: Props) {
  const [now, setNow] = useState(new Date());
  const [anomalies, setAnomalies] = useState(0);

  useEffect(() => {
    const update = () => {
      setNow(new Date());
      const cutoff = Date.now() - 3600_000;
      const count = getScans().filter(
        (s) => s.result === "ANOMALI" && new Date(s.timestamp).getTime() > cutoff,
      ).length;
      setAnomalies(count);
    };
    update();
    const i = setInterval(update, 10_000);
    return () => clearInterval(i);
  }, []);

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
              <div className="hidden sm:block text-xs text-muted-foreground">
                Updated {format(now, "HH:mm:ss")}
              </div>
              <button className="relative w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-accent">
                <Bell className="w-4 h-4" />
                {anomalies > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-medium flex items-center justify-center">
                    {anomalies}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        <div className="px-6 lg:px-10 py-6 lg:py-8">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
