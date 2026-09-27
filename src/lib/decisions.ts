export type Decision = {
  id: string;
  date: string;
  action: string;
  reason: string;
  expected: string;
};

const KEY = "shopee-decisions";

export function loadDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Decision[];
  } catch {
    // Abaikan, mulai dari kosong.
  }
  return [];
}

export function saveDecision(d: Decision): void {
  const list = [d, ...loadDecisions()];
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Penyimpanan diblokir, data hanya bertahan sesi ini.
  }
  window.dispatchEvent(new Event("decisions-changed"));
}

export function removeDecision(id: string): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(loadDecisions().filter((x) => x.id !== id)),
    );
  } catch {
    // Abaikan.
  }
  window.dispatchEvent(new Event("decisions-changed"));
}

export function subscribeDecisions(fn: () => void): () => void {
  window.addEventListener("decisions-changed", fn);
  return () => window.removeEventListener("decisions-changed", fn);
}
