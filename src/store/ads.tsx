"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseAdsCsv, type AdsRow } from "@/lib/csv";
import {
  calcBreakEvenRoas,
  calcCpc,
  calcCtr,
  calcCvr,
  calcRoas,
  calcCostPerOrder,
  classifyProduct,
  detectWasted,
  type RawMetric,
} from "@/lib/metrics";
import { dayKey, sum } from "@/lib/aggregate";
import {
  loadDecisions,
  removeDecision,
  saveDecision,
  subscribeDecisions,
  type Decision,
} from "@/lib/decisions";

export type Period = "all" | "7" | "30";
export type ActionTone = "up" | "hold" | "down" | "stop" | "wait";
export type ActionItem = { title: string; why: string; href: string };

export const num = (v: string) => {
  const n = Number(v.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

type AdsContext = {
  rows: AdsRow[];
  errors: string[];
  fileName: string;
  parsing: boolean;
  period: Period;
  setPeriod: (p: Period) => void;
  uploadFile: (f: File | undefined) => void;
  clearData: () => void;
  prices: Record<string, string>;
  costs: Record<string, string>;
  setPriceFor: (k: string, v: string) => void;
  setCostFor: (k: string, v: string) => void;
  price: string;
  cost: string;
  fee: string;
  other: string;
  setPrice: (v: string) => void;
  setCost: (v: string) => void;
  setFee: (v: string) => void;
  setOther: (v: string) => void;
  profitSel: string;
  selectProfit: (v: string) => void;
  decisions: Decision[];
  addDecision: (a: string, r: string, e: string) => void;
  deleteDecision: (id: string) => void;
  filtered: AdsRow[];
  total: RawMetric;
  roas: number;
  ctr: number;
  cvr: number;
  hasData: boolean;
  byCampaign: { name: string; total: RawMetric }[];
  byDay: { date: string; revenue: number }[];
  productTotals: { name: string; code: string; total: RawMetric }[];
  breakEven: number;
  profitEntry: { name: string; code: string; total: RawMetric } | null;
  profitRoas: number;
  profitStatus: string;
  profitReady: boolean;
  effPrice: string;
  effCost: string;
  alerts: { name: string; total: RawMetric; reason: string }[];
  bottleneck: { title: string; detail: string } | null;
  actionRows: { name: string; roas: number; orders: number; action: string; reason: string; tone: ActionTone }[];
  allocation: { name: string; current: number; suggested: number }[];
  allocationNote: string;
  byProduct: { name: string; code: string; total: RawMetric; roas: number; cls: string }[];
  actionList: ActionItem[];
  windowSum: (dateStr: string, side: -1 | 1) => { m: RawMetric; n: number } | null;
};

const Ctx = createContext<AdsContext | null>(null);

export function useAds(): AdsContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAds di luar provider");
  return v;
}

function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<AdsRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [price, setPriceState] = useState("");
  const [cost, setCostState] = useState("");
  const [fee, setFee] = useState("");
  const [other, setOther] = useState("");
  const [profitSel, setProfitSel] = useState("all");
  const [profitTouched, setProfitTouched] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    const r = readJSON("shopee-rows");
    if (Array.isArray(r)) setRows(r as AdsRow[]);
    const p = readJSON("shopee-prices");
    if (p && typeof p === "object") setPrices(p as Record<string, string>);
    const c = readJSON("shopee-costs");
    if (c && typeof c === "object") setCosts(c as Record<string, string>);
    const f = readJSON("shopee-file");
    if (typeof f === "string") setFileName(f);
    setDecisions(loadDecisions());
    return subscribeDecisions(() => setDecisions(loadDecisions()));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("shopee-rows", JSON.stringify(rows));
      localStorage.setItem("shopee-prices", JSON.stringify(prices));
      localStorage.setItem("shopee-costs", JSON.stringify(costs));
      localStorage.setItem("shopee-file", JSON.stringify(fileName));
    } catch {
      // Penyimpanan penuh, data hanya bertahan sesi ini.
    }
  }, [rows, prices, costs, fileName]);

  function uploadFile(file: File | undefined) {
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

  function clearData() {
    setRows([]);
    setErrors([]);
    setFileName("");
  }

  function setPrice(v: string) {
    setPriceState(v);
    setProfitTouched(true);
  }

  function setCost(v: string) {
    setCostState(v);
    setProfitTouched(true);
  }

  function selectProfit(v: string) {
    setProfitSel(v);
    setProfitTouched(false);
  }

  function addDecision(action: string, reason: string, expected: string) {
    if (!action.trim()) return;
    saveDecision({
      id: `${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      action: action.trim(),
      reason: reason.trim(),
      expected: expected.trim(),
    });
    setDecisions(loadDecisions());
  }

  function deleteDecision(id: string) {
    removeDecision(id);
    setDecisions(loadDecisions());
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
  const ctr = calcCtr(total);
  const cvr = calcCvr(total);
  const hasData = rows.length > 0;

  const byCampaign = useMemo(() => {
    const map = new Map<string, AdsRow[]>();
    filtered.forEach((r) => {
      const list = map.get(r.campaign) ?? [];
      list.push(r);
      map.set(r.campaign, list);
    });
    return [...map.entries()].map(([name, list]) => ({ name, total: sum(list) }));
  }, [filtered]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      map.set(r.date, (map.get(r.date) ?? 0) + r.revenue);
    });
    return [...map.entries()]
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => dayKey(a.date) - dayKey(b.date));
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

  const profitEntry =
    profitSel === "all"
      ? null
      : (productTotals.find((p) => (p.code || p.name) === profitSel) ?? null);
  const profitTotal = profitEntry ? profitEntry.total : total;
  const profitRoas = calcRoas(profitTotal);
  const effPrice =
    !profitTouched && profitEntry
      ? prices[profitEntry.code] || prices[profitEntry.name] || ""
      : price;
  const effCost =
    !profitTouched && profitEntry
      ? costs[profitEntry.code] || costs[profitEntry.name] || ""
      : cost;
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
        .map((c) => ({ ...c, reason: detectWasted(c.total, breakEven).reason }))
        .filter((c) => detectWasted(c.total, breakEven).isWasted),
    [byCampaign, breakEven],
  );

  const byProduct = useMemo(
    () =>
      productTotals.map((e) => ({
        name: e.name,
        code: e.code,
        total: e.total,
        roas: calcRoas(e.total),
        cls: classifyProduct(calcRoas(e.total), breakEven, e.total.orders),
      })),
    [productTotals, breakEven],
  );

  const bottleneck: { title: string; detail: string } | null = !hasData
    ? null
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
            : profitReady && profitRoas < breakEven
              ? {
                  title: "Laku tapi merugi",
                  detail: `ROAS ${profitRoas.toFixed(2)}x di bawah break-even ${breakEven.toFixed(2)}x. Setiap rupiah iklan menggerus margin. Turunkan bid atau hentikan campaign terlemah.`,
                }
              : {
                  title: "Funnel sehat",
                  detail:
                    "Aliran impression ke order berjalan. Fokus ke campaign dengan ROAS tertinggi untuk skala bertahap.",
                };

  const actionRows = byCampaign.map((c) => {
    const r = calcRoas(c.total);
    if (c.total.orders === 0 && c.total.spend >= 50000)
      return { name: c.name, roas: r, orders: 0, action: "Hentikan sementara", reason: "Spend besar tanpa order.", tone: "stop" as const };
    if (c.total.clicks < 50)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Tunggu data", reason: "Klik belum cukup untuk dinilai.", tone: "wait" as const };
    if (breakEven > 0 && r >= breakEven * 1.2)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Naikkan budget", reason: "ROAS jauh di atas break-even.", tone: "up" as const };
    if (breakEven > 0 && r >= breakEven)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Pertahankan", reason: "ROAS mencapai break-even.", tone: "hold" as const };
    if (breakEven > 0)
      return { name: c.name, roas: r, orders: c.total.orders, action: r >= breakEven * 0.7 ? "Turunkan bid" : "Hentikan sementara", reason: "ROAS di bawah break-even.", tone: "down" as const };
    const avg = byCampaign.length > 0 ? byCampaign.reduce((a, x) => a + calcRoas(x.total), 0) / byCampaign.length : 0;
    if (r > avg && c.total.orders > 0)
      return { name: c.name, roas: r, orders: c.total.orders, action: "Prioritaskan", reason: "ROAS di atas rata-rata akun. Isi break-even untuk vonis pasti.", tone: "up" as const };
    return { name: c.name, roas: r, orders: c.total.orders, action: "Tahan dulu", reason: "Isi break-even di section Profitabilitas untuk vonis pasti.", tone: "wait" as const };
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

  const actionList: ActionItem[] = [];
  if (!hasData) {
    actionList.push({
      title: "Unggah CSV Iklan Shopee",
      why: "Semua analisis butuh data. Mulai dari file ekspor Anda.",
      href: "/",
    });
  } else {
    if (bottleneck && bottleneck.title !== "Funnel sehat") {
      actionList.push({
        title:
          bottleneck.title === "Diklik tapi tidak ada yang beli"
            ? "Perbaiki halaman produk dulu"
            : bottleneck.title,
        why: bottleneck.detail.split(".")[0] + ".",
        href:
          bottleneck.title === "Diklik tapi tidak ada yang beli"
            ? "/kompetitor"
            : "/analisis",
      });
    }
    actionRows
      .filter((a) => a.tone === "stop" || a.tone === "down")
      .slice(0, 3)
      .forEach((a) => {
        actionList.push({
          title: `${a.action}: ${a.name.slice(0, 45)}`,
          why: a.reason,
          href: "/analisis",
        });
      });
    if (breakEven <= 0) {
      actionList.push({
        title: "Isi harga dan HPP di Katalog",
        why: "Tanpa break-even, semua vonis berstatus relatif.",
        href: "/iklan",
      });
    }
    actionRows
      .filter((a) => a.tone === "up")
      .slice(0, 2)
      .forEach((a) => {
        actionList.push({
          title: `${a.action}: ${a.name.slice(0, 45)}`,
          why: a.reason,
          href: "/analisis",
        });
      });
    if (decisions.length === 0) {
      actionList.push({
        title: "Catat keputusan pertama",
        why: "Keputusan tercatat bisa dibandingkan hasilnya periode depan.",
        href: "/ai",
      });
    }
  }

  function windowSum(dateStr: string, side: -1 | 1) {
    const c = Date.parse(dateStr);
    if (Number.isNaN(c)) return null;
    const list = rows.filter((r) => {
      const t = dayKey(r.date);
      if (t <= 0) return false;
      return side < 0
        ? t < c && t >= c - 7 * 86400000
        : t > c && t <= c + 7 * 86400000;
    });
    return { m: sum(list), n: list.length };
  }

  const value: AdsContext = {
    rows,
    errors,
    fileName,
    parsing,
    period,
    setPeriod,
    uploadFile,
    clearData,
    prices,
    costs,
    setPriceFor: (k, v) => setPrices((p) => ({ ...p, [k]: v })),
    setCostFor: (k, v) => setCosts((p) => ({ ...p, [k]: v })),
    price,
    cost,
    fee,
    other,
    setPrice,
    setCost,
    setFee,
    setOther,
    profitSel,
    selectProfit,
    decisions,
    addDecision,
    deleteDecision,
    filtered,
    total,
    roas,
    ctr,
    cvr,
    hasData,
    byCampaign,
    byDay,
    productTotals,
    breakEven,
    profitEntry,
    profitRoas,
    profitStatus,
    profitReady,
    effPrice,
    effCost,
    alerts,
    bottleneck,
    actionRows,
    allocation,
    allocationNote,
    byProduct,
    actionList,
    windowSum,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
