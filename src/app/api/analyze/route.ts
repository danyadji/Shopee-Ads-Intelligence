import { NextResponse } from "next/server";
import {
  analyzeRequestSchema,
  competitorRequestSchema,
  analyzeWithGemini,
  strategizeCompetitor,
} from "@/lib/gemini";

function geminiError(message: string) {
  console.error("AI Analyst gagal:", message);
  if (message === "NO_KEY") {
    return NextResponse.json(
      { error: "Kunci Gemini belum dipasang. Isi GEMINI_API_KEY di file .env lalu jalankan ulang." },
      { status: 503 },
    );
  }
  if (message === "GEMINI_400") {
    return NextResponse.json(
      { error: "Kunci API ditolak Google. Salin ulang GEMINI_API_KEY dari AI Studio." },
      { status: 502 },
    );
  }
  if (message === "GEMINI_404") {
    return NextResponse.json(
      { error: "Nama model tidak ditemukan. Periksa GEMINI_MODEL di file .env." },
      { status: 502 },
    );
  }
  if (message === "GEMINI_429") {
    return NextResponse.json(
      { error: "Kuota Gemini habis. Tunggu sebentar atau periksa paket API Anda." },
      { status: 502 },
    );
  }
  return NextResponse.json(
    { error: `Analisis gagal (${message}). Periksa kunci dan koneksi, lalu coba lagi.` },
    { status: 502 },
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body && typeof body === "object" && "kind" in body) {
    const parsed = competitorRequestSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.issues
        .map((i) => i.path.join("."))
        .filter(Boolean)
        .join(", ");
      return NextResponse.json(
        { error: `Data kompetitor kurang (${fields || "periksa isian"}).` },
        { status: 400 },
      );
    }
    try {
      const text = await strategizeCompetitor(parsed.data);
      return NextResponse.json({ analysis: text });
    } catch (e) {
      return geminiError(e instanceof Error ? e.message : "UNKNOWN");
    }
  }
  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data yang dikirim tidak lengkap." },
      { status: 400 },
    );
  }
  try {
    const text = await analyzeWithGemini(parsed.data);
    return NextResponse.json({ analysis: text });
  } catch (e) {
    return geminiError(e instanceof Error ? e.message : "UNKNOWN");
  }
}
