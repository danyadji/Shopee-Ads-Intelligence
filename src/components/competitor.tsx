"use client";

import { useEffect, useMemo, useState } from "react";
import { formatIDR } from "@/lib/metrics";

export type OwnProduct = { name: string; code: string; price: number };

type Entry = {
  id: string;
  title: string;
  price: number;
  sold: number;
  rating: number;
};

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function EmptyBox({ text }: { text: string }) {
  return (
    <p className="rounded-[10px] border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
      {text}
    </p>
  );
}

export default function Competitor({ products }: { products: OwnProduct[] }) {
  const [mineTitle, setMineTitle] = useState("");
  const [minePrice, setMinePrice] = useState("");
  const [mineSold, setMineSold] = useState("");
  const [mineRating, setMineRating] = useState("");
  const [items, setItems] = useState<Entry[]>([]);
  const [fTitle, setFTitle] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fSold, setFSold] = useState("");
  const [fRating, setFRating] = useState("");
  const [question, setQuestion] = useState(
    "Bandingkan produk saya dengan kompetitor dan beri strategi judul serta deskripsi.",
  );
  const [state, setState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [paste, setPaste] = useState("");
  const [inboxNote, setInboxNote] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("shopee-competitors");
      if (raw) {
        const list = JSON.parse(raw) as Entry[];
        const seen = new Set<string>();
        setItems(
          list.filter((e) => {
            const id = e.id || e.title;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          }),
        );
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("shopee-competitors", JSON.stringify(items));
    } catch {
      // Penyimpanan diblokir, data hanya bertahan sesi ini.
    }
  }, [items]);

  const mine = {
    title: mineTitle.trim(),
    price: num(minePrice),
    sold: num(mineSold),
    rating: Math.min(5, num(mineRating)),
  };
  const ready = mine.title !== "" && items.length > 0;

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        title: fTitle.trim(),
        price: num(fPrice),
        sold: num(fSold),
        rating: Math.min(5, num(fRating)),
      },
    ]);
    setFTitle("");
    setFPrice("");
    setFSold("");
    setFRating("");
  }

  async function pullFromInbox() {
    setInboxNote("Mengambil...");
    try {
      const res = await fetch("/api/inbox");
      const json = (await res.json()) as {
        items?: { data: { title: string; price: number; sold: number; rating: number } }[];
      };
      const seen = new Set(items.map((x) => x.title));
      const incoming = (json.items ?? []).filter(
        (it) => it.data && !seen.has(it.data.title) && (seen.add(it.data.title), true),
      );
      if (incoming.length === 0) {
        setInboxNote("Tidak ada data baru dari extension.");
        return;
      }
      setItems((prev) => [
        ...prev,
        ...incoming.map((it) => ({ id: uid(), ...it.data })),
      ]);
      setInboxNote(`${incoming.length} produk masuk dari extension.`);
    } catch {
      setInboxNote("Inbox tidak terjangkau.");
    }
  }

  function importPaste() {
    try {
      const raw = JSON.parse(paste) as
        | { title: string; price: number; sold: number; rating: number }
        | { title: string; price: number; sold: number; rating: number }[];
      const list = Array.isArray(raw) ? raw : [raw];
      const seen = new Set(items.map((x) => x.title));
      const valid = list.filter(
        (e) =>
          e &&
          typeof e.title === "string" &&
          e.title.trim() !== "" &&
          !seen.has(e.title.trim()) &&
          (seen.add(e.title.trim()), true),
      );
      if (valid.length === 0) {
        setInboxNote("Tempelan tidak memuat produk yang valid.");
        return;
      }
      setItems((prev) => [
        ...prev,
        ...valid.map((e) => ({
          id: uid(),
          title: e.title.trim().slice(0, 200),
          price: e.price >= 0 ? e.price : 0,
          sold: e.sold >= 0 ? e.sold : 0,
          rating: Math.min(5, Math.max(0, e.rating || 0)),
        })),
      ]);
      setPaste("");
      setInboxNote(`${valid.length} produk masuk dari tempelan.`);
    } catch {
      setInboxNote("Format tempelan salah. Harus JSON dari tombol Salin extension.");
    }
  }

  async function ask() {
    if (!ready || state === "loading") return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "competitor",
          question: question.trim() || "Beri strategi untuk produk saya.",
          mine,
          competitors: items.slice(0, 5).map(({ title, price, sold, rating }) => ({
            title,
            price,
            sold,
            rating,
          })),
        }),
      });
      const json = (await res.json()) as { analysis?: string; error?: string };
      if (!res.ok || !json.analysis) {
        setError(json.error ?? "Strategi gagal dibuat, coba lagi.");
        setState("error");
        return;
      }
      setText(json.analysis);
      setState("done");
    } catch {
      setError("Strategi gagal dibuat. Periksa koneksi, lalu coba lagi.");
      setState("error");
    }
  }

  const visibleItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((e) => {
      const id = e.id || e.title;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [items]);

  const all = [mine.title ? { ...mine, label: "Produk saya" } : null, ...visibleItems.map((i) => ({ ...i, label: i.title }))].filter(    (x): x is { title: string; price: number; sold: number; rating: number; label: string } => x !== null,
  );
  const minPrice = Math.min(...all.map((a) => a.price));
  const maxSold = Math.max(...all.map((a) => a.sold));

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-[14px] border border-border bg-surface p-4">
        <p className="font-semibold">Produk saya</p>
        {products.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Pilih dari CSV">
            {products.map((p) => (
              <button
                key={p.code || p.name}
                type="button"
                onClick={() => {
                  setMineTitle(p.name);
                  if (p.price > 0) setMinePrice(String(p.price));
                }}
                className="min-h-[44px] rounded-[10px] border border-border bg-background px-3 text-xs font-semibold"
              >
                {p.name.slice(0, 40)}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Judul produk</span>
            <input
              value={mineTitle}
              onChange={(e) => setMineTitle(e.target.value)}
              placeholder="Judul sesuai di Shopee"
              className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
            />
          </label>
          {[
            ["Harga (Rp)", minePrice, setMinePrice],
            ["Terjual per bulan", mineSold, setMineSold],
            ["Rating (0-5)", mineRating, setMineRating],
          ].map(([label, val, set]) => (
            <label key={label as string} className="block text-sm">
              <span className="font-medium">{label as string}</span>
              <input
                value={val as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-4">
        <p className="font-semibold">Kompetitor ({items.length})</p>
        <p className="mt-1 text-sm text-muted">Dari extension, tempelan, atau ketik manual.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pullFromInbox}
            className="min-h-[44px] rounded-[10px] border border-border bg-background px-4 text-sm font-semibold"
          >
            Ambil dari extension
          </button>
        </div>
        {inboxNote && <p className="mt-2 text-sm text-muted" aria-live="polite">{inboxNote}</p>}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold">Tempel JSON dari extension</summary>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={3}
            placeholder='{"title":"...","price":0,"sold":0,"rating":0}'
            className="mt-2 w-full rounded-[10px] border border-border bg-background p-3 font-mono text-xs"
          />
          <button
            type="button"
            onClick={importPaste}
            className="mt-2 min-h-[44px] rounded-[10px] border border-border bg-background px-4 text-sm font-semibold"
          >
            Impor tempelan
          </button>
        </details>
        <form onSubmit={addItem} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Judul produk kompetitor</span>
            <input
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              required
              placeholder="Tempel judul kompetitor"
              className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
            />
          </label>
          {[
            ["Harga (Rp)", fPrice, setFPrice],
            ["Terjual per bulan", fSold, setFSold],
            ["Rating (0-5)", fRating, setFRating],
          ].map(([label, val, set]) => (
            <label key={label as string} className="block text-sm">
              <span className="font-medium">{label as string}</span>
              <input
                value={val as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" className="min-h-[44px] rounded-[10px] bg-foreground px-4 text-sm font-semibold text-background">
              Tambah kompetitor
            </button>
          </div>
        </form>
        {items.length > 0 && (
          <ul className="mt-3 space-y-2">
            {visibleItems.map((i) => (
              <li key={i.id} className="flex items-center gap-2 rounded-[10px] border border-border bg-background p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.title}</p>
                  <p className="text-muted">{formatIDR(i.price)}, terjual {i.sold}, rating {i.rating}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                  className="min-h-[44px] shrink-0 rounded-[10px] border border-border px-4 font-semibold"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {ready ? (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-4 py-3 font-semibold">Metrik</th>
                <th className="px-4 py-3 font-semibold">Produk saya</th>
                {visibleItems.map((i) => (
                  <th key={i.id} className="px-4 py-3 font-semibold">{i.title.slice(0, 30)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">Harga</td>
                <td className="tnum px-4 py-3">{formatIDR(mine.price)}{mine.price === minPrice && " (termurah)"}</td>
                {visibleItems.map((i) => (
                  <td key={i.id} className="tnum px-4 py-3">{formatIDR(i.price)}{i.price === minPrice && " (termurah)"}</td>
                ))}
              </tr>
              <tr className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">Terjual</td>
                <td className="tnum px-4 py-3">{mine.sold}{mine.sold === maxSold && maxSold > 0 && " (terlaris)"}</td>
                {visibleItems.map((i) => (
                  <td key={i.id} className="tnum px-4 py-3">{i.sold}{i.sold === maxSold && maxSold > 0 && " (terlaris)"}</td>
                ))}
              </tr>
              <tr className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">Rating</td>
                <td className="tnum px-4 py-3">{mine.rating}</td>
                {visibleItems.map((i) => (
                  <td key={i.id} className="tnum px-4 py-3">{i.rating}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyBox text="Isi produk saya dan tambah minimal 1 kompetitor untuk melihat perbandingan." />
      )}

      <div className="rounded-[14px] border border-border bg-surface p-4">
        <p className="font-semibold">Strategi AI</p>
        <label className="mt-2 block text-sm">
          <span className="font-medium">Minta secara spesifik</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-[10px] border border-border bg-background px-3"
          />
        </label>
        <button
          type="button"
          onClick={ask}
          disabled={!ready || state === "loading"}
          className="mt-3 min-h-[44px] rounded-[10px] bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40"
        >
          Buat strategi
        </button>
        {!ready && <p className="mt-2 text-sm text-muted">Tombol aktif setelah produk dan kompetitor terisi.</p>}
        {items.length > 5 && <p className="mt-2 text-sm text-muted">AI memakai 5 kompetitor pertama.</p>}
        {state === "loading" && <p className="mt-3 text-sm text-muted" aria-live="polite">Menyusun strategi, mohon tunggu.</p>}
        {state === "error" && <p className="mt-3 rounded-[10px] border border-border bg-background p-3 text-sm" role="alert">{error}</p>}
        {state === "done" && <div className="mt-3 rounded-[10px] border border-border bg-background p-4 text-sm leading-6 whitespace-pre-line">{text}</div>}
      </div>
    </div>
  );
}
