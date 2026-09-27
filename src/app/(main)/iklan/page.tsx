"use client";

import { useAds } from "@/store/ads";
import { EmptyBox, SectionHead } from "@/components/ui";
import { calcCpc, calcCtr, calcCvr, calcRoas, calcCostPerOrder, formatIDR } from "@/lib/metrics";

const classLabel: Record<string, string> = {
  scale: "Layak skala",
  monitor: "Pantau",
  optimize: "Optimasi",
  stop: "Kandidat henti",
  need_data: "Data belum cukup",
};

export default function IklanPage() {
  const { hasData, byCampaign, byProduct, productTotals, total, prices, costs, setPriceFor, setCostFor } = useAds();

  return (
    <>
      <section aria-label="Campaign">
        <SectionHead title="Campaign" sub="Campaign mana yang menghabiskan budget dan menghasilkan order?" />
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
        <SectionHead title="Produk" sub="Produk mana yang menghabiskan budget dan mana yang menghasilkan order?" />
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

      <section id="katalog" aria-label="Katalog" className="scroll-mt-20">
        <SectionHead title="Katalog" sub="Isi harga dan HPP sekali. Semua fitur memakai data ini otomatis. Bila satu produk punya banyak varian, isi harga varian terlaris." />
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
                            onChange={(e) => setPriceFor(key, e.target.value)}
                            inputMode="numeric"
                            placeholder="0"
                            aria-label={`Harga ${p.name}`}
                            className="min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={costs[key] ?? ""}
                            onChange={(e) => setCostFor(key, e.target.value)}
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
        <SectionHead title="Funnel" sub="Di tahap mana calon pembeli berhenti?" />
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
                  <dd className="text-muted">CPC {formatIDR(Math.round(calcCpc(total)))}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
