// Generación de la respuesta a partir de los fragmentos recuperados, y el juez del eval.
import type { Chunk } from "./bm25.ts";
import { generate } from "./llm.ts";

const ANSWER_SYSTEM = `You answer questions about Next.js using ONLY the numbered documentation excerpts provided.
- After every claim, cite the excerpt(s) that support it as [n].
- If the excerpts do not contain the answer, say so plainly instead of guessing.
- Be concise: at most 4 short paragraphs, plus a short code example only if it helps.
- Answer in the same language as the question.`;

export const excerpts = (chunks: Chunk[]) =>
  chunks.map((c, i) => `[${i + 1}] ${c.file} › ${c.heading}\n${c.text}`).join("\n\n---\n\n");

// Acepta [1], [1][3] y [1, 3].
export const citedNumbers = (answer: string): number[] =>
  [...new Set([...answer.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((m) => m[1].split(",").map(Number)))].sort(
    (a, b) => a - b,
  );

export async function answerQuestion(question: string, chunks: Chunk[]) {
  const answer = await generate({ provider: "gemini", system: ANSWER_SYSTEM, prompt: `Excerpts:\n\n${excerpts(chunks)}\n\nQuestion: ${question}` });
  // Citas a números que no existen se descartan.
  return { answer, cited: citedNumbers(answer).filter((n) => n >= 1 && n <= chunks.length) };
}

const REWRITE_SYSTEM = `Turn the user's question (any language) into an English keyword search query for the official Next.js documentation.
Include the exact API names, functions, components, file conventions (e.g. loading.js, route.ts) and config options that the answer most likely uses, plus key terms from the question.
Return a single line of keywords, no explanation.`;

// Reescribe la pregunta para BM25: la pasa a inglés y agrega el vocabulario de la documentación.
export const rewriteQuery = (question: string) =>
  generate({ provider: "gemini", system: REWRITE_SYSTEM, prompt: question }).then((s) => s.trim());

const JUDGE_SYSTEM =`You grade a RAG system's answer about Next.js. Return JSON only:
{"correctness": "correct" | "partial" | "incorrect", "reason": string, "citations": [{"n": number, "supports": boolean}]}
- correctness: compare the answer with the reference answer. "correct" if it contains the key facts of the reference and nothing that contradicts it; "partial" if it has some key facts or is incomplete; "incorrect" if wrong, contradictory, or it says it cannot answer.
- citations: for every cited excerpt number, "supports" is true only if that excerpt actually backs the claim it is attached to.
- reason: one sentence.`;

export type Verdict = {
  correctness: "correct" | "partial" | "incorrect";
  reason: string;
  citations: { n: number; supports: boolean }[];
};

export async function judge(q: { question: string; answer: string }, generated: string, cited: number[], chunks: Chunk[]) {
  const citedText = cited.map((n) => `[${n}] ${chunks[n - 1].file} › ${chunks[n - 1].heading}\n${chunks[n - 1].text}`).join("\n\n---\n\n");
  // El juez es de otra familia (Groq) para no calificar sus propias respuestas.
  const raw = await generate({
    provider: "groq",
    system: JUDGE_SYSTEM,
    json: true,
    prompt: `Question: ${q.question}\n\nReference answer: ${q.answer}\n\nGenerated answer:\n${generated}\n\nCited excerpts:\n\n${citedText || "(none)"}`,
  });
  const v = JSON.parse(raw) as Verdict;
  if (!["correct", "partial", "incorrect"].includes(v.correctness)) throw new Error(`Veredicto inválido: ${raw}`);
  // Solo cuentan las citas que la respuesta realmente hizo.
  v.citations = (v.citations ?? []).filter((c) => cited.includes(c.n));
  return v;
}
