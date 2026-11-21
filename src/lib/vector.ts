// Búsqueda por significado (embeddings) y fusión con BM25.

// Vectores normalizados → el producto punto es la similitud coseno.
export function vectorSearch(matrix: Float32Array, dim: number, query: Float32Array, k: number): { i: number; score: number }[] {
  const n = matrix.length / dim;
  const scores = new Array<{ i: number; score: number }>(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let d = 0, o = i * dim; d < dim; d++) s += matrix[o + d] * query[d];
    scores[i] = { i, score: s };
  }
  return scores.sort((a, b) => b.score - a.score).slice(0, k);
}

// Reciprocal Rank Fusion: combina rankings sin tener que calibrar puntajes de escalas distintas.
export function rrf(rankings: string[][], k: number, c = 60): { id: string; score: number }[] {
  const score = new Map<string, number>();
  for (const ranking of rankings) ranking.forEach((id, r) => score.set(id, (score.get(id) ?? 0) + 1 / (c + r + 1)));
  return [...score].map(([id, s]) => ({ id, score: s })).sort((a, b) => b.score - a.score).slice(0, k);
}
