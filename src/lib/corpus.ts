import type { Chunk } from "./bm25.ts";

const slug = (s: string) =>
  s.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "intro";

// Corta un .md de la documentación en fragmentos por encabezados ## y ###.
// shortcut: no se parten secciones largas (máx. ~21 mil caracteres); partirlas si el modelo recibe demasiado texto.
export function chunkFile(path: string, raw: string): Chunk[] {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const title = fm?.[1].match(/^title:\s*(.+)$/m)?.[1].trim() ?? path;
  let body = fm ? raw.slice(fm[0].length) : raw;
  // Las docs repiten cada ejemplo en TS y JS ("switcher"); se deja solo la versión TS.
  body = body.replace(/^```(?:jsx|js)[^\n]*switcher[^\n]*\n[\s\S]*?^```\n?/gm, "");

  const sections: { heading: string; lines: string[] }[] = [{ heading: title, lines: [] }];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    const h = !inFence && line.match(/^#{2,3}\s+(.+)/);
    if (h) sections.push({ heading: h[1].replace(/`/g, "").trim(), lines: [] });
    else sections.at(-1)!.lines.push(line);
  }

  const seen = new Map<string, number>();
  return sections
    .map(({ heading, lines }) => ({ heading, text: lines.join("\n").trim() }))
    .filter((s) => s.text.length > 0)
    .map(({ heading, text }) => {
      const base = `${path.replace(/\.md$/, "")}#${slug(heading === title ? "intro" : heading)}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { id: n > 1 ? `${base}-${n}` : base, file: path, title, heading, text };
    });
}
