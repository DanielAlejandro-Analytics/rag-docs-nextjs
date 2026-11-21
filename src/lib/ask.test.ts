// Autoprueba: node --test src/lib/ask.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { DAILY_LIMIT, takeQuota } from "./ask.ts";

test("takeQuota corta al llegar al límite diario y separa visitantes", () => {
  for (let i = DAILY_LIMIT - 1; i >= 0; i--) assert.deepEqual(takeQuota("a"), { ok: true, remaining: i });
  assert.deepEqual(takeQuota("a"), { ok: false, remaining: 0 });
  assert.equal(takeQuota("b").ok, true);
});
