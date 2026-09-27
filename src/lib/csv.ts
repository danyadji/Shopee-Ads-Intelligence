import Papa from "papaparse";
import { z } from "zod";

export const adsRowSchema = z.object({
  date: z.string().min(1),
  campaign: z.string().min(1),
  product: z.string().default(""),
  impressions: z.coerce.number().min(0),
  clicks: z.coerce.number().min(0),
  orders: z.coerce.number().min(0),
  spend: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0),
});

export type AdsRow = z.infer<typeof adsRowSchema>;

export type ParseResult = {
  rows: AdsRow[];
  errors: string[];
};

// Kolom ekspor Shopee dipetakan ke skema internal.
// Ekspor Shopee adalah rekap per iklan, tanggal diambil dari Tanggal Mulai.
const SHOPEE_COLUMNS: Record<string, string[]> = {
  date: ["Tanggal Mulai", "Tanggal"],
  campaign: ["Nama Iklan"],
  product: ["Kode Produk", "Produk"],
  impressions: ["Dilihat"],
  clicks: ["Jumlah Klik"],
  orders: ["Konversi", "Produk Terjual"],
  spend: ["Biaya"],
  revenue: ["Omzet Penjualan"],
};

// Angka Shopee campuran: ribuan 5.200, desimal 4.93 persen dan 0.00,
// koma desimal 2,69, kosong berupa -.
function sanitizeNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  let s = String(raw ?? "").trim();
  if (s === "" || s === "-") return 0;
  s = s.replace(/rp\.?/gi, "").replace(/\s/g, "").replace("%", "");
  if (s.includes(",")) {
    const [int, dec] = s.split(",");
    s = `${int.replace(/\./g, "")}.${dec ?? ""}`;
  } else if (!/^\d+\.\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  return Number(s);
}

// 01-09-2026 atau 01/09/2026 menjadi 2026-09-01.
function normalizeDate(s: string): string {
  const m = s.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s.trim();
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i >= 0) return headers[i];
  }
  return undefined;
}

export function parseAdsCsv(text: string): ParseResult {
  // File ekspor Shopee diawali baris metadata, header asli dicari dulu.
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerIndex = lines.findIndex((l) =>
    l.toLowerCase().includes("nama iklan"),
  );
  const body = (headerIndex > 0 ? lines.slice(headerIndex) : lines).join("\n");
  const parsed = Papa.parse<Record<string, unknown>>(body, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
  });
  const rows: AdsRow[] = [];
  const errors: string[] = [];
  const headers = parsed.meta.fields ?? [];

  const isShopee = headers.some(
    (h) => h.trim().toLowerCase() === "nama iklan",
  );

  if (!isShopee) {
    parsed.data.forEach((raw, i) => {
      const result = adsRowSchema.safeParse(raw);
      if (result.success) {
        rows.push(result.data);
      } else {
        errors.push(`Baris ${i + 2}: data tidak valid.`);
      }
    });
    return { rows, errors };
  }

  const mapped = {
    date: findColumn(headers, SHOPEE_COLUMNS.date),
    campaign: findColumn(headers, SHOPEE_COLUMNS.campaign),
    product: findColumn(headers, SHOPEE_COLUMNS.product),
    impressions: findColumn(headers, SHOPEE_COLUMNS.impressions),
    clicks: findColumn(headers, SHOPEE_COLUMNS.clicks),
    orders: findColumn(headers, SHOPEE_COLUMNS.orders),
    spend: findColumn(headers, SHOPEE_COLUMNS.spend),
    revenue: findColumn(headers, SHOPEE_COLUMNS.revenue),
  };

  const missing = Object.entries(mapped)
    .filter(([k, v]) => !v && k !== "product")
    .map(([k]) => k);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        `Kolom tidak lengkap: ${missing.join(", ")}. Pastikan file adalah ekspor Iklan Shopee.`,
      ],
    };
  }

  parsed.data.forEach((raw, i) => {
    const line = i + 2;
    const campaign = String(raw[mapped.campaign!] ?? "").trim();
    // Baris ringkasan Total di kaki file ekspor dilewati tanpa error.
    if (campaign === "" || campaign.toLowerCase() === "total") return;
    const normalized = {
      date: normalizeDate(String(raw[mapped.date!] ?? "")),
      campaign,
      product: mapped.product ? String(raw[mapped.product] ?? "").trim() : "",
      impressions: sanitizeNumber(raw[mapped.impressions!]),
      clicks: sanitizeNumber(raw[mapped.clicks!]),
      orders: sanitizeNumber(raw[mapped.orders!]),
      spend: sanitizeNumber(raw[mapped.spend!]),
      revenue: sanitizeNumber(raw[mapped.revenue!]),
    };
    const result = adsRowSchema.safeParse(normalized);
    if (result.success) {
      rows.push(result.data);
    } else {
      const fields = result.error.issues.map((issue) => String(issue.path[0])).join(", ");
      errors.push(`Baris ${line}: kolom bermasalah (${fields}).`);
    }
  });

  return { rows, errors };
}
