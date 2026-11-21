// Autoprueba: node --test src/lib/ask.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { DAILY_LIMIT, GLOBAL_DAILY_LIMIT, takeQuota } from "./ask.ts";

test("takeQuota corta al llegar al límite diario y separa visitantes", () => {
  for (let i = DAILY_LIMIT - 1; i >= 0; i--) assert.deepEqual(takeQuota("a"), { ok: true, remaining: i });
  assert.deepEqual(takeQuota("a"), { ok: false, remaining: 0, reason: "visitor" });
  assert.equal(takeQuota("b").ok, true);
});

test("takeQuota aplica un tope global aunque cada IP sea distinta", () => {
  let ok = 0;
  for (let i = 0; i < GLOBAL_DAILY_LIMIT + 10; i++) if (takeQuota(`ip-${i}`).ok) ok++;
  assert.equal(ok, GLOBAL_DAILY_LIMIT - 6); // 6 ya usadas en la prueba anterior
  assert.equal(takeQuota("nueva").reason, "global");
});
