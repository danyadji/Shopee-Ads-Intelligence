"use client";

import { useState } from "react";
import { useAds } from "@/store/ads";
import { EmptyBox, SectionHead } from "@/components/ui";
import { calcRoas } from "@/lib/metrics";

const PRESETS = [
  "Kenapa ROAS saya turun?",
  "Campaign mana yang perlu saya perhatikan?",
  "Buatkan ringkasan performa periode ini.",
];

export default function AIPage() {
  const {
    hasData,
    byCampaign,
    total,
    roas,
    breakEven,
    period,
    decisions,
    addDecision,
    deleteDecision,
    windowSum,
  } = useAds();
  const [customQuestion, setCustomQuestion] = useState("");
  const [analystState, setAnalystState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [analystText, setAnalystText] = useState("");
  const [analystError, setAnalystError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [decAction, setDecAction] = useState("");
  const [decReason, setDecReason] = useState("");
  const [decExpected, setDecExpected] = useState("");

  async function askAnalyst(question: string) {
    const q = question.trim();
    if (!q || !hasData || analystState === "loading") return;
    setAnalystState("loading");
    setAnalystError("");
    setLastQuestion(q);
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

  function assess(dateStr: string): string {
    const b = windowSum(dateStr, -1);
    const a = windowSum(dateStr, 1);
    if (!b || !a || b.n === 0 || a.n === 0)
      return "Belum bisa dinilai, butuh CSV mencakup 7 hari sebelum dan sesudah tanggal catatan.";
    const rb = calcRoas(b.m);
    const ra = calcRoas(a.m);
    const head = `7 hari sebelum: ${b.m.orders} order, ROAS ${rb.toFixed(2)}x. 7 hari sesudah: ${a.m.orders} order, ROAS ${ra.toFixed(2)}x.`;
    if (a.m.orders > b.m.orders && ra >= rb) return `${head} Membaik setelah keputusan.`;
    if (a.m.orders < b.m.orders) return `${head} Menurun setelah keputusan.`;
    return `${head} Belum berubah.`;
  }

  return (
    <>
      <section aria-label="AI Analyst">
        <SectionHead title="AI Analyst" sub="Tanya jawab berbasis angka di dashboard ini, bukan tebakan umum." />
        <div className="mt-3 rounded-[14px] border border-border bg-surface p-4">
          {!hasData ? (
            <EmptyBox text="Unggah CSV dulu agar analis punya angka untuk dibaca." />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
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
                <>
                  <div className="mt-3 rounded-[10px] border border-border bg-background p-4 text-sm leading-6 whitespace-pre-line">{analystText}</div>
                  <button
                    type="button"
                    onClick={() =>
                      addDecision(lastQuestion || "Tindak lanjut AI Analyst", "Dari AI Analyst", analystText.slice(0, 300))
                    }
                    className="mt-2 min-h-[44px] rounded-[10px] border border-border px-4 text-sm font-semibold"
                  >
                    Jadikan keputusan
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <section id="keputusan" aria-label="Catatan keputusan" className="scroll-mt-20">
        <SectionHead title="Catatan Keputusan" sub="Catat tindakan optimasi agar bisa dibandingkan hasilnya." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addDecision(decAction, decReason, decExpected);
            setDecAction("");
            setDecReason("");
            setDecExpected("");
          }}
          className="mt-3 space-y-3 rounded-[14px] border border-border bg-surface p-4"
        >
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
                <p className="mt-2 rounded-[10px] bg-background p-3 text-sm" aria-live="polite">
                  <span className="font-semibold">Bukti hasil: </span>
                  {assess(d.date)}
                </p>
                <button
                  type="button"
                  onClick={() => deleteDecision(d.id)}
                  className="mt-2 min-h-[44px] rounded-[10px] border border-border px-4 text-sm font-semibold"
                >
                  Hapus catatan
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
