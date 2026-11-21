// BM25 (Okapi) sin dependencias. Busca por palabras clave: no usa API ni cuesta nada.
export type Chunk = { id: string; file: string; title: string; heading: string; text: string };

type Index = {
  chunks: Chunk[];
  tf: Map<string, number>[];
  len: number[];
  avgLen: number;
  df: Map<string, number>;
};

const K1 = 1.2;
const B = 0.75;
// Palabras vacías en inglés (el corpus está en inglés). "use" no va: es parte de 'use client', 'use cache'.
const STOP = new Set(
  "a an and are as at be by can do does for from how i if in into is it its of on or that the this to what when where which with you your".split(" "),
);

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const word of text.match(/[A-Za-z0-9_]+/g) ?? []) {
    const w = word.toLowerCase();
    if (!STOP.has(w)) out.push(w);
    // revalidateTag → también "revalidate" y "tag", para que la búsqueda en prosa los encuentre.
    const parts = word.split(/(?<=[a-z0-9])(?=[A-Z])|_/).map((p) => p.toLowerCase());
    if (parts.length > 1) for (const p of parts) if (p && !STOP.has(p)) out.push(p);
  }
  return out;
}

export function buildIndex(chunks: Chunk[]): Index {
  const df = new Map<string, number>();
  const tf = chunks.map((c) => {
    const m = new Map<string, number>();
    // Título y encabezado cuentan como parte del fragmento.
    for (const t of tokenize(`${c.title} ${c.heading} ${c.text}`)) m.set(t, (m.get(t) ?? 0) + 1);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return m;
  });
  const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
  const avgLen = len.reduce((a, b) => a + b, 0) / Math.max(len.length, 1);
  return { chunks, tf, len, avgLen, df };
}

export function search(index: Index, query: string, k = 5): { chunk: Chunk; score: number }[] {
  const N = index.chunks.length;
  const terms = [...new Set(tokenize(query))];
  const scored = index.chunks.map((chunk, i) => {
    let score = 0;
    for (const t of terms) {
      const f = index.tf[i].get(t);
      if (!f) continue;
      const n = index.df.get(t)!;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * index.len[i]) / index.avgLen));
    }
    return { chunk, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
