import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, X, ArrowUpDown } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ResultBadge } from "@/components/buahsafe/StatusBadge";
import { ensureSeed, getScans, getDevices, DEVICE_COLORS, ScanRecord } from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  device: fallback(z.string(), "all").default("all"),
  result: fallback(z.enum(["all", "NORMAL", "ANOMALI"]), "all").default("all"),
  q: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/history")({
  validateSearch: zodValidator(searchSchema),
  component: HistoryPage,
});

function HistoryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/history" });
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    ensureSeed();
    setScans(getScans());
  }, []);

  const devices = getDevices();

  const filtered = useMemo(() => {
    let r = scans.slice();
    if (user?.role === "operator") r = r.filter((s) => s.operatorId === user.id);
    if (search.device !== "all") r = r.filter((s) => s.deviceId === search.device);
    if (search.result !== "all") r = r.filter((s) => s.result === search.result);
    if (search.q) r = r.filter((s) => s.batchId.toLowerCase().includes(search.q.toLowerCase()));
    if (search.from) r = r.filter((s) => s.timestamp >= search.from);
    if (search.to) r = r.filter((s) => s.timestamp <= search.to + "T23:59:59");
    r.sort((a, b) => sortDesc ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp));
    return r;
  }, [scans, search, sortDesc, user]);

  const passes = filtered.filter((s) => s.result === "NORMAL").length;
  const passRate = filtered.length ? Math.round((passes / filtered.length) * 100) : 0;
  const anomalies = filtered.length - passes;

  const setParam = (key: string, value: string) => {
    navigate({ search: (prev: any) => ({ ...prev, [key]: value }) as any });
  };

  const activeChips: { key: string; label: string }[] = [];
  if (search.device !== "all") activeChips.push({ key: "device", label: `Device: ${search.device}` });
  if (search.result !== "all") activeChips.push({ key: "result", label: `Result: ${search.result}` });
  if (search.q) activeChips.push({ key: "q", label: `Batch: ${search.q}` });
  if (search.from) activeChips.push({ key: "from", label: `From: ${search.from}` });
  if (search.to) activeChips.push({ key: "to", label: `To: ${search.to}` });

  const clearChip = (key: string) => setParam(key, key === "device" || key === "result" ? "all" : "");

  return (
    <PageLayout title="Scan History" subtitle={user?.role === "operator" ? "Your scan records" : "Search, filter, and audit every scan record"}>
      {/* Filters bar */}
      <div className="sticky top-[73px] z-20 -mx-6 lg:-mx-10 px-6 lg:px-10 py-3 bg-background/90 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date" value={search.from}
            onChange={(e) => setParam("from", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date" value={search.to}
            onChange={(e) => setParam("to", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          />
          <select
            value={search.device}
            onChange={(e) => setParam("device", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          >
            <option value="all">All Devices</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.id} — {d.name}</option>)}
          </select>
          <select
            value={search.result}
            onChange={(e) => setParam("result", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm"
          >
            <option value="all">All Results</option>
            <option value="NORMAL">Normal</option>
            <option value="ANOMALI">Anomali</option>
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="Search batch ID..."
              value={search.q}
              onChange={(e) => setParam("q", e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm"
            />
          </div>
        </div>
        {activeChips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeChips.map((c) => (
              <button
                key={c.key}
                onClick={() => clearChip(c.key)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs hover:bg-accent"
              >
                {c.label} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="my-4 text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> records
        {" · "}<span className="text-emerald-600 font-medium">{passRate}% pass rate</span>
        {" · "}<span className="text-rose-600 font-medium">{anomalies} anomalies</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => setSortDesc(!sortDesc)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
                    Timestamp <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">Device</th>
                <th className="px-4 py-3 text-left font-medium">Batch ID</th>
                <th className="px-4 py-3 text-left font-medium">Result</th>
                <th className="px-4 py-3 text-left font-medium">Confidence</th>
                <th className="px-4 py-3 text-left font-medium">Amplitude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 100).map((s) => (
                <tr key={s.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {format(new Date(s.timestamp), "d MMM yyyy, HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[s.deviceId]}`}>
                      {s.deviceId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.batchId}</td>
                  <td className="px-4 py-3"><ResultBadge result={s.result} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full ${s.result === "NORMAL" ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{ width: `${s.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">{s.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.amplitudeAvg}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground text-center">
            Showing first 100 of {filtered.length} records
          </div>
        )}
      </div>
    </PageLayout>
  );
}
