// Fragmenta la documentación incluida en el paquete `next` y la guarda en data/corpus.json.
// Uso: node scripts/build-corpus.ts
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";
import { chunkFile } from "../src/lib/corpus.ts";

const require = createRequire(import.meta.url);
const nextVersion: string = require("next/package.json").version;
const DOCS = join(process.cwd(), "node_modules/next/dist/docs");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : [],
  );
}

const chunks = walk(DOCS).flatMap((f) =>
  chunkFile(relative(DOCS, f).replace(/\\/g, "/"), readFileSync(f, "utf8").replace(/\r\n/g, "\n")),
);
mkdirSync("data", { recursive: true });
writeFileSync("data/corpus.json", JSON.stringify({ nextVersion, chunks }));
console.log(`${chunks.length} fragmentos de next@${nextVersion}`);
