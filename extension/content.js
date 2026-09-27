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
    const links = document.querySelectorAll('a[href*="-i."]');
    for (const a of links) {
      const href = a.href;
      if (seen.has(href)) continue;
      const text = a.innerText || "";
      if (!/terjual/i.test(text)) continue;
      const priceM = text.match(/Rp\s?([\d.]+)/);
      const soldM = text.match(/([\d.,]+\s*(?:RB|JT|ribu|juta)?)\s*[Tt]erjual/);
      const lines = text
        .split("\n")
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 10 &&
            !/^Rp/i.test(s) &&
            !/terjual/i.test(s) &&
            !/^\d+\s*\/\s*5/.test(s) &&
            !/diskon|promo|star|ad\b/i.test(s),
        )
        .sort((x, y) => y.length - x.length);
      if (!lines[0]) continue;
      seen.add(href);
      out.push({
        title: lines[0].slice(0, 200),
        price: priceM ? num(priceM[1]) : 0,
        sold: soldM ? num(soldM[1]) : 0,
        rating: 0,
        url: href,
      });
      if (out.length >= 50) break;
    }
    return out;
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
