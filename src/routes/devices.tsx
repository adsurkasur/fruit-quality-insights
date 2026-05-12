import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import { PageLayout } from "@/components/buahsafe/Layout";
import { DeviceStatusPill } from "@/components/buahsafe/StatusBadge";
import { ensureSeed, getDevices, getScans, DEVICE_COLORS, Device, ScanRecord } from "@/lib/buahsafe-data";

export const Route = createFileRoute("/devices")({ component: DevicesPage });

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    ensureSeed();
    const update = () => { setDevices(getDevices()); setScans(getScans()); };
    update();
    const i = setInterval(update, 5000);
    return () => clearInterval(i);
  }, []);

  const today0 = startOfDay(new Date()).getTime();
  const online = devices.filter((d) => d.status === "online" || d.status === "idle").length;
  const offline = devices.filter((d) => d.status === "offline").length;

  return (
    <PageLayout
      title="Device Management"
      subtitle="Monitor and manage your BuahSafe scanner fleet"
    >
      <div className="text-sm text-muted-foreground mb-6">
        <span className="font-medium text-foreground">{devices.length} devices</span>
        {" · "}<span className="text-emerald-600">{online} online</span>
        {" · "}<span className="text-slate-500">{offline} offline</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {devices.map((d, i) => {
          const deviceScans = scans.filter((s) => s.deviceId === d.id);
          const todayCount = deviceScans.filter((s) => new Date(s.timestamp).getTime() >= today0).length;
          const passes = deviceScans.filter((s) => s.result === "NORMAL").length;
          const passRate = deviceScans.length ? Math.round((passes / deviceScans.length) * 100) : 0;
          const sparkData = Array.from({ length: 7 }).map((_, idx) => {
            const day = startOfDay(subDays(new Date(), 6 - idx));
            const next = day.getTime() + 86400000;
            return {
              v: deviceScans.filter((s) => {
                const t = new Date(s.timestamp).getTime();
                return t >= day.getTime() && t < next;
              }).length,
            };
          });
          const isOffline = d.status === "offline";

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isOffline ? 0.7 : 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card shadow-sm p-5"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[d.id]}`}>
                  {d.id}
                </span>
                <div className="flex items-center gap-2">
                  <DeviceStatusPill status={d.status} />
                  <button className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-[18px] font-semibold tracking-tight">{d.name}</div>
                <div className="text-sm text-muted-foreground">{d.location}</div>
              </div>

              {isOffline && (
                <div className="mt-3 px-3 py-2 rounded-md bg-amber-50 text-amber-700 text-xs border border-amber-200">
                  ⚠ Last seen {formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })}
                </div>
              )}

              <div className="my-4 border-t border-border" />

              <div className="grid grid-cols-2 gap-4">
                <Stat label="Total Scans" value={d.totalScans.toLocaleString()} />
                <Stat label="Today" value={todayCount.toString()} />
                <Stat label="Pass Rate" value={`${passRate}%`} />
                <Stat label="Last Active" value={formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })} small />
              </div>

              <div className="mt-4 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <Line
                      type="monotone" dataKey="v" stroke={isOffline ? "#94A3B8" : "#10B981"}
                      strokeWidth={2} dot={false} isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <div>Firmware {d.firmwareVersion}</div>
                  <div className="mt-0.5">Installed {format(new Date(d.installDate), "d MMM yyyy")}</div>
                </div>
                <Link
                  to="/history"
                  search={{ device: d.id }}
                  className="px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent text-foreground font-medium"
                >
                  View History
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageLayout>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={`mt-0.5 font-semibold tabular-nums ${small ? "text-sm" : "text-lg"}`}>{value}</div>
    </div>
  );
}
