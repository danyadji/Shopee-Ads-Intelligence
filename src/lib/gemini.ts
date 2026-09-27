import { z } from "zod";

const campaignSchema = z.object({
  name: z.string(),
  impressions: z.number(),
  clicks: z.number(),
  orders: z.number(),
  spend: z.number(),
  revenue: z.number(),
  roas: z.number(),
});

export const analyzeRequestSchema = z.object({
  question: z.string().min(1).max(500),
  period: z.string(),
  totals: z.object({
    impressions: z.number(),
    clicks: z.number(),
    orders: z.number(),
    spend: z.number(),
    revenue: z.number(),
    roas: z.number(),
  }),
  campaigns: z.array(campaignSchema).max(8),
  breakEven: z.number(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

const SYSTEM = [  "You are an advertising data analyst for Indonesian Shopee sellers.",
  "Answer in Indonesian.",
  "Use ONLY the numbers in the provided JSON. Never invent statistics, names, or dates.",
  "Structure the answer with exactly these headings: FAKTA, PERHITUNGAN, HIPOTESIS, TINDAKAN.",
  "FAKTA states what the data shows. PERHITUNGAN shows derived metrics. HIPOTESIS gives likely causes and marks them as hypotheses, not certainties. TINDAKAN lists actions the seller can consider; the seller makes the final decision.",
  "Never use the em dash character. Never use marketing buzzwords.",
].join(" ");

export async function analyzeWithGemini(input: AnalyzeRequest): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const models = [
    process.env.GEMINI_MODEL ?? "",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter((m, i, all) => m !== "" && all.indexOf(m) === i);
  let lastError = "GEMINI_404";
  for (const model of models) {
    try {
      return await callModel(model, key, input);
    } catch (e) {
      const message = e instanceof Error ? e.message : "UNKNOWN";
      if (message !== "GEMINI_404") throw e;
      lastError = message;
    }
  }
  throw new Error(lastError);
}

async function callModel(
  model: string,
  key: string,
  input: AnalyzeRequest,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            parts: [
              {
                text: `Pertanyaan seller: ${input.question}\n\nData metrik (JSON):\n${JSON.stringify(input)}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
      }),
    },
  );
  if (!res.ok) throw new Error(`GEMINI_${res.status}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("EMPTY");
  return text;
}

const productSchema = z.object({
  title: z.string().min(1).max(300),
  price: z.number().min(0),
  sold: z.number().min(0),
  rating: z.number().min(0).max(5),
});

export const competitorRequestSchema = z.object({
  kind: z.literal("competitor"),
  question: z.string().min(1).max(500),
  mine: productSchema,
  competitors: z.array(productSchema).min(1).max(5),
});

export type CompetitorRequest = z.infer<typeof competitorRequestSchema>;

const COMPARE_SYSTEM = [
  "You are an e-commerce strategist for Indonesian Shopee sellers.",
  "Answer in Indonesian.",
  "Use ONLY the product data in the provided JSON. Never invent prices, sales, or ratings.",
  "Structure the answer with exactly these headings: POSISI, JUDUL, DESKRIPSI, LANGKAH.",
  "POSISI compares the seller product against each competitor on price, sales, and rating in one line each.",
  "JUDUL gives 3 alternative product titles under 120 characters each, specific and keyword-rich, no buzzwords.",
  "DESKRIPSI gives a short product description draft: one opening line, three bullet points of real differentiators from the data, one closing line.",
  "LANGKAH lists 3 concrete next actions the seller can consider.",
  "Never use the em dash character. Never use these words: revolusioner, seamless, cutting edge, terbaik sedunia, termurah sedunia.",
].join(" ");

export async function strategizeCompetitor(input: CompetitorRequest): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const models = [
    process.env.GEMINI_MODEL ?? "",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter((m, i, all) => m !== "" && all.indexOf(m) === i);
  let lastError = "GEMINI_404";
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: COMPARE_SYSTEM }] },
          contents: [
            {
              parts: [
                {
                  text: `Pertanyaan seller: ${input.question}\n\nData produk (JSON):\n${JSON.stringify(input)}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1500 },
        }),
      },
    );
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`GEMINI_${res.status}`);
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("EMPTY");
    return text;
  }
  throw new Error(lastError);
}
