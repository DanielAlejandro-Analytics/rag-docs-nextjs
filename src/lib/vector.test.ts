// Autoprueba: node --test src/lib/vector.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { rrf, vectorSearch } from "./vector.ts";

test("vectorSearch ordena por similitud", () => {
  const m = Float32Array.from([1, 0, 0, 1, 0.6, 0.8]); // 3 vectores de dimensión 2
  assert.deepEqual(vectorSearch(m, 2, Float32Array.from([0, 1]), 2).map((r) => r.i), [1, 2]);
});

test("rrf premia lo que aparece arriba en ambos rankings", () => {
  const fused = rrf([["a", "b", "c"], ["b", "a", "c"], ["b"]], 2).map((r) => r.id);
  assert.deepEqual(fused, ["b", "a"]);
});
