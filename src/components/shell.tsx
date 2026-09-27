"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const GROUPS = [
  {
    label: "Dashboard",
    items: [
      { href: "/", label: "Ringkasan" },
      { href: "/#aksi", label: "Kerjakan berurutan" },
    ],
  },
  {
    label: "Iklan",
    items: [
      { href: "/iklan", label: "Campaign" },
      { href: "/iklan#produk", label: "Produk" },
      { href: "/iklan#katalog", label: "Katalog" },
      { href: "/iklan#funnel", label: "Funnel" },
    ],
  },
  {
    label: "Analisis",
    items: [
      { href: "/analisis", label: "Profitabilitas" },
      { href: "/analisis#perhatian", label: "Perhatian" },
      { href: "/analisis#strategi", label: "Strategi" },
    ],
  },
  {
    label: "Kompetitor",
    items: [{ href: "/kompetitor", label: "Banding dan strategi" }],
  },
  {
    label: "AI dan Keputusan",
    items: [
      { href: "/ai", label: "AI Analyst" },
      { href: "/ai#keputusan", label: "Catatan Keputusan" },
    ],
  },
];

export default function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const nav = (
    <ul className="space-y-1">
      {GROUPS.map((g, gi) => {
        const active = g.items.some((i) => i.href.split("#")[0] === pathname);
        return (
          <li key={g.label}>
            <details open={gi === 0 || active}>
              <summary className="flex min-h-[44px] cursor-pointer items-center rounded-[10px] px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted hover:bg-background">
                {g.label}
              </summary>
              <ul className="mt-1 space-y-1">
                {g.items.map((n) => {
                  const on = n.href.split("#")[0] === pathname;
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={on ? "page" : undefined}
                        className={`block min-h-[44px] rounded-[10px] px-3 py-3 text-sm font-medium hover:bg-background focus-visible:outline-2 ${
                          on ? "bg-background text-foreground" : "text-foreground"
                        }`}
                      >
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-surface focus:px-4 focus:py-2"
      >
        Lewati ke konten
      </a>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-border bg-surface p-4 lg:block">
        <p className="px-3 text-lg font-bold">Shopee Ads</p>
        <p className="mb-4 px-3 text-xs text-muted">Intelligence</p>
        <nav aria-label="Navigasi utama">{nav}</nav>
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
              <p className="text-sm text-muted">Ringkasan campaign dan penjualan</p>
            </div>
          </div>
          {menuOpen && (
            <nav id="menu-hp" aria-label="Navigasi utama" className="border-t border-border px-4 py-3 lg:hidden">
              {nav}
            </nav>
          )}
        </header>
        <main id="konten" className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
