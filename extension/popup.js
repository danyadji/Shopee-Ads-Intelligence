const $ = (id) => document.getElementById(id);
const status = $("status");
let lastItems = [];

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  const dash = (await chrome.storage.local.get("dashUrl")).dashUrl || "http://localhost:3000";
  $("fDash").value = dash;
  const tab = await currentTab();
  if (!tab || !tab.url || !tab.url.includes("shopee.co.id")) {
    status.textContent = "Buka halaman produk atau pencarian Shopee dulu.";
    return;
  }
  await readPage(tab);
}

async function readPage(tab) {
  status.textContent = "Membaca halaman...";
  $("items").hidden = true;
  $("single").hidden = true;
  let res;
  try {
    res = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT" });
  } catch {
    status.textContent = "Muat ulang halaman Shopee, lalu buka popup lagi.";
    return;
  }
  if (!res) {
    status.textContent = "Tidak terbaca. Muat ulang halaman.";
    return;
  }
  if (res.pageType === "product" && res.product) {
    $("single").hidden = false;
    $("fTitle").value = res.product.title || "";
    $("fPrice").value = res.product.price || "";
    $("fSold").value = res.product.sold || "";
    $("fRating").value = res.product.rating || "";
    status.textContent = "Produk terbaca. Periksa lalu kirim.";
  } else if (res.pageType === "search" && res.items) {
    $("items").hidden = false;
    lastItems = res.items;
    const list = $("list");
    list.innerHTML = "";
    if (res.items.length === 0) {
      status.textContent = "Tidak ada kartu produk terbaca. Scroll lalu coba lagi.";
      return;
    }
    status.textContent = `${res.items.length} produk terbaca dari yang tampil di layar. Scroll untuk memuat lebih banyak, lalu Baca ulang.`;
    res.items.forEach((it) => {
      const li = document.createElement("li");
      const p = document.createElement("p");
      p.textContent = it.title;
      p.style.margin = "0 0 6px";
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = "Pilih produk ini";
      b.addEventListener("click", () => {
        $("items").hidden = true;
        $("single").hidden = false;
        $("fTitle").value = it.title;
        $("fPrice").value = it.price || "";
        $("fSold").value = it.sold || "";
        $("fRating").value = "";
        status.textContent = "Produk terpilih. Periksa lalu kirim.";
      });
      li.append(p, b);
      list.append(li);
    });
  }
}

function payload() {
  return {
    title: $("fTitle").value.trim(),
    price: Number($("fPrice").value) || 0,
    sold: Number($("fSold").value) || 0,
    rating: Math.min(5, Number($("fRating").value) || 0),
    url: "",
  };
}

$("btnCopy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload()));
    status.textContent = "Tersalin. Tempel di section Kompetitor, tombol Impor.";
  } catch {
    status.textContent = "Gagal menyalin. Ketik ulang manual.";
  }
});

$("btnSend").addEventListener("click", async () => {
  const dash = $("fDash").value.trim().replace(/\/$/, "");
  await chrome.storage.local.set({ dashUrl: dash });
  status.textContent = "Mengirim...";
  try {
    const res = await fetch(`${dash}/api/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "competitor", data: payload() }),
    });
    if (!res.ok) throw new Error();
    status.textContent = "Terkirim. Buka section Kompetitor, tekan Ambil dari extension.";
  } catch {
    status.textContent = "Dashboard tidak terjangkau. Pastikan npm run dev jalan, atau pakai Salin.";
  }
});

$("btnReread").addEventListener("click", async () => {
  const tab = await currentTab();
  if (tab) readPage(tab);
});

$("btnSendAll").addEventListener("click", async () => {
  if (lastItems.length === 0) return;
  const dash = $("fDash") ? $("fDash").value.trim().replace(/\/$/, "") : "http://localhost:3000";
  const saved = (await chrome.storage.local.get("dashUrl")).dashUrl;
  const base = ($("fDash") ? dash : saved || "http://localhost:3000");
  await chrome.storage.local.set({ dashUrl: base });
  status.textContent = `Mengirim ${lastItems.length} produk...`;
  try {
    const res = await fetch(`${base}/api/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        lastItems.map((it) => ({
          kind: "competitor",
          data: {
            title: it.title,
            price: it.price || 0,
            sold: it.sold || 0,
            rating: it.rating || 0,
            url: it.url || "",
          },
        })),
      ),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error();
    status.textContent = `${json.added || lastItems.length} produk terkirim. Buka Kompetitor, tekan Ambil dari extension.`;
  } catch {
    status.textContent = "Dashboard tidak terjangkau. Pastikan npm run dev jalan.";
  }
});

init();
