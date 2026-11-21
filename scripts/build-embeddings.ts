// Calcula los embeddings del corpus con Gemini y los guarda en data/embeddings.bin (+ .json con metadatos).
// Uso: node --env-file=.env.local scripts/build-embeddings.ts
// Reanudable: guarda tras cada lote y salta lo ya hecho si el corpus y el modelo no cambiaron.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Chunk } from "../src/lib/bm25.ts";
import { embed, EMBED_DIM, EMBED_MODEL } from "../src/lib/llm.ts";

const BATCH = 50;
const PAUSE_MS = Number(process.env.EMBED_PAUSE_MS ?? 15000); // plan gratuito: límite de tokens por minuto
const MAX_CHARS = 24000; // el modelo acepta 8192 tokens; el fragmento más largo ronda los 21 mil caracteres
const { chunks } = JSON.parse(readFileSync("data/corpus.json", "utf8")) as { chunks: Chunk[] };
const ids = chunks.map((c) => c.id);

const META = "data/embeddings.json";
const BIN = "data/embeddings.bin";
const prev = existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : null;
const sameRun = prev?.model === EMBED_MODEL && prev?.dim === EMBED_DIM && JSON.stringify(prev?.ids) === JSON.stringify(ids);
const matrix = new Float32Array(ids.length * EMBED_DIM);
let done = 0;
if (sameRun && existsSync(BIN)) {
  done = prev.done;
  matrix.set(new Float32Array(readFileSync(BIN).buffer.slice(0)).subarray(0, done * EMBED_DIM));
}

while (done < chunks.length) {
  const batch = chunks.slice(done, done + BATCH);
  const vectors = await embed(
    batch.map((c) => `${c.title} › ${c.heading}\n\n${c.text}`.slice(0, MAX_CHARS)),
    "RETRIEVAL_DOCUMENT",
  );
  vectors.forEach((v, j) => matrix.set(v, (done + j) * EMBED_DIM));
  done += batch.length;
  writeFileSync(BIN, Buffer.from(matrix.buffer));
  writeFileSync(META, JSON.stringify({ model: EMBED_MODEL, dim: EMBED_DIM, done, ids }));
  console.log(`${done}/${chunks.length}`);
  if (done < chunks.length) await new Promise((r) => setTimeout(r, PAUSE_MS));
}
