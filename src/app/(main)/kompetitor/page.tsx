"use client";

import Competitor from "@/components/competitor";
import { SectionHead } from "@/components/ui";
import { num, useAds } from "@/store/ads";

export default function KompetitorPage() {
  const { byProduct, prices } = useAds();
  return (
    <section aria-label="Kompetitor">
      <SectionHead title="Kompetitor" sub="Bandingkan produk Anda dengan kompetitor, lalu minta strategi judul dan deskripsi." />
      <Competitor
        products={byProduct.map((p) => ({
          name: p.name,
          code: p.code,
          price: num(prices[p.code || p.name] ?? ""),
        }))}
      />
    </section>
  );
}
