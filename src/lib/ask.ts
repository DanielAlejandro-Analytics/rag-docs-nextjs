// Lógica del servidor para /api/ask: carga el corpus una vez, limita por visitante y arma la respuesta.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildIndex, search, type Chunk } from "./bm25.ts";
import { modelOf } from "./llm.ts";
import { answerQuestion, rewriteQuery } from "./rag.ts";

export const DAILY_LIMIT = 5;
export const GLOBAL_DAILY_LIMIT = 150; // tope total, para que nadie con muchas IPs agote la cuota gratuita
export const MAX_QUESTION = 500;

let cached: { index: ReturnType<typeof buildIndex>; nextVersion: string } | undefined;
function corpus() {
  if (!cached) {
    const { nextVersion, chunks } = JSON.parse(readFileSync(join(process.cwd(), "data/corpus.json"), "utf8")) as {
      nextVersion: string;
      chunks: Chunk[];
    };
    cached = { index: buildIndex(chunks), nextVersion };
  }
  return cached;
}

// shortcut: contador en memoria por instancia; se reinicia con cada arranque en frío y no se comparte entre
// instancias. Basta para un demo: el plan gratuito de Gemini no cobra. Pasar a Redis/KV si hay abuso real.
const usage = new Map<string, { day: string; count: number }>();
let total = { day: "", count: 0 };
export function takeQuota(visitor: string): { ok: boolean; remaining: number; reason?: "visitor" | "global" } {
  const day = new Date().toISOString().slice(0, 10);
  if (total.day !== day) {
    total = { day, count: 0 };
    usage.clear(); // los contadores de días anteriores ya no sirven
  }
  const count = usage.get(visitor)?.count ?? 0;
  if (count >= DAILY_LIMIT) return { ok: false, remaining: 0, reason: "visitor" };
  if (total.count >= GLOBAL_DAILY_LIMIT) return { ok: false, remaining: DAILY_LIMIT - count, reason: "global" };
  usage.set(visitor, { day, count: count + 1 });
  total.count++;
  return { ok: true, remaining: DAILY_LIMIT - count - 1 };
}

export async function ask(question: string) {
  const { index } = corpus();
  const query = await rewriteQuery(question);
  const hits = search(index, query, 5);
  const { answer, cited } = await answerQuestion(question, hits.map((h) => h.chunk));
  return {
    answer,
    cited,
    query,
    model: modelOf("gemini"),
    chunks: hits.map((h, i) => ({
      n: i + 1,
      file: h.chunk.file,
      heading: h.chunk.heading,
      score: Math.round(h.score * 10) / 10,
      excerpt: h.chunk.text.replace(/```[\s\S]*?```/g, " ").replace(/<[^>]+>/g, " ").replace(/[#*`>[\]]/g, "").replace(/\(\/docs[^)]*\)/g, "").replace(/\s+/g, " ").trim().slice(0, 220),
    })),
  };
}

export type AskResult = Awaited<ReturnType<typeof ask>> & { remaining: number };
