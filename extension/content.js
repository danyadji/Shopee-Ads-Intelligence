(() => {
  const num = (v) => {
    if (typeof v === "number") return v;
    let s = String(v ?? "").trim();
    if (!s || s === "-") return 0;
    let mult = 1;
    const m = s.match(/([\d.,]+)\s*(RB|JT|ribu|juta)/i);
    if (m) {
      s = m[1];
      mult = /JT|juta/i.test(m[2]) ? 1000000 : 1000;
    }
    s = s.replace(/rp\.?/gi, "").replace(/\s/g, "").replace("%", "");
    if (s.includes(",")) {
      const [i, d] = s.split(",");
      s = `${i.replace(/\./g, "")}.${d ?? ""}`;
    } else if (!/^\d+\.\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    const n = Number(s) * mult;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const cleanTitle = (t) => {
    let s = String(t ?? "").trim();
    s = s.replace(/^Jual\s+/i, "").replace(/\s*\|\s*Shopee Indonesia\s*$/i, "");
    return s.trim();
  };

  const firstPrice = () => {
    const meta = document.querySelector('meta[property="og:price:amount"]');
    if (meta && meta.content) return num(meta.content);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const m = node.textContent.match(/Rp\s?[\d.]+/);
      if (m) {
        const v = num(m[0]);
        if (v > 0) return v;
      }
      node = walker.nextNode();
    }
    return 0;
  };

  const findSold = () => {
    const body = document.body.innerText || "";
    const m = body.match(/([\d.,]+\s*(?:RB|JT|ribu|juta)?)\s*[Tt]erjual/);
    return m ? num(m[1]) : 0;
  };

  const findRating = () => {
    const body = document.body.innerText || "";
    const m = body.match(/(\d[,.]\d)\s*\/\s*5/) || body.match(/Penilaian[^\d]*(\d[,.]\d)/);
    if (!m) return 0;
    const v = Number(m[1].replace(",", "."));
    return v >= 0 && v <= 5 ? v : 0;
  };

  const extractProduct = () => {
    const meta = document.querySelector('meta[property="og:title"]');
    let title = meta && meta.content ? cleanTitle(meta.content) : "";
    if (!title) {
      const h = document.querySelector("h1");
      title = h ? h.innerText.trim() : cleanTitle(document.title);
    }
    return {
      title,
      price: firstPrice(),
      sold: findSold(),
      rating: findRating(),
      url: location.href,
    };
  };

  const extractSearch = () => {
    const out = [];
    const seen = new Set();
    const push = (title, price, sold, url) => {
      title = String(title || "").slice(0, 200).trim();
      if (!title) return;
      const key = url || title;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ title, price, sold, rating: 0, url: url || location.href });
    };
    const titleOf = (text) =>
      String(text || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 10 &&
            !/^Rp/i.test(s) &&
            !/terjual/i.test(s) &&
            !/^\d+\s*\/\s*5/.test(s) &&
            !/diskon|promo|star|^\d+%|^ad$/i.test(s),
        )
        .sort((x, y) => y.length - x.length)[0] || "";
    // Strategi A: link produk langsung.
    document.querySelectorAll('a[href*="-i."]').forEach((a) => {
      const t = a.innerText || "";
      if (!/terjual/i.test(t)) return;
      const priceM = t.match(/Rp\s?([\d.]+)/);
      const soldM = t.match(/([\d.,]+\s*(?:RB|JT|ribu|juta)?)\s*[Tt]erjual/);
      push(titleOf(t), priceM ? num(priceM[1]) : 0, soldM ? num(soldM[1]) : 0, a.href);
    });
    // Strategi B: panjat dari teks Terjual ke kartu terdekat.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let guard = 0;
    while (node && guard++ < 4000) {
      const v = node.textContent.trim();
      if (/terjual/i.test(v) && v.length < 60) {
        let el = node.parentElement;
        let card = null;
        let depth = 0;
        while (el && depth++ < 7) {
          const t = el.innerText || "";
          if (/Rp\s?[\d.]+/.test(t) && t.length < 2000) {
            card = el;
            break;
          }
          el = el.parentElement;
        }
        if (card) {
          const t = card.innerText || "";
          const priceM = t.match(/Rp\s?([\d.]+)/);
          const soldM = t.match(/([\d.,]+\s*(?:RB|JT|ribu|juta)?)\s*[Tt]erjual/);
          const link = card.querySelector ? card.querySelector('a[href*="-i."]') : null;
          push(titleOf(t), priceM ? num(priceM[1]) : 0, soldM ? num(soldM[1]) : 0, link ? link.href : "");
        }
      }
      node = walker.nextNode();
    }
    return out.slice(0, 60);
  };

  chrome.runtime.onMessage.addListener((msg, _sender, send) => {
    if (msg && msg.type === "EXTRACT") {
      const isSearch = /\/search|\/search\?|keyword=/.test(location.href);
      if (isSearch) {
        send({ pageType: "search", items: extractSearch(), url: location.href });
      } else {
        send({ pageType: "product", product: extractProduct(), url: location.href });
      }
    }
    return true;
  });
})();
