// Mide BM25 con reescritura de la consulta (Gemini) para las preguntas en inglés y en español.
// No necesita embeddings. Uso: node --env-file=.env.local scripts/eval-rewrite.ts → data/results-rewrite.json
// Las reescrituras se guardan en data/query-rewrites.json para no pedirlas de nuevo.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildIndex, search, type Chunk } from "../src/lib/bm25.ts";
import { modelOf } from "../src/lib/llm.ts";
import { rewriteQuery } from "../src/lib/rag.ts";
import { rrf } from "../src/lib/vector.ts";

type Question = { id: string; question: string; refs: string[] };

const K = [1, 3, 5, 10];
const model = modelOf("gemini");
const { chunks } = JSON.parse(readFileSync("data/corpus.json", "utf8")) as { chunks: Chunk[] };
const questions = JSON.parse(readFileSync("data/eval-questions.json", "utf8")) as Question[];
const es = JSON.parse(readFileSync("data/eval-questions-es.json", "utf8")) as Record<string, string>;
const index = buildIndex(chunks);

const CACHE = "data/query-rewrites.json";
const saved = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : null;
const rewrites: Record<string, string> = saved?.model === model ? saved.rewrites : {};
for (const text of questions.flatMap((q) => [q.question, es[q.id]])) {
  if (rewrites[text]) continue;
  rewrites[text] = await rewriteQuery(text);
  writeFileSync(CACHE, JSON.stringify({ model, rewrites }, null, 2));
  await new Promise((r) => setTimeout(r, Number(process.env.GEMINI_PAUSE_MS ?? 4000)));
}

const runs = [];
for (const lang of ["en", "es"] as const) {
  for (const method of ["bm25", "bm25+rewrite", "rrf(bm25, bm25+rewrite)"] as const) {
    const perQuestion = questions.map((q) => {
      const text = lang === "en" ? q.question : es[q.id];
      const query = method === "bm25" ? text : rewrites[text];
      const ids = (s: string, k: number) => search(index, s, k).map((r) => r.chunk.id);
      const top =
        method === "rrf(bm25, bm25+rewrite)"
          ? rrf([ids(text, 50), ids(query, 50)], Math.max(...K)).map((r) => r.id)
          : ids(query, Math.max(...K));
      const rank = top.findIndex((id) => q.refs.includes(id)) + 1;
      return { id: q.id, question: text, query, rank, top5: top.slice(0, 5) };
    });
    const recall: Record<string, number> = Object.fromEntries(
      K.map((k) => [`recall@${k}`, perQuestion.filter((p) => p.rank > 0 && p.rank <= k).length / questions.length]),
    );
    const mrr = perQuestion.reduce((s, p) => s + (p.rank ? 1 / p.rank : 0), 0) / questions.length;
    runs.push({ lang, method, recall, mrr, perQuestion });
  }
}
writeFileSync("data/results-rewrite.json", JSON.stringify({ date: new Date().toISOString(), rewriteModel: model, runs }, null, 2));

const pct = (v: number) => `${(v * 100).toFixed(1)}%`.padStart(6);
console.log("idioma método        R@1    R@3    R@5    R@10   MRR@10");
for (const r of runs) console.log(`${r.lang}     ${r.method.padEnd(23)} ${K.map((k) => pct(r.recall[`recall@${k}`])).join(" ")} ${pct(r.mrr)}`);
