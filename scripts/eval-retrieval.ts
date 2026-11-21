// Compara la recuperación (BM25, vectores, híbrida) con las preguntas en inglés y en español.
// Uso: node --env-file=.env.local scripts/eval-retrieval.ts  → data/results-retrieval.json
// Los embeddings de las preguntas se guardan en data/query-embeddings.json para no pedirlos de nuevo.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Chunk } from "../src/lib/bm25.ts";
import { embed, EMBED_DIM, EMBED_MODEL } from "../src/lib/llm.ts";
import { makeRetriever, METHODS } from "../src/lib/retrieve.ts";

type Question = { id: string; question: string; answer: string; refs: string[] };

const K = [1, 3, 5, 10];
const { nextVersion, chunks } = JSON.parse(readFileSync("data/corpus.json", "utf8")) as { nextVersion: string; chunks: Chunk[] };
const questions = JSON.parse(readFileSync("data/eval-questions.json", "utf8")) as Question[];
const es = JSON.parse(readFileSync("data/eval-questions-es.json", "utf8")) as Record<string, string>;
const meta = JSON.parse(readFileSync("data/embeddings.json", "utf8"));
if (meta.done !== chunks.length) throw new Error(`Embeddings incompletos (${meta.done}/${chunks.length}): corre scripts/build-embeddings.ts`);

const ids = new Set(chunks.map((c) => c.id));
const missing = questions.flatMap((q) => q.refs.filter((r) => !ids.has(r)).map((r) => `${q.id}: ${r}`));
if (missing.length) throw new Error(`Referencias que no existen en el corpus:\n${missing.join("\n")}`);

const retriever = makeRetriever(chunks, new Float32Array(readFileSync("data/embeddings.bin").buffer.slice(0)), meta.dim);

// Embeddings de las preguntas, en caché por texto.
const QCACHE = "data/query-embeddings.json";
const cache: Record<string, number[]> =
  existsSync(QCACHE) && JSON.parse(readFileSync(QCACHE, "utf8")).model === `${EMBED_MODEL}/${EMBED_DIM}` ? JSON.parse(readFileSync(QCACHE, "utf8")).vectors : {};
const texts = questions.flatMap((q) => [q.question, es[q.id]]);
const pending = texts.filter((t) => !cache[t]);
for (let i = 0; i < pending.length; i += 50) {
  const batch = pending.slice(i, i + 50);
  (await embed(batch, "RETRIEVAL_QUERY")).forEach((v, j) => (cache[batch[j]] = Array.from(v)));
}
writeFileSync(QCACHE, JSON.stringify({ model: `${EMBED_MODEL}/${EMBED_DIM}`, vectors: cache }));

const runs = [];
for (const lang of ["en", "es"] as const) {
  for (const method of METHODS) {
    const perQuestion = questions.map((q) => {
      const text = lang === "en" ? q.question : es[q.id];
      const top = retriever.retrieve(method, text, Float32Array.from(cache[text]), Math.max(...K));
      const rank = top.findIndex((id) => q.refs.includes(id)) + 1; // 0 = no apareció
      return { id: q.id, question: text, rank, top5: top.slice(0, 5) };
    });
    const recall: Record<string, number> = Object.fromEntries(
      K.map((k) => [`recall@${k}`, perQuestion.filter((p) => p.rank > 0 && p.rank <= k).length / questions.length]),
    );
    const mrr = perQuestion.reduce((s, p) => s + (p.rank ? 1 / p.rank : 0), 0) / questions.length;
    runs.push({ lang, method, recall, mrr, perQuestion });
  }
}

writeFileSync(
  "data/results-retrieval.json",
  JSON.stringify({ date: new Date().toISOString(), nextVersion, embedModel: `${EMBED_MODEL} (${EMBED_DIM} dim)`, chunks: chunks.length, questions: questions.length, runs }, null, 2),
);

const pct = (v: number) => `${(v * 100).toFixed(1)}%`.padStart(6);
console.log("idioma método  R@1    R@3    R@5    R@10   MRR@10");
for (const r of runs) console.log(`${r.lang}     ${r.method.padEnd(7)} ${K.map((k) => pct(r.recall[`recall@${k}`])).join(" ")} ${pct(r.mrr)}`);
