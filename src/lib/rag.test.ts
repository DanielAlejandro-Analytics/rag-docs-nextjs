// Autoprueba: node --test src/lib/rag.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { citedNumbers } from "./rag.ts";

test("citedNumbers extrae citas únicas y ordenadas", () => {
  assert.deepEqual(citedNumbers("Use updateTag [2]. Also [1][2] and arr[0] is not text [10]."), [0, 1, 2, 10]);
  assert.deepEqual(citedNumbers("Wrap it in brackets [1, 3] or [4,5]."), [1, 3, 4, 5]);
});
