// Eval de respuestas: para cada pregunta recupera top 5, genera la respuesta con Gemini
// y la juzga con Groq (exactitud contra la referencia + si cada cita respalda lo dicho).
// Uso: node --env-file=.env.local scripts/eval-answers.ts [--retrieval bm25|rewrite] [--lang en|es] [--limit N]
// Recuperación: "bm25" = la pregunta tal cual; "rewrite" (por defecto) = BM25 sobre la consulta reescrita por Gemini.
// Reanudable: guarda cada pregunta en data/results-answers-<retrieval>-<lang>.json y salta las ya hechas.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { buildIndex, search, type Chunk } from "../src/lib/bm25.ts";
import { modelOf, QuotaError } from "../src/lib/llm.ts";
import { answerQuestion, judge, rewriteQuery, type Verdict } from "../src/lib/rag.ts";

type Question = { id: string; question: string; answer: string; refs: string[] };
type Row = { id: string; question: string; query: string; retrieved: string[]; answer: string; cited: number[]; verdict: Verdict };

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const retrieval = arg("retrieval", "rewrite");
const lang = arg("lang", "en");
if (!["bm25", "rewrite"].includes(retrieval) || !["en", "es"].includes(lang)) throw new Error("--retrieval bm25|rewrite, --lang en|es");
const limit = Number(arg("limit", "Infinity"));
const OUT = `data/results-answers-${retrieval}-${lang}.json`;
const PAUSE_MS = Number(process.env.GEMINI_PAUSE_MS ?? 6000); // plan gratuito: pocas peticiones por minuto

const model = modelOf("gemini");
const judgeModel = modelOf("groq");
const { nextVersion, chunks } = JSON.parse(readFileSync("data/corpus.json", "utf8")) as { nextVersion: string; chunks: Chunk[] };
const questions = (JSON.parse(readFileSync("data/eval-questions.json", "utf8")) as Question[]).slice(0, limit);
const index = buildIndex(chunks);
const es = JSON.parse(readFileSync("data/eval-questions-es.json", "utf8")) as Record<string, string>;
// Reescrituras ya calculadas por scripts/eval-rewrite.ts (mismo modelo); si falta alguna se pide.
const RW = "data/query-rewrites.json";
const rwSaved = existsSync(RW) ? JSON.parse(readFileSync(RW, "utf8")) : null;
const rewrites: Record<string, string> = rwSaved?.model === model ? rwSaved.rewrites : {};

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
const rows: Row[] = prev?.model === model && prev?.judge === judgeModel ? prev.rows : [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function save() {
  const n = rows.length;
  const score = { correct: 1, partial: 0.5, incorrect: 0 };
  const cites = rows.flatMap((r) => r.verdict.citations);
  const summary = {
    answered: n,
    accuracy: rows.reduce((s, r) => s + score[r.verdict.correctness], 0) / n,
    correct: rows.filter((r) => r.verdict.correctness === "correct").length,
    partial: rows.filter((r) => r.verdict.correctness === "partial").length,
    incorrect: rows.filter((r) => r.verdict.correctness === "incorrect").length,
    citationPrecision: cites.filter((c) => c.supports).length / Math.max(cites.length, 1),
    answersWithoutCitations: rows.filter((r) => r.cited.length === 0).length,
  };
  writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), model, judge: judgeModel, retrieval: retrieval === "bm25" ? "BM25 top 5" : "BM25 top 5 sobre consulta reescrita", lang, nextVersion, summary, rows }, null, 2));
  return summary;
}

try {
  for (const q of questions) {
    if (rows.some((r) => r.id === q.id)) continue;
    const text = lang === "en" ? q.question : es[q.id];
    let query = text;
    if (retrieval === "rewrite") {
      if (!rewrites[text]) {
        rewrites[text] = await rewriteQuery(text);
        await sleep(PAUSE_MS);
      }
      query = rewrites[text];
    }
    const top = search(index, query, 5).map((r) => r.chunk);
    const { answer, cited } = await answerQuestion(text, top);
    await sleep(PAUSE_MS);
    const verdict = await judge({ question: text, answer: q.answer }, answer, cited, top);
    rows.push({ id: q.id, question: text, query, retrieved: top.map((c) => c.id), answer, cited, verdict });
    save();
    console.log(`${q.id} ${verdict.correctness.padEnd(9)} citas ${verdict.citations.filter((c) => c.supports).length}/${cited.length}`);
    await sleep(PAUSE_MS);
  }
} catch (e) {
  if (!(e instanceof QuotaError)) throw e;
  console.error(`Cuota de Gemini agotada; se guardó lo avanzado (${rows.length} preguntas). Vuelve a correr para seguir.\n${e.message}`);
  process.exitCode = 2;
}

if (rows.length) console.log(save());
