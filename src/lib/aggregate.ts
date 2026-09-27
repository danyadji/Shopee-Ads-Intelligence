import type { AdsRow } from "@/lib/csv";
import type { RawMetric } from "@/lib/metrics";

export function sum(rows: AdsRow[]): RawMetric {
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

export function dayKey(date: string): number {
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}
