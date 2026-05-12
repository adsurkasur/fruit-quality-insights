import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ensureSeed, getScans, getDevices, ScanRecord, Device } from "@/lib/buahsafe-data";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

const COLORS = ["#10B981", "#F43F5E"];
const DEVICE_PALETTE = ["#10B981", "#3B82F6", "#8B5CF6"];

function AnalyticsPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    ensureSeed();
    setScans(getScans());
    setDevices(getDevices());
    const i = setInterval(() => { setScans(getScans()); setDevices(getDevices()); }, 8000);
    return () => clearInterval(i);
  }, []);

  // 14-day pass/anomali bars
  const days = Array.from({ length: 14 }).map((_, i) => {
    const day = startOfDay(subDays(new Date(), 13 - i));
    const next = day.getTime() + 86400000;
    const ds = scans.filter((s) => {
      const t = new Date(s.timestamp).getTime();
      return t >= day.getTime() && t < next;
    });
    const n = ds.filter((s) => s.result === "NORMAL").length;
    return { day: format(day, "d MMM"), NORMAL: n, ANOMALI: ds.length - n };
  });

  const total = scans.length;
  const normal = scans.filter((s) => s.result === "NORMAL").length;
  const pieData = [
    { name: "Normal", value: normal },
    { name: "Anomali", value: total - normal },
  ];

  const byDevice = devices.map((d, i) => {
    const ds = scans.filter((s) => s.deviceId === d.id);
    const n = ds.filter((s) => s.result === "NORMAL").length;
    return {
      device: d.id,
      name: d.name,
      total: ds.length,
      passRate: ds.length ? Math.round((n / ds.length) * 100) : 0,
      color: DEVICE_PALETTE[i % DEVICE_PALETTE.length],
    };
  });

  return (
    <PageLayout title="Analytics" subtitle="Trends, distribution, and device performance" roles={["supervisor", "owner"]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Scans</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{total.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Overall Pass Rate</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-emerald-600">
            {total ? Math.round((normal / total) * 100) : 0}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Anomalies</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-rose-600">{(total - normal).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Daily Distribution — Last 14 Days</h3>
          </div>
          <div className="p-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} />
                <Bar dataKey="NORMAL" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ANOMALI" stackId="a" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Result Mix</h3>
          </div>
          <div className="p-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Device Performance</h3>
        </div>
        <div className="divide-y divide-border">
          {byDevice.map((d) => (
            <div key={d.device} className="px-5 py-4 flex items-center gap-4">
              <div className="w-20 font-mono text-xs">{d.device}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full" style={{ width: `${d.passRate}%`, background: d.color }} />
                </div>
              </div>
              <div className="text-right w-28">
                <div className="text-sm font-semibold tabular-nums">{d.passRate}%</div>
                <div className="text-[11px] text-muted-foreground">{d.total} scans</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
