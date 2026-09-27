import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const inboxItem = z.object({
  kind: z.literal("competitor"),
  data: z.object({
    title: z.string().min(1).max(300),
    price: z.number().min(0),
    sold: z.number().min(0),
    rating: z.number().min(0).max(5),
    url: z.string().max(500).default(""),
  }),
});

type InboxFile = { items: (z.infer<typeof inboxItem> & { at: string })[] };

function filePath() {
  return path.join(process.cwd(), ".data", "inbox.json");
}

async function load(): Promise<InboxFile> {
  try {
    const raw = await readFile(filePath(), "utf8");
    return JSON.parse(raw) as InboxFile;
  } catch {
    return { items: [] };
  }
}

export async function GET() {
  const box = await load();
  return NextResponse.json({ items: box.items.slice(-50) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const batch = Array.isArray(body) ? body : [body];
  const valid = batch
    .map((b) => inboxItem.safeParse(b))
    .filter((r) => r.success)
    .map((r) => ({ ...r.data, at: new Date().toISOString() }));
  if (valid.length === 0) {
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }
  const box = await load();
  box.items.push(...valid.slice(-50));
  await mkdir(path.dirname(filePath()), { recursive: true });
  await writeFile(filePath(), JSON.stringify(box, null, 1));
  return NextResponse.json({ ok: true, count: box.items.length, added: valid.length });
}
