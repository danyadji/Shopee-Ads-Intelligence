"use client";

import Link from "next/link";
import { useRef } from "react";
import { useAds, type Period } from "@/store/ads";
import { EmptyBox, SectionHead, StatCard } from "@/components/ui";
import { calcCpc, calcCtr, calcRoas, formatIDR } from "@/lib/metrics";

function HomeInner() {
  const {
    hasData,
    filtered,
    total,
    roas,
    fileName,
    parsing,
    errors,
    period,
    setPeriod,
    uploadFile,
    clearData,
    breakEven,
    profitStatus,
    actionList,
  } = useAds();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <section aria-label="Ringkasan">
        <div className="flex flex-wrap items-center gap-2">
          <SectionHead title="Ringkasan" sub="Kondisi iklan Anda sekarang." />
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

      <section id="aksi" aria-label="Aksi" className="scroll-mt-20">
        <SectionHead title="Kerjakan berurutan" sub="Nomor kecil dikerjakan dulu. Daftar ini dihitung ulang dari data Anda." />
        <ol className="mt-3 space-y-2">
          {actionList.map((a, i) => (
            <li key={`${i}-${a.title}`} className="flex items-start gap-3 rounded-[14px] border border-border bg-surface p-4">
              <span className="tnum flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full bg-foreground text-sm font-bold text-background" aria-hidden="true">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted">{a.why}</p>
              </div>
              <Link
                href={a.href}
                className="flex min-h-[44px] shrink-0 items-center rounded-[10px] border border-border px-4 text-sm font-semibold"
              >
                Buka
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Aksi cepat">
        <SectionHead title="Aksi cepat" sub="Mulai dari file atau telusuri hasil." />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[14px] border border-border bg-tile-blue p-4">
            <p className="font-semibold text-[#1D4ED8]">Unggah CSV</p>
            <p className="mt-1 text-sm text-[#1D4ED8]">File ekspor Iklan Shopee, langsung tanpa diubah.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => uploadFile(e.target.files?.[0])}
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
            <Link
              href="/iklan"
              className="mt-3 inline-block min-h-[44px] rounded-[10px] bg-[#5B54C7] px-4 py-3 text-sm font-semibold text-white"
            >
              Buka halaman Iklan
            </Link>
          </div>
          <div className="rounded-[14px] border border-border bg-tile-mint p-4">
            <p className="font-semibold text-[#166534]">Cek profitabilitas</p>
            <p className="mt-1 text-sm text-[#166534]">Hitung break-even produk.</p>
            <Link
              href="/analisis"
              className="mt-3 inline-block min-h-[44px] rounded-[10px] bg-[#166534] px-4 py-3 text-sm font-semibold text-white"
            >
              Buka halaman Analisis
            </Link>
          </div>
          <div className="rounded-[14px] border border-border bg-tile-peach p-4">
            <p className="font-semibold text-[#92400E]">Kelola data</p>
            <p className="mt-1 text-sm text-[#92400E]">Kembali ke keadaan kosong.</p>
            <button
              type="button"
              onClick={clearData}
              disabled={!hasData}
              className="mt-3 min-h-[44px] rounded-[10px] bg-[#92400E] px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Hapus data
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return <HomeInner />;
}
