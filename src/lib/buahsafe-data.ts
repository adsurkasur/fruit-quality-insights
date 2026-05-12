export interface Device {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "idle";
  lastSeen: string;
  totalScans: number;
  firmwareVersion: string;
  installDate: string;
}

export interface ScanRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  result: "NORMAL" | "ANOMALI";
  confidence: number;
  amplitudeAvg: number;
  batchId: string;
  operatorNote?: string;
  operatorId?: string;
}

const DEVICES_KEY = "buahsafe.devices.v1";
const SCANS_KEY = "buahsafe.scans.v1";

const SEED_DEVICES: Device[] = [
  {
    id: "BSF-001",
    name: "Meja Sortasi A",
    location: "Lantai Produksi",
    status: "online",
    lastSeen: new Date().toISOString(),
    totalScans: 0,
    firmwareVersion: "v1.2.4",
    installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  },
  {
    id: "BSF-002",
    name: "Meja Sortasi B",
    location: "Lantai Produksi",
    status: "idle",
    lastSeen: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    totalScans: 0,
    firmwareVersion: "v1.2.4",
    installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: "BSF-003",
    name: "Gudang Utama",
    location: "Gudang",
    status: "offline",
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    totalScans: 0,
    firmwareVersion: "v1.1.9",
    installDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pickDevice(): typeof SEED_DEVICES[number] {
  const r = Math.random();
  if (r < 0.4) return SEED_DEVICES[0];
  if (r < 0.75) return SEED_DEVICES[1];
  return SEED_DEVICES[2];
}

function generateSeedScans(): ScanRecord[] {
  const scans: ScanRecord[] = [];
  const now = Date.now();
  let batchCounter = 1;
  let scansInBatch = 0;
  let currentBatch = `BATCH-2024-${String(batchCounter).padStart(3, "0")}`;
  const batchSize = randInt(6, 10);

  for (let day = 29; day >= 0; day--) {
    const dayCount = randInt(8, 35);
    for (let i = 0; i < dayCount; i++) {
      const device = pickDevice();
      // BSF-003 has no scans in last 5 days
      if (device.id === "BSF-003" && day < 5) continue;

      const hour = randInt(7, 17);
      const minute = randInt(0, 59);
      const ts = new Date(now - day * 86400000);
      ts.setHours(hour, minute, randInt(0, 59), 0);

      const isAnomali = Math.random() < 0.28;
      const result: ScanRecord["result"] = isAnomali ? "ANOMALI" : "NORMAL";

      if (scansInBatch >= batchSize) {
        batchCounter++;
        currentBatch = `BATCH-2024-${String(batchCounter).padStart(3, "0")}`;
        scansInBatch = 0;
      }
      scansInBatch++;

      scans.push({
        id: uid(),
        deviceId: device.id,
        deviceName: device.name,
        timestamp: ts.toISOString(),
        result,
        confidence: isAnomali ? randInt(55, 89) : randInt(75, 99),
        amplitudeAvg: isAnomali ? randInt(180, 270) : randInt(280, 420),
        batchId: currentBatch,
      });

      if (scans.length >= 300) break;
    }
    if (scans.length >= 300) break;
  }

  return scans.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(DEVICES_KEY)) {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(SEED_DEVICES));
  }
  if (!localStorage.getItem(SCANS_KEY)) {
    const scans = generateSeedScans();
    localStorage.setItem(SCANS_KEY, JSON.stringify(scans));
    // update device totalScans
    const devices = getDevices();
    devices.forEach((d) => {
      d.totalScans = scans.filter((s) => s.deviceId === d.id).length;
    });
    saveDevices(devices);
  }
}

export function getDevices(): Device[] {
  if (typeof window === "undefined") return SEED_DEVICES;
  ensureSeed();
  return JSON.parse(localStorage.getItem(DEVICES_KEY) || "[]");
}

export function saveDevices(devices: Device[]) {
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
}

export function getScans(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  ensureSeed();
  return JSON.parse(localStorage.getItem(SCANS_KEY) || "[]");
}

export function saveScans(scans: ScanRecord[]) {
  localStorage.setItem(SCANS_KEY, JSON.stringify(scans));
}

export function addScan(opts?: { operatorId?: string; deviceId?: string }): ScanRecord {
  const available = getDevices().filter((d) => d.status !== "offline");
  const device =
    (opts?.deviceId && available.find((d) => d.id === opts.deviceId)) ||
    available[randInt(0, available.length - 1)];
  const isAnomali = Math.random() < 0.25;
  const scans = getScans();
  const lastBatch = scans[scans.length - 1]?.batchId || "BATCH-2024-001";
  const scan: ScanRecord = {
    id: uid(),
    deviceId: device.id,
    deviceName: device.name,
    timestamp: new Date().toISOString(),
    result: isAnomali ? "ANOMALI" : "NORMAL",
    confidence: isAnomali ? randInt(55, 89) : randInt(75, 99),
    amplitudeAvg: isAnomali ? randInt(180, 270) : randInt(280, 420),
    batchId: lastBatch,
    operatorId: opts?.operatorId,
  };
  scans.push(scan);
  saveScans(scans);
  // bump device totals + lastSeen
  const allDevices = getDevices();
  const idx = allDevices.findIndex((d) => d.id === device.id);
  if (idx >= 0) {
    allDevices[idx].totalScans += 1;
    allDevices[idx].lastSeen = scan.timestamp;
    allDevices[idx].status = "online";
    saveDevices(allDevices);
  }
  return scan;
}

export const DEVICE_COLORS: Record<string, string> = {
  "BSF-001": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "BSF-002": "bg-blue-50 text-blue-700 border-blue-200",
  "BSF-003": "bg-violet-50 text-violet-700 border-violet-200",
};
