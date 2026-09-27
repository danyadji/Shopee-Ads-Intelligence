export type RawMetric = {
  impressions: number;
  clicks: number;
  orders: number;
  spend: number;
  revenue: number;
};

export type ProfitInput = {
  revenue: number;
  productCost: number;
  marketplaceFee: number;
  adCost: number;
  otherCosts: number;
};

export function safeDivide(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

export function calcCtr(m: RawMetric): number {
  return safeDivide(m.clicks, m.impressions);
}

export function calcCpc(m: RawMetric): number {
  return safeDivide(m.spend, m.clicks);
}

export function calcCvr(m: RawMetric): number {
  return safeDivide(m.orders, m.clicks);
}

export function calcRoas(m: RawMetric): number {
  return safeDivide(m.revenue, m.spend);
}

export function calcCostPerOrder(m: RawMetric): number {
  return safeDivide(m.spend, m.orders);
}

export function calcGrossProfit(revenue: number, productCost: number): number {
  return revenue - productCost;
}

export function calcNetProfit(p: ProfitInput): number {
  return (
    p.revenue -
    p.productCost -
    p.marketplaceFee -
    p.adCost -
    p.otherCosts
  );
}

// Break-even ROAS = harga jual / margin tersedia per order.
// Mengembalikan 0 bila margin tidak valid agar pemanggil menampilkan status netral.
export function calcBreakEvenRoas(
  sellingPrice: number,
  productCost: number,
  marketplaceFee: number,
  otherCosts: number,
): number {
  const margin = sellingPrice - productCost - marketplaceFee - otherCosts;
  if (sellingPrice <= 0 || margin <= 0) return 0;
  return sellingPrice / margin;
}

export type ProductClass =
  | "scale"
  | "monitor"
  | "optimize"
  | "stop"
  | "need_data";

export function classifyProduct(
  roas: number,
  breakEvenRoas: number,
  orders: number,
  minOrders = 5,
): ProductClass {
  if (breakEvenRoas <= 0 || orders < minOrders) return "need_data";
  if (roas >= breakEvenRoas * 1.2) return "scale";
  if (roas >= breakEvenRoas) return "monitor";
  if (roas >= breakEvenRoas * 0.7) return "optimize";
  return "stop";
}

export type WastedSignal = {
  isWasted: boolean;
  reason: string;
};

export function detectWasted(
  m: RawMetric,
  breakEvenRoas: number,
  minSpend = 50000,
): WastedSignal {
  const roas = calcRoas(m);
  const cvr = calcCvr(m);
  if (m.spend < minSpend || m.orders === 0) {
    return {
      isWasted: m.spend >= minSpend && m.orders === 0,
      reason:
        m.spend >= minSpend && m.orders === 0
          ? "Spend melewati batas tetapi belum ada order."
          : "Data belum cukup untuk menilai.",
    };
  }
  if (breakEvenRoas > 0 && roas < breakEvenRoas * 0.7) {
    return {
      isWasted: true,
      reason: "ROAS jauh di bawah break-even produk.",
    };
  }
  if (m.clicks >= 50 && cvr < 0.005) {
    return {
      isWasted: true,
      reason: "Klik tinggi tetapi konversi sangat rendah.",
    };
  }
  return { isWasted: false, reason: "Belum ada pola pemborosan." };
}

export function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
