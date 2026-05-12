import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageLayout } from "@/components/buahsafe/Layout";
import { ResultBadge } from "@/components/buahsafe/StatusBadge";
import { ensureSeed, getScans, addScan, getDevices, DEVICE_COLORS, ScanRecord } from "@/lib/buahsafe-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/scan")({ component: ScanPage });

function ScanPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    ensureSeed();
    setScans(getScans());
    const d = getDevices().find((d) => d.status !== "offline");
    if (d) setDeviceId(d.id);
  }, []);

  const myScans = scans
    .filter((s) => s.operatorId === user?.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const trigger = async () => {
    if (!deviceId || !user) return;
    setScanning(true);
    await new Promise((r) => setTimeout(r, 1200));
    const s = addScan({ operatorId: user.id, deviceId });
    setScans(getScans());
    setScanning(false);
    toast(`Scan ${s.result}`, { description: `${s.deviceName} · ${s.confidence}% confidence` });
  };

  const devices = getDevices().filter((d) => d.status !== "offline");

  return (
    <PageLayout title="Scan" subtitle="Trigger an ultrasonic scan and view your batch history" roles={["operator"]}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm p-6">
          <h3 className="font-semibold text-sm">New Scan</h3>
          <p className="text-xs text-muted-foreground mt-1">Pick a device and start scanning</p>

          <label className="block mt-5 text-xs font-medium text-muted-foreground">Device</label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.id} — {d.name}</option>
            ))}
          </select>

          <button
            onClick={trigger}
            disabled={scanning || !deviceId}
            className="mt-5 w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {scanning ? "Scanning…" : "Trigger Scan"}
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">My Scans</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{myScans.length}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Anomali</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-rose-600">
                {myScans.filter((s) => s.result === "ANOMALI").length}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">My Recent Scans</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Only scans you triggered</p>
          </div>
          <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {myScans.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No scans yet. Click "Trigger Scan" to start.
                </div>
              )}
              {myScans.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-3 flex items-center gap-4"
                >
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${DEVICE_COLORS[s.deviceId]}`}>
                    {s.deviceId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium font-mono">{s.batchId}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(s.timestamp), "d MMM yyyy, HH:mm")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums w-12 text-right">{s.confidence}%</div>
                  <ResultBadge result={s.result} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
