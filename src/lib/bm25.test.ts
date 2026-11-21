// Autoprueba: node --test src/lib/bm25.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, search, tokenize, type Chunk } from "./bm25.ts";
import { chunkFile } from "./corpus.ts";

const c = (id: string, text: string): Chunk => ({ id, file: id, title: "", heading: "", text });

test("tokenize separa camelCase y quita palabras vacías", () => {
  assert.deepEqual(tokenize("How to use revalidateTag"), ["use", "revalidatetag", "revalidate", "tag"]);
});

test("search ordena por relevancia y descarta fragmentos sin coincidencias", () => {
  const idx = buildIndex([
    c("a", "images are optimized by the Image component"),
    c("b", "revalidateTag purges cached data for a tag"),
    c("c", "cached data cached data"),
  ]);
  const r = search(idx, "revalidate cached tag");
  assert.equal(r[0].chunk.id, "b");
  assert.ok(!r.some((x) => x.chunk.id === "a"));
});

test("chunkFile corta por ##/###, ignora # dentro de código y quita duplicados JS", () => {
  const md = [
    "---", "title: Caching", "---", "Intro text.",
    "## Fetch", "```tsx filename=\"a.tsx\" switcher", "# not a heading", "```",
    "```jsx filename=\"a.jsx\" switcher", "dup", "```",
    "## Fetch", "second",
  ].join("\n");
  const chunks = chunkFile("01-app/caching.md", md);
  assert.deepEqual(chunks.map((x) => x.id), [
    "01-app/caching#intro", "01-app/caching#fetch", "01-app/caching#fetch-2",
  ]);
  assert.ok(chunks[1].text.includes("# not a heading"));
  assert.ok(!chunks[1].text.includes("dup"));
});
