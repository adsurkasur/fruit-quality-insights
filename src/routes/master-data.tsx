import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Sprout } from "lucide-react";
import { PageLayout } from "@/components/buahsafe/Layout";
import { DEMO_USERS, ROLE_LABELS, ROLE_COLORS, Role } from "@/lib/auth";

export const Route = createFileRoute("/master-data")({ component: MasterDataPage });

interface Petani {
  id: string;
  name: string;
  village: string;
  phone: string;
  joined: string;
}

const KEY = "buahsafe.petani.v1";
const SEED: Petani[] = [
  { id: "p1", name: "Pak Karto", village: "Desa Sukamulya", phone: "0812-3344-5566", joined: "2024-03-12" },
  { id: "p2", name: "Bu Lestari", village: "Desa Cibeureum", phone: "0813-1122-3344", joined: "2024-05-20" },
  { id: "p3", name: "Pak Surya", village: "Desa Cikondang", phone: "0857-9988-7766", joined: "2024-07-02" },
];

function MasterDataPage() {
  const [tab, setTab] = useState<"petani" | "users">("petani");
  const [petani, setPetani] = useState<Petani[]>([]);
  const [form, setForm] = useState({ name: "", village: "", phone: "" });

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setPetani(JSON.parse(raw));
    else { localStorage.setItem(KEY, JSON.stringify(SEED)); setPetani(SEED); }
  }, []);

  const save = (next: Petani[]) => {
    setPetani(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!form.name.trim()) return;
    const p: Petani = {
      id: "p" + Date.now().toString(36),
      name: form.name.trim(),
      village: form.village.trim() || "—",
      phone: form.phone.trim() || "—",
      joined: new Date().toISOString().slice(0, 10),
    };
    save([p, ...petani]);
    setForm({ name: "", village: "", phone: "" });
  };

  const del = (id: string) => save(petani.filter((p) => p.id !== id));

  return (
    <PageLayout title="Master Data" subtitle="Manage farming partners and system users" roles={["owner"]}>
      <div className="flex gap-1 p-1 rounded-lg border border-border bg-card w-fit mb-5">
        <button
          onClick={() => setTab("petani")}
          className={`px-4 py-1.5 rounded-md text-sm inline-flex items-center gap-2 ${
            tab === "petani" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sprout className="w-4 h-4" /> Petani Mitra
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-1.5 rounded-md text-sm inline-flex items-center gap-2 ${
            tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Users
        </button>
      </div>

      {tab === "petani" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Add Partner</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <input
                placeholder="Village"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <button
                onClick={add}
                className="h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm inline-flex items-center justify-center gap-2 hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Village</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {petani.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.village}</td>
                    <td className="px-4 py-3 tabular-nums">{p.phone}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => del(p.id)}
                        className="w-7 h-7 rounded-md hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Username</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DEMO_USERS.map((u) => (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${ROLE_COLORS[u.role as Role]}`}>
                      {ROLE_LABELS[u.role as Role]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Demo users are read-only. In production, owner can create/edit users here.
          </div>
        </div>
      )}
    </PageLayout>
  );
}
