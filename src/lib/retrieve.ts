// Los tres métodos de recuperación que compara el eval. Devuelven ids de fragmentos ordenados.
import { buildIndex, search, type Chunk } from "./bm25.ts";
import { rrf, vectorSearch } from "./vector.ts";

export type Method = "bm25" | "vector" | "hybrid";
export const METHODS: Method[] = ["bm25", "vector", "hybrid"];
const POOL = 50; // candidatos de cada método antes de fusionar

export type Retriever = ReturnType<typeof makeRetriever>;

export function makeRetriever(chunks: Chunk[], matrix: Float32Array, dim: number) {
  if (matrix.length !== chunks.length * dim) throw new Error("Los embeddings no corresponden al corpus: regenera data/embeddings.bin");
  const index = buildIndex(chunks);
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const bm25 = (q: string, k: number) => search(index, q, k).map((r) => r.chunk.id);
  const vector = (v: Float32Array, k: number) => vectorSearch(matrix, dim, v, k).map((r) => chunks[r.i].id);

  return {
    chunk: (id: string) => byId.get(id)!,
    retrieve(method: Method, query: string, queryVector: Float32Array, k: number): string[] {
      if (method === "bm25") return bm25(query, k);
      if (method === "vector") return vector(queryVector, k);
      return rrf([bm25(query, POOL), vector(queryVector, POOL)], k).map((r) => r.id);
    },
  };
}
