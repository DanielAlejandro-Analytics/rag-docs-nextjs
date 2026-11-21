// Resultados del eval para las páginas. Se leen en el build (son JSON del repo), no en cada visita.
import answers from "../../data/results-answers-rewrite-en.json";
import answersBaseline from "../../data/results-answers-bm25-en.json";
import retrieval from "../../data/results-rewrite.json";
import corpusInfo from "../../data/results-retrieval.json";

export type Correctness = "correct" | "partial" | "incorrect";

const recallRun = (lang: "en" | "es", method: string) => retrieval.runs.find((r) => r.lang === lang && r.method === method)!;
const main = { en: recallRun("en", "bm25+rewrite"), es: recallRun("es", "bm25+rewrite") };

export const evalData = {
  date: answers.date,
  nextVersion: corpusInfo.nextVersion,
  chunks: corpusInfo.chunks,
  questions: answers.rows.length,
  model: answers.model,
  judge: answers.judge,
  summary: answers.summary,
  baseline: answersBaseline.summary,
  recall5: { en: main.en.recall["recall@5"], es: main.es.recall["recall@5"] },
  retrievalRuns: retrieval.runs.map((r) => ({
    lang: r.lang,
    method: r.method,
    recall: r.recall as Record<string, number>,
    mrr: r.mrr,
  })),
  cases: answers.rows.map((row) => {
    const rank = main.en.perQuestion.find((p) => p.id === row.id)?.rank ?? 0;
    return {
      id: row.id,
      question: row.question,
      query: row.query,
      answer: row.answer,
      correctness: row.verdict.correctness as Correctness,
      reason: row.verdict.reason,
      citesOk: row.verdict.citations.filter((c) => c.supports).length,
      cites: row.cited.length,
      rank,
      retrieved: row.retrieved,
    };
  }),
};

export type EvalCase = (typeof evalData.cases)[number];

export const pct = (v: number) => `${Math.round(v * 1000) / 10}`.replace(".", ",") + " %";
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Santiago" });
