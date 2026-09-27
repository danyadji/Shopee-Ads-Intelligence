"use client";

import { useAds } from "@/store/ads";
import { EmptyBox, SectionHead } from "@/components/ui";
import { calcRoas, formatIDR } from "@/lib/metrics";

const toneClass: Record<string, string> = {
  up: "bg-[#166534] text-white",
  hold: "bg-[#1D4ED8] text-white",
  down: "bg-[#92400E] text-white",
  stop: "bg-[#9F1239] text-white",
  wait: "border border-border bg-background text-foreground",
};

export default function AnalisisPage() {
  const {
    hasData,
    byDay,
    productTotals,
    profitSel,
    selectProfit,
    effPrice,
    effCost,
    fee,
    other,
    setPrice,
    setCost,
    setFee,
    setOther,
    breakEven,
    profitRoas,
    profitStatus,
    profitEntry,
    alerts,
    bottleneck,
    actionRows,
    allocation,
    allocationNote,
  } = useAds();

  const maxRevenue = Math.max(1, ...byDay.map((d) => d.revenue));
  const chartPoints = byDay
    .map((d, i) => {
      const x = byDay.length === 1 ? 300 : 40 + (i * 520) / (byDay.length - 1);
      const y = 190 - (d.revenue / maxRevenue) * 150;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <>
      <section aria-label="Profitabilitas">
        <SectionHead title="Profitabilitas" sub="Berapa ROAS minimal agar iklan tidak merugikan?" />
        <div className="mt-3 rounded-[14px] border border-border bg-surface p-4">
          <label className="block max-w-sm text-sm">
            <span className="font-medium">Produk yang dinilai</span>
            <select
              value={profitSel}
              onChange={(e) => selectProfit(e.target.value)}
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
            {(
              [
                ["Harga jual", effPrice, setPrice],
                ["HPP", effCost, setCost],
                ["Biaya marketplace", fee, setFee],
                ["Biaya lain", other, setOther],
              ] as [string, string, (v: string) => void][]
            ).map(([label, val, set]) => (
              <label key={label} className="block text-sm">
                <span className="font-medium">{label} (Rp)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={val}
                  onChange={(e) => set(e.target.value)}
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
        <SectionHead title="Berapa revenue harian pada periode ini?" sub="" />
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
        <SectionHead title="Perhatian" sub="Campaign yang menghabiskan budget tanpa hasil sepadan." />
        <div className="mt-3 space-y-3">
          {!hasData ? (
            <EmptyBox text="Belum ada peringatan. Peringatan muncul setelah ada data." />
          ) : alerts.length === 0 ? (
            <EmptyBox text="Tidak ada pola pemborosan pada periode ini." />
          ) : (
            alerts.map((a) => (
              <div key={a.name} className="rounded-[14px] border border-border bg-[#FFF1F2] p-4">
                <p className="font-semibold text-[#9F1239]">{a.name}</p>
                <p className="mt-1 text-sm text-[#9F1239]">{a.reason} Spend {formatIDR(a.total.spend)}, {a.total.orders} order, ROAS {calcRoas(a.total).toFixed(2)}x.</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section id="strategi" aria-label="Strategi" className="scroll-mt-20">
        <SectionHead title="Strategi" sub="Vonis per campaign dari angka Anda, bukan teori umum." />
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
    </>
  );
}
