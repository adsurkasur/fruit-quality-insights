import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ScanLine, ShieldCheck, AlertTriangle, Wifi, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ResultBadge, DeviceStatusPill } from "@/components/buahsafe/StatusBadge";
import {
  ensureSeed, getDevices, getScans, addScan, DEVICE_COLORS, ScanRecord, Device,
} from "@/lib/buahsafe-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCard({
  index, title, value, suffix, icon: Icon, accent, trend,
}: {
  index: number; title: string; value: number; suffix?: string;
  icon: React.ElementType; accent: "emerald" | "rose" | "amber" | "slate";
  trend?: { dir: "up" | "down"; pct: number };
}) {
  const v = useCountUp(value);
  const accentMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight">
          {v}{suffix}
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${trend.dir === "up" ? "text-emerald-600" : "text-rose-600"}`}>
            {trend.dir === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.pct.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">vs yesterday</div>
    </motion.div>
  );
}

function Dashboard() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    ensureSeed();
    setScans(getScans());
    setDevices(getDevices());
  }, []);

  // Auto simulation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const newScan = addScan();
      setScans(getScans());
      setDevices(getDevices());
      toast(`New scan received from ${newScan.deviceName}`, {
        description: `${newScan.result} · ${newScan.confidence}% confidence`,
      });
      timer = setTimeout(tick, (Math.random() * 5 + 7) * 1000);
    };
    timer = setTimeout(tick, 8000);
    return () => clearTimeout(timer);
  }, []);

  // metrics
  const today0 = startOfDay(new Date()).getTime();
  const yest0 = startOfDay(subDays(new Date(), 1)).getTime();

  const todayScans = scans.filter((s) => new Date(s.timestamp).getTime() >= today0);
  const yestScans = scans.filter((s) => {
    const t = new Date(s.timestamp).getTime();
    return t >= yest0 && t < today0;
  });

  const totalToday = todayScans.length;
  const normalToday = todayScans.filter((s) => s.result === "NORMAL").length;
  const passToday = totalToday ? (normalToday / totalToday) * 100 : 0;
  const anomToday = todayScans.length - normalToday;

  const normalYest = yestScans.filter((s) => s.result === "NORMAL").length;
  const passYest = yestScans.length ? (normalYest / yestScans.length) * 100 : 0;
  const anomYest = yestScans.length - normalYest;

  const passTrend = passYest ? passToday - passYest : 0;
  const anomTrend = anomYest ? ((anomToday - anomYest) / anomYest) * 100 : 0;

  const activeDevices = devices.filter((d) => d.status !== "offline").length;

  // 7-day trend
  const trend7 = Array.from({ length: 7 }).map((_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const next = day.getTime() + 86400000;
    const dayScans = scans.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    const n = dayScans.filter((s) => s.result === "NORMAL").length;
    const a = dayScans.length - n;
    return {
      day: format(day, "EEE"),
      NORMAL: n,
      ANOMALI: a,
      passRate: dayScans.length ? Math.round((n / dayScans.length) * 100) : 0,
    };
  });

  const recent = [...scans].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);

  return (
    <PageLayout title="Dashboard" subtitle="Real-time fleet quality intelligence">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} title="Total Scans Today" value={totalToday} icon={ScanLine} accent="slate" />
        <StatCard
          index={1} title="Pass Rate Today" value={Math.round(passToday)} suffix="%"
          icon={ShieldCheck} accent="emerald"
          trend={yestScans.length ? { dir: passTrend >= 0 ? "up" : "down", pct: Math.abs(passTrend) } : undefined}
        />
        <StatCard
          index={2} title="Anomalies Detected" value={anomToday} icon={AlertTriangle} accent="rose"
          trend={anomYest ? { dir: anomTrend <= 0 ? "up" : "down", pct: Math.abs(anomTrend) } : undefined}
        />
        <StatCard
          index={3} title="Active Devices" value={activeDevices} suffix={` / ${devices.length}`}
          icon={Wifi} accent={activeDevices === devices.length ? "emerald" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-6">
        {/* Live feed */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500 pulse-dot" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              <h3 className="font-semibold text-sm">Live Scan Feed</h3>
            </div>
            <Link to="/history" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {recent.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 py-3 flex items-center gap-4"
                >
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[s.deviceId]}`}>
                    {s.deviceId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.deviceName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full ${s.result === "NORMAL" ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${s.confidence}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">{s.confidence}%</div>
                  </div>
                  <ResultBadge result={s.result} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Fleet status */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Fleet Status</h3>
          </div>
          <div className="p-3 space-y-2">
            {devices.map((d) => {
              const todayCount = todayScans.filter((s) => s.deviceId === d.id).length;
              return (
                <Link
                  key={d.id}
                  to="/devices"
                  className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[d.id]}`}>
                      {d.id}
                    </span>
                    <DeviceStatusPill status={d.status} />
                  </div>
                  <div className="mt-2 font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.location}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })}
                    </span>
                    <span className="font-medium tabular-nums">{todayCount} today</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Scan Activity — Last 7 Days</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Daily NORMAL vs ANOMALI distribution</p>
        </div>
        <div className="p-5 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend7} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gNorm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAnom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-card shadow-md p-3 text-xs">
                      <div className="font-medium mb-1">{label}</div>
                      <div className="text-emerald-600">Normal: {d.NORMAL}</div>
                      <div className="text-rose-600">Anomali: {d.ANOMALI}</div>
                      <div className="text-muted-foreground mt-1 pt-1 border-t border-border">
                        Pass rate: {d.passRate}%
                      </div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="NORMAL" stroke="#10B981" strokeWidth={2} fill="url(#gNorm)" />
              <Area type="monotone" dataKey="ANOMALI" stroke="#F43F5E" strokeWidth={2} fill="url(#gAnom)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageLayout>
  );
}
