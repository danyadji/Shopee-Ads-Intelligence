"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseAdsCsv, type AdsRow } from "@/lib/csv";
import Competitor from "@/components/competitor";
import {
  calcCpc,
  calcCtr,
  calcCvr,
  calcRoas,
  calcBreakEvenRoas,
  calcCostPerOrder,
  classifyProduct,
  detectWasted,
  formatIDR,
  type RawMetric,
} from "@/lib/metrics";

type Period = "all" | "7" | "30";

type Decision = {
  id: string;
  date: string;
  action: string;
  reason: string;
  expected: string;
};

const NAV = [
  { href: "#ringkasan", label: "Ringkasan" },
  { href: "#campaign", label: "Campaign" },
  { href: "#produk", label: "Produk" },
  { href: "#katalog", label: "Katalog" },
  { href: "#kompetitor", label: "Kompetitor" },
  { href: "#funnel", label: "Funnel" },
  { href: "#profitabilitas", label: "Profitabilitas" },
  { href: "#perhatian", label: "Perhatian" },
  { href: "#strategi", label: "Strategi" },
  { href: "#analyst", label: "AI Analyst" },
  { href: "#keputusan", label: "Catatan Keputusan" },
];

function sum(rows: AdsRow[]): RawMetric {
  return rows.reduce<RawMetric>(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      orders: acc.orders + r.orders,
      spend: acc.spend + r.spend,
      revenue: acc.revenue + r.revenue,
    }),
    { impressions: 0, clicks: 0, orders: 0, spend: 0, revenue: 0 },
  );
}

function dayKey(date: string): number {
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tnum mt-2 text-[28px] font-bold leading-8">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <p className="rounded-[10px] border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
      {text}
    </p>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState<AdsRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [fee, setFee] = useState("");
  const [other, setOther] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [profitSel, setProfitSel] = useState("all");
  const [profitTouched, setProfitTouched] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [decAction, setDecAction] = useState("");
  const [decReason, setDecReason] = useState("");
  const [decExpected, setDecExpected] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [analystState, setAnalystState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [analystText, setAnalystText] = useState("");
  const [analystError, setAnalystError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("shopee-decisions");
      if (raw) setDecisions(JSON.parse(raw));
      const p = localStorage.getItem("shopee-prices");
      const c = localStorage.getItem("shopee-costs");
      if (p) setPrices(JSON.parse(p));
      if (c) setCosts(JSON.parse(c));
    } catch {
      // Abaikan, mulai dari kosong.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("shopee-prices", JSON.stringify(prices));
      localStorage.setItem("shopee-costs", JSON.stringify(costs));
    } catch {
      // Penyimpanan diblokir, data hanya bertahan sesi ini.
    }
  }, [prices, costs]);

  useEffect(() => {
    try {
      localStorage.setItem("shopee-decisions", JSON.stringify(decisions));
    } catch {
      // Penyimpanan penuh atau diblokir, catatan hanya bertahan sesi ini.
    }
  }, [decisions]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function onFile(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseAdsCsv(String(reader.result ?? ""));
      setRows(result.rows);
      setErrors(result.errors);
      setFileName(file.name);
      setPeriod("all");
      setParsing(false);
    };
    reader.onerror = () => {
      setErrors(["File tidak bisa dibaca, coba pilih ulang."]);
      setParsing(false);
    };
    reader.readAsText(file);
  }

  const filtered = useMemo(() => {
    if (period === "all" || rows.length === 0) return rows;
    const max = Math.max(...rows.map((r) => dayKey(r.date)));
    const days = period === "7" ? 7 : 30;
    return rows.filter((r) => {
      const t = dayKey(r.date);
      return t > 0 && max - t <= days * 86400000;
    });
  }, [rows, period]);

  const total = useMemo(() => sum(filtered), [filtered]);
  const roas = calcRoas(total);
  const hasData = rows.length > 0;

  const byCampaign = useMemo(() => {
    const map = new Map<string, AdsRow[]>();
    filtered.forEach((r) => {
      const list = map.get(r.campaign) ?? [];
      list.push(r);
      map.set(r.campaign, list);
    });
    return [...map.entries()].map(([name, list]) => ({
      name,
      total: sum(list),
    }));
  }, [filtered]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      map.set(r.date, (map.get(r.date) ?? 0) + r.revenue);
    });
    return [...map.entries()]
      .map(([date, revenue]) => ({ date, revenue, t: dayKey(date) }))
      .sort((a, b) => a.t - b.t);
  }, [filtered]);

  const productTotals = useMemo(() => {
    const map = new Map<string, { name: string; code: string; list: AdsRow[] }>();
    filtered.forEach((r) => {
      const key = r.product || r.campaign;
      const entry = map.get(key) ?? { name: r.campaign, code: r.product, list: [] };
      entry.list.push(r);
      map.set(key, entry);
    });
    return [...map.values()].map((e) => ({ name: e.name, code: e.code, total: sum(e.list) }));
  }, [filtered]);

  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const profitEntry = profitSel === "all" ? null : productTotals.find((p) => (p.code || p.name) === profitSel) ?? null;
  const profitTotal = profitEntry ? profitEntry.total : total;
  const profitRoas = calcRoas(profitTotal);
  const effPrice = !profitTouched && profitEntry ? prices[profitEntry.code] || prices[profitEntry.name] || "" : price;
  const effCost = !profitTouched && profitEntry ? costs[profitEntry.code] || costs[profitEntry.name] || "" : cost;
  const breakEven = calcBreakEvenRoas(num(effPrice), num(effCost), num(fee), num(other));
  const profitReady = breakEven > 0 && hasData;
  const profitStatus = !profitReady
    ? "Pilih produk dan isi harga serta HPP di Katalog, lalu nilai."
    : profitRoas >= breakEven
      ? "Mencapai break-even pada periode ini."
      : "Di bawah break-even pada periode ini.";

  const alerts = useMemo(
    () =>
      byCampaign
        .map((c) => ({ ...c, signal: detectWasted(c.total, breakEven) }))
        .filter((c) => c.signal.isWasted),
    [byCampaign, breakEven],
  );

  const ctr = calcCtr(total);
  const cvr = calcCvr(total);

  const classLabel: Record<string, string> = {
    scale: "Layak skala",
    monitor: "Pantau",
    optimize: "Optimasi",
    stop: "Kandidat henti",
    need_data: "Data belum cukup",
  };

  const byProduct = useMemo(() => {
    return productTotals.map((e) => ({
      name: e.name,
      code: e.code,
      total: e.total,
      roas: calcRoas(e.total),
      cls: classifyProduct(calcRoas(e.total), breakEven, e.total.orders),
    }));
  }, [productTotals, breakEven]);

  const bottleneck =
    !hasData ? null
    : total.clicks === 0
      ? {
          title: "Iklan belum diklik",
          detail:
            "Impression ada tetapi tidak ada klik. Masalah di traffic: kata kunci kurang relevan atau posisi bid terlalu rendah. Perbaiki targeting sebelum menyentuh halaman produk.",
        }
      : ctr < 0.01
        ? {
            title: "Klik terlalu sedikit",
            detail:
              "CTR di bawah 1 persen. Traffic yang datang kurang tertarik. Evaluasi relevansi keyword dan daya tarik judul atau foto utama.",
          }
        : total.orders === 0
          ? {
              title: "Diklik tapi tidak ada yang beli",
              detail: `Ada ${total.clicks} klik tanpa satu pun order. Traffic bekerja, halaman produk yang gagal menutup penjualan. Prioritas: harga, foto, ulasan, dan kelengkapan deskripsi. Menambah budget sekarang hanya menambah biaya.`,
            }
          : cvr < 0.005 && total.clicks >= 50
            ? {
                title: "Konversi sangat rendah",
                detail:
                  "Banyak klik, sangat sedikit order. Calon pembeli ragu di halaman produk. Bandingkan harga dan ulasan dengan kompetitor sebelum mengubah bid.",
              }
            : profitReady && roas < breakEven
              ? {
                  title: "Laku tapi merugi",
                  detail: `ROAS ${roas.toFixed(2)}x di bawah break-even ${breakEven.toFixed(2)}x. Setiap rupiah iklan menggerus margin. Turunkan bid atau hentikan campaign terlemah.`,
                }
              : {
                  title: "Funnel sehat",
                  detail:
                    "Aliran impression ke order berjalan. Fokus ke campaign dengan ROAS tertinggi untuk skala bertahap.",
                };

  type ActionTone = "up" | "hold" | "down" | "stop" | "wait";
  const actionRows = byCampaign.map((c) => {
    const r = calcRoas(c.total);
    if (c.total.orders === 0 && c.total.spend >= 50000)
      return { name: c.name, roas: r, orders: 0, action: "Hentikan sementara", reason: "Spend besar tanpa order.", tone: "stop" as ActionTone };
    if (c.total.clicks < 50)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Tunggu data", reason: "Klik belum cukup untuk dinilai.", tone: "wait" as ActionTone };
    if (breakEven > 0 && r >= breakEven * 1.2)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Naikkan budget", reason: "ROAS jauh di atas break-even.", tone: "up" as ActionTone };
    if (breakEven > 0 && r >= breakEven)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Pertahankan", reason: "ROAS mencapai break-even.", tone: "hold" as ActionTone };
    if (breakEven > 0)
      return { name: c.name, roas: r, orders: c.total.orders, action: r >= breakEven * 0.7 ? "Turunkan bid" : "Hentikan sementara", reason: "ROAS di bawah break-even.", tone: "down" as ActionTone };
    const avg = byCampaign.reduce((a, x) => a + calcRoas(x.total), 0) / byCampaign.length;
    if (r > avg && c.total.orders > 0)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Prioritaskan", reason: "ROAS di atas rata-rata akun. Isi break-even untuk vonis pasti.", tone: "up" as ActionTone };
    return { name: c.name, roas: r, orders: c.total.orders, action: "Tahan dulu", reason: "Isi break-even di section Profitabilitas untuk vonis pasti.", tone: "wait" as ActionTone };
  });

  const allocation = byCampaign.map((c) => {
    const basis =
      total.revenue > 0
        ? c.total.revenue / total.revenue
        : total.orders > 0
          ? c.total.orders / total.orders
          : 1 / byCampaign.length;
    return {
      name: c.name,
      current: total.spend > 0 ? (c.total.spend / total.spend) * 100 : 0,
      suggested: basis * 100,
    };
  });
  const allocationNote =
    total.revenue > 0 || total.orders > 0
      ? "Saran alokasi mengikuti kontribusi revenue atau order masing-masing campaign."
      : "Belum ada order, jadi tidak ada dasar realokasi. Jangan tambah budget sebelum order pertama muncul.";

  const toneClass: Record<ActionTone, string> = {
    up: "bg-[#166534] text-white",
    hold: "bg-[#1D4ED8] text-white",
    down: "bg-[#92400E] text-white",
    stop: "bg-[#9F1239] text-white",
    wait: "border border-border bg-background text-foreground",
  };

  const maxRevenue = Math.max(1, ...byDay.map((d) => d.revenue));
  const chartPoints = byDay
    .map((d, i) => {
      const x = byDay.length === 1 ? 300 : 40 + (i * 520) / (byDay.length - 1);
      const y = 190 - (d.revenue / maxRevenue) * 150;
      return `${x},${y}`;
    })
    .join(" ");

  function addDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decAction.trim()) return;
    setDecisions((prev) => [
      {
        id: `${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        action: decAction.trim(),
        reason: decReason.trim(),
        expected: decExpected.trim(),
      },
      ...prev,
    ]);
    setDecAction("");
    setDecReason("");
    setDecExpected("");
  }

  const analystPresets = [
    "Kenapa ROAS saya turun?",
    "Campaign mana yang perlu saya perhatikan?",
    "Buatkan ringkasan performa periode ini.",
  ];

  async function askAnalyst(question: string) {
    const q = question.trim();
    if (!q || !hasData || analystState === "loading") return;
    setAnalystState("loading");
    setAnalystError("");
    const top = [...byCampaign]
      .sort((a, b) => b.total.spend - a.total.spend)
      .slice(0, 8)
      .map((c) => ({
        name: c.name,
        impressions: c.total.impressions,
        clicks: c.total.clicks,
        orders: c.total.orders,
        spend: c.total.spend,
        revenue: c.total.revenue,
        roas: calcRoas(c.total),
      }));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          period: period === "all" ? "semua data" : `${period} hari terakhir`,
          totals: {
            impressions: total.impressions,
            clicks: total.clicks,
            orders: total.orders,
            spend: total.spend,
            revenue: total.revenue,
            roas,
          },
          campaigns: top,
          breakEven,
        }),
      });
      const json = (await res.json()) as { analysis?: string; error?: string };
      if (!res.ok || !json.analysis) {
        setAnalystError(json.error ?? "Analisis gagal, coba lagi.");
        setAnalystState("error");
        return;
      }
      setAnalystText(json.analysis);
      setAnalystState("done");
    } catch {
      setAnalystError("Analisis gagal. Periksa koneksi, lalu coba lagi.");
      setAnalystState("error");
    }
  }

  const navList = (
    <ul className="space-y-1">
      {NAV.map((n) => (
        <li key={n.href}>
          <a
            href={n.href}
            onClick={() => setMenuOpen(false)}
            className="block min-h-[44px] rounded-[10px] px-3 py-3 text-sm font-medium text-foreground hover:bg-background focus-visible:outline-2"
          >
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#ringkasan"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-surface focus:px-4 focus:py-2"
      >
        Lewati ke konten
      </a>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-border bg-surface p-4 lg:block">
        <p className="px-3 text-lg font-bold">Shopee Ads</p>
        <p className="mb-4 px-3 text-xs text-muted">Intelligence</p>
        <nav aria-label="Navigasi utama">{navList}</nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="menu-hp"
              className="min-h-[44px] min-w-[44px] rounded-[10px] border border-border px-3 text-sm font-semibold lg:hidden"
            >
              Menu
            </button>
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted">
                Ringkasan campaign dan penjualan
              </p>
            </div>
          </div>
          {menuOpen && (
            <nav
              id="menu-hp"
              aria-label="Navigasi utama"
              className="border-t border-border px-4 py-3 lg:hidden"
            >
              {navList}
            </nav>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-6 sm:px-6">
          <section id="ringkasan" aria-label="Ringkasan" className="scroll-mt-20">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">Ringkasan</h2>
              <div className="ml-auto flex gap-2" role="group" aria-label="Periode">
                {(
                  [
                    ["all", "Semua"],
                    ["7", "7 hari"],
                    ["30", "30 hari"],
                  ] as [Period, string][]
                ).map(([p, label]) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    aria-pressed={period === p}
                    className={`min-h-[44px] rounded-[10px] border px-4 text-sm font-semibold ${
                      period === p
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-surface"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {!hasData ? (
              <div className="mt-3">
                <EmptyBox text="Belum ada data iklan. Unggah CSV Shopee lewat tile Unggah CSV di bawah untuk melihat ringkasan." />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Ad Spend" value={formatIDR(total.spend)} sub={`${fileName}, ${filtered.length} baris`} />
                <StatCard label="Revenue" value={formatIDR(total.revenue)} sub={`${total.orders} order`} />
                <StatCard label="Orders" value={`${total.orders}`} sub={`CPC ${formatIDR(Math.round(calcCpc(total)))}`} />
                <StatCard label="ROAS" value={`${roas.toFixed(2)}x`} sub={`CTR ${(calcCtr(total) * 100).toFixed(2)} persen`} />
                <StatCard label="Break-even" value={breakEven > 0 ? `${breakEven.toFixed(2)}x` : "Belum diisi"} sub={profitStatus} />
              </div>
            )}
            {parsing && <p className="mt-3 text-sm text-muted">Membaca file, mohon tunggu.</p>}
            {errors.length > 0 && (
              <div className="mt-3 rounded-[10px] border border-border bg-surface p-4" role="alert">
                <p className="text-sm font-semibold">Sebagian baris ditolak ({errors.length})</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {errors.slice(0, 5).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section aria-label="Aksi cepat">
            <h2 className="text-[15px] font-semibold">Aksi cepat</h2>
            <p className="mt-1 text-sm text-muted">Mulai dari file atau telusuri hasil.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[14px] border border-border bg-tile-blue p-4">
                <p className="font-semibold text-[#1D4ED8]">Unggah CSV</p>
                <p className="mt-1 text-sm text-[#1D4ED8]">File ekspor Iklan Shopee, langsung tanpa diubah.</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 min-h-[44px] rounded-[10px] bg-[#1D4ED8] px-4 text-sm font-semibold text-white"
                >
                  Pilih file CSV
                </button>
              </div>
              <div className="rounded-[14px] border border-border bg-tile-lavender p-4">
                <p className="font-semibold text-[#5B54C7]">Lihat campaign</p>
                <p className="mt-1 text-sm text-[#5B54C7]">Bandingkan spend dan revenue.</p>
                <a
                  href="#campaign"
                  className="mt-3 inline-block min-h-[44px] rounded-[10px] bg-[#5B54C7] px-4 py-3 text-sm font-semibold text-white"
                >
                  Buka tabel campaign
                </a>
              </div>
              <div className="rounded-[14px] border border-border bg-tile-mint p-4">
                <p className="font-semibold text-[#166534]">Cek profitabilitas</p>
                <p className="mt-1 text-sm text-[#166534]">Hitung break-even produk.</p>
                <a
                  href="#profitabilitas"
                  className="mt-3 inline-block min-h-[44px] rounded-[10px] bg-[#166534] px-4 py-3 text-sm font-semibold text-white"
                >
                  Buka kalkulator
                </a>
              </div>
              <div className="rounded-[14px] border border-border bg-tile-peach p-4">
                <p className="font-semibold text-[#92400E]">Kelola data</p>
                <p className="mt-1 text-sm text-[#92400E]">Kembali ke keadaan kosong.</p>
                <button
                  type="button"
                  onClick={() => {
                    setRows([]);
                    setErrors([]);
                    setFileName("");
                  }}
                  disabled={!hasData}
                  className="mt-3 min-h-[44px] rounded-[10px] bg-[#92400E] px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Hapus data
                </button>
              </div>
            </div>
          </section>

          <section id="campaign" aria-label="Campaign" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Campaign</h2>
            <p className="mt-1 text-sm text-muted"> Campaign mana yang menghabiskan budget dan menghasilkan order?</p>
            <div className="mt-3">
              {!hasData ? (
                <EmptyBox text="Belum ada campaign. Data campaign muncul setelah CSV diunggah." />
              ) : (
                <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted">
                        <th className="px-4 py-3 font-semibold">Campaign</th>
                        <th className="px-4 py-3 font-semibold">Spend</th>
                        <th className="px-4 py-3 font-semibold">Revenue</th>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCampaign.map((c) => (
                        <tr key={c.name} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">{c.name}</td>
                          <td className="tnum px-4 py-3">{formatIDR(c.total.spend)}</td>
                          <td className="tnum px-4 py-3">{formatIDR(c.total.revenue)}</td>
                          <td className="tnum px-4 py-3">{c.total.orders}</td>
                          <td className="tnum px-4 py-3">{calcRoas(c.total).toFixed(2)}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section id="produk" aria-label="Produk" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Produk</h2>
            <p className="mt-1 text-sm text-muted">Produk mana yang menghabiskan budget dan mana yang menghasilkan order?</p>
            <div className="mt-3">
              {!hasData ? (
                <EmptyBox text="Belum ada produk. Data produk muncul setelah CSV diunggah." />
              ) : (
                <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted">
                        <th className="px-4 py-3 font-semibold">Produk</th>
                        <th className="px-4 py-3 font-semibold">Spend</th>
                        <th className="px-4 py-3 font-semibold">Revenue</th>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">ROAS</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byProduct.map((p) => (
                        <tr key={p.code || p.name} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {p.name}
                            {p.code && <span className="block text-xs font-normal text-muted">Kode {p.code}</span>}
                          </td>
                          <td className="tnum px-4 py-3">{formatIDR(p.total.spend)}</td>
                          <td className="tnum px-4 py-3">{formatIDR(p.total.revenue)}</td>
                          <td className="tnum px-4 py-3">{p.total.orders}</td>
                          <td className="tnum px-4 py-3">{p.roas.toFixed(2)}x</td>
                          <td className="px-4 py-3 text-muted">{classLabel[p.cls]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section id="kompetitor" aria-label="Kompetitor" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Kompetitor</h2>
            <p className="mt-1 text-sm text-muted">Bandingkan produk Anda dengan kompetitor, lalu minta strategi judul dan deskripsi.</p>
            <Competitor products={byProduct.map((p) => ({ name: p.name, code: p.code, price: num(prices[p.code || p.name] ?? "") }))} />
          </section>

          <section id="katalog" aria-label="Katalog" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Katalog</h2>
            <p className="mt-1 text-sm text-muted">Isi harga dan HPP sekali. Semua fitur memakai data ini otomatis. Bila satu produk punya banyak varian, isi harga varian terlaris.</p>
            <div className="mt-3">
              {!hasData ? (
                <EmptyBox text="Katalog terisi otomatis dari Kode Produk setelah CSV diunggah." />
              ) : (
                <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted">
                        <th className="px-4 py-3 font-semibold">Produk</th>
                        <th className="px-4 py-3 font-semibold">Harga jual (Rp)</th>
                        <th className="px-4 py-3 font-semibold">HPP (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productTotals.map((p) => {
                        const key = p.code || p.name;
                        return (
                          <tr key={key} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium">
                              {p.name}
                              {p.code && <span className="block text-xs font-normal text-muted">Kode {p.code}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={prices[key] ?? ""}
                                onChange={(e) => setPrices((prev) => ({ ...prev, [key]: e.target.value }))}
                                inputMode="numeric"
                                placeholder="0"
                                aria-label={`Harga ${p.name}`}
                                className="min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={costs[key] ?? ""}
                                onChange={(e) => setCosts((prev) => ({ ...prev, [key]: e.target.value }))}
                                inputMode="numeric"
                                placeholder="0"
                                aria-label={`HPP ${p.name}`}
                                className="min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section id="funnel" aria-label="Funnel" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Funnel</h2>
            <p className="mt-1 text-sm text-muted">Di tahap mana calon pembeli berhenti?</p>
            <div className="mt-3">
              {!hasData ? (
                <EmptyBox text="Funnel butuh data impression, klik, dan order dari CSV." />
              ) : (
                <div className="rounded-[14px] border border-border bg-surface p-4">
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted">Impression ke Klik (CTR)</dt>
                      <dd className="tnum mt-1 text-xl font-bold">{(calcCtr(total) * 100).toFixed(2)} persen</dd>
                      <dd className="text-muted">{total.impressions} impression, {total.clicks} klik</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Klik ke Order (CVR)</dt>
                      <dd className="tnum mt-1 text-xl font-bold">{(calcCvr(total) * 100).toFixed(2)} persen</dd>
                      <dd className="text-muted">{total.clicks} klik, {total.orders} order</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Biaya per Order</dt>
                      <dd className="tnum mt-1 text-xl font-bold">{formatIDR(Math.round(calcCostPerOrder(total)))}</dd>
                      <dd className="text-muted">Spend {formatIDR(total.spend)}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </section>

          <section id="profitabilitas" aria-label="Profitabilitas" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Profitabilitas</h2>
            <p className="mt-1 text-sm text-muted">Berapa ROAS minimal agar iklan tidak merugikan?</p>
            <div className="mt-3 rounded-[14px] border border-border bg-surface p-4">
              <label className="block max-w-sm text-sm">
                <span className="font-medium">Produk yang dinilai</span>
                <select
                  value={profitSel}
                  onChange={(e) => {
                    setProfitSel(e.target.value);
                    setProfitTouched(false);
                  }}
                  className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                >
                  <option value="all">Semua produk digabung</option>
                  {productTotals.map((p) => (
                    <option key={p.code || p.name} value={p.code || p.name}>
                      {p.name.slice(0, 50)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Harga jual", effPrice, (v: string) => { setPrice(v); setProfitTouched(true); }],
                  ["HPP", effCost, (v: string) => { setCost(v); setProfitTouched(true); }],
                  ["Biaya marketplace", fee, setFee],
                  ["Biaya lain", other, setOther],
                ].map(([label, val, set]) => (
                  <label key={label as string} className="block text-sm">
                    <span className="font-medium">{label as string} (Rp)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={val as string}
                      onChange={(e) => (set as (v: string) => void)(e.target.value)}
                      placeholder="0"
                      className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm" aria-live="polite">
                Break-even ROAS:{" "}
                <strong className="tnum">{breakEven > 0 ? `${breakEven.toFixed(2)}x` : "belum bisa dihitung"}</strong>. {profitStatus}{" "}
                {profitEntry && `ROAS produk ini ${profitRoas.toFixed(2)}x.`}
              </p>
            </div>
          </section>

          <section aria-label="Performa harian">
            <h2 className="text-[15px] font-semibold">Berapa revenue harian pada periode ini?</h2>
            <div className="mt-3">
              {!hasData || byDay.length === 0 ? (
                <EmptyBox text="Grafik muncul setelah CSV dengan kolom tanggal diunggah." />
              ) : (
                <div className="rounded-[14px] border border-border bg-surface p-4">
                  <svg viewBox="0 0 600 220" role="img" aria-label={`Grafik revenue harian, tertinggi ${formatIDR(maxRevenue)}`} className="w-full">
                    <line x1="40" y1="190" x2="580" y2="190" stroke="#E8EAEF" strokeWidth="1" />
                    <line x1="40" y1="115" x2="580" y2="115" stroke="#E8EAEF" strokeWidth="1" />
                    <line x1="40" y1="40" x2="580" y2="40" stroke="#E8EAEF" strokeWidth="1" />
                    <polyline points={chartPoints} fill="none" stroke="#15803D" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    <text x="4" y="45" fontSize="11" fill="#6B7280">{formatIDR(maxRevenue)}</text>
                    <text x="4" y="193" fontSize="11" fill="#6B7280">0</text>
                    <text x="40" y="208" fontSize="11" fill="#6B7280">{byDay[0].date}</text>
                    <text x="580" y="208" fontSize="11" fill="#6B7280" textAnchor="end">{byDay[byDay.length - 1].date}</text>
                  </svg>
                </div>
              )}
            </div>
          </section>

          <section id="perhatian" aria-label="Perhatian" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Perhatian</h2>
            <p className="mt-1 text-sm text-muted">Campaign yang menghabiskan budget tanpa hasil sepadan.</p>
            <div className="mt-3 space-y-3">
              {!hasData ? (
                <EmptyBox text="Belum ada peringatan. Peringatan muncul setelah ada data." />
              ) : alerts.length === 0 ? (
                <EmptyBox text="Tidak ada pola pemborosan pada periode ini." />
              ) : (
                alerts.map((a) => (
                  <div key={a.name} className="rounded-[14px] border border-border bg-[#FFF1F2] p-4">
                    <p className="font-semibold text-[#9F1239]">{a.name}</p>
                    <p className="mt-1 text-sm text-[#9F1239]">{a.signal.reason} Spend {formatIDR(a.total.spend)}, {a.total.orders} order, ROAS {calcRoas(a.total).toFixed(2)}x.</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="strategi" aria-label="Strategi" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Strategi</h2>
            <p className="mt-1 text-sm text-muted">Vonis per campaign dari angka Anda, bukan teori umum.</p>
            {!hasData || !bottleneck ? (
              <div className="mt-3">
                <EmptyBox text="Unggah CSV agar strategi bisa dihitung dari data Anda." />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-[14px] border border-border bg-surface p-4">
                  <p className="font-semibold">{bottleneck.title}</p>
                  <p className="mt-1 text-sm text-muted">{bottleneck.detail}</p>
                </div>
                <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted">
                        <th className="px-4 py-3 font-semibold">Campaign</th>
                        <th className="px-4 py-3 font-semibold">ROAS</th>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Aksi</th>
                        <th className="px-4 py-3 font-semibold">Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionRows.map((a) => (
                        <tr key={a.name} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">{a.name}</td>
                          <td className="tnum px-4 py-3">{a.roas.toFixed(2)}x</td>
                          <td className="tnum px-4 py-3">{a.orders}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block min-h-[32px] rounded-full px-3 py-1 text-xs font-semibold ${toneClass[a.tone]}`}>
                              {a.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted">{a.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-[14px] border border-border bg-surface p-4">
                  <p className="font-semibold">Saran alokasi budget</p>
                  <p className="mt-1 text-sm text-muted">{allocationNote}</p>
                  <ul className="mt-3 space-y-3">
                    {allocation.map((a) => (
                      <li key={a.name} className="text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{a.name}</span>
                          <span className="tnum text-muted">kini {a.current.toFixed(0)} persen, saran {a.suggested.toFixed(0)} persen</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-background" role="img" aria-label={`${a.name}: kini ${a.current.toFixed(0)} persen, saran ${a.suggested.toFixed(0)} persen`}>
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(a.suggested)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          <section id="analyst" aria-label="AI Analyst" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">AI Analyst</h2>
            <p className="mt-1 text-sm text-muted">Tanya jawab berbasis angka di dashboard ini, bukan tebakan umum.</p>
            <div className="mt-3 rounded-[14px] border border-border bg-surface p-4">
              {!hasData ? (
                <EmptyBox text="Unggah CSV dulu agar analis punya angka untuk dibaca." />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {analystPresets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => askAnalyst(p)}
                        disabled={analystState === "loading"}
                        className="min-h-[44px] rounded-[10px] border border-border bg-background px-4 text-sm font-semibold disabled:opacity-40"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <form
                    className="mt-3 flex flex-col gap-2 sm:flex-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      askAnalyst(customQuestion);
                    }}
                  >
                    <input
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Tulis pertanyaan sendiri, contoh: apa penyebab CPC naik?"
                      aria-label="Pertanyaan untuk AI Analyst"
                      className="min-h-[44px] flex-1 rounded-[10px] border border-border bg-background px-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={analystState === "loading" || !customQuestion.trim()}
                      className="min-h-[44px] rounded-[10px] bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40"
                    >
                      Tanya
                    </button>
                  </form>
                  {analystState === "loading" && (
                    <p className="mt-3 text-sm text-muted" aria-live="polite">Menganalisis angka, mohon tunggu.</p>
                  )}
                  {analystState === "error" && (
                    <p className="mt-3 rounded-[10px] border border-border bg-background p-3 text-sm" role="alert">{analystError}</p>
                  )}
                  {analystState === "done" && (
                    <div className="mt-3 rounded-[10px] border border-border bg-background p-4 text-sm leading-6 whitespace-pre-line">{analystText}</div>
                  )}
                </>
              )}
            </div>
          </section>

          <section id="keputusan" aria-label="Catatan keputusan" className="scroll-mt-20">
            <h2 className="text-[15px] font-semibold">Catatan Keputusan</h2>
            <p className="mt-1 text-sm text-muted">Catat tindakan optimasi agar bisa dibandingkan hasilnya.</p>
            <form onSubmit={addDecision} className="mt-3 space-y-3 rounded-[14px] border border-border bg-surface p-4">
              <label className="block text-sm">
                <span className="font-medium">Tindakan</span>
                <input
                  value={decAction}
                  onChange={(e) => setDecAction(e.target.value)}
                  required
                  placeholder="Contoh: turunkan bid keyword X 10 persen"
                  className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Alasan</span>
                  <input
                    value={decReason}
                    onChange={(e) => setDecReason(e.target.value)}
                    placeholder="Contoh: CPC terlalu tinggi"
                    className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Hasil yang diharapkan</span>
                  <input
                    value={decExpected}
                    onChange={(e) => setDecExpected(e.target.value)}
                    placeholder="Contoh: ROAS naik"
                    className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                  />
                </label>
              </div>
              <button type="submit" className="min-h-[44px] rounded-[10px] bg-foreground px-4 text-sm font-semibold text-background">
                Simpan catatan
              </button>
            </form>
            <div className="mt-3 space-y-3">
              {decisions.length === 0 ? (
                <EmptyBox text="Belum ada catatan. Catatan tersimpan di browser ini." />
              ) : (
                decisions.map((d) => (
                  <div key={d.id} className="rounded-[14px] border border-border bg-surface p-4">
                    <p className="font-semibold">{d.action}</p>
                    <p className="mt-1 text-sm text-muted">
                      {d.date}
                      {d.reason ? `, alasan: ${d.reason}` : ""}
                      {d.expected ? `, harapan: ${d.expected}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDecisions((prev) => prev.filter((x) => x.id !== d.id))}
                      className="mt-2 min-h-[44px] rounded-[10px] border border-border px-4 text-sm font-semibold"
                    >
                      Hapus catatan
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
