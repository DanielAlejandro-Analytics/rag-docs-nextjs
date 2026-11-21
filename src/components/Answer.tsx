// Markdown mínimo para las respuestas del modelo: bloques de código, listas, `código`, **negrita** y citas [n].
// Todo se renderiza como texto de React (nunca HTML), porque la respuesta viene de un modelo.
import type { ReactNode } from "react";

function inline(text: string, key: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)\s]+\)|`[^`]+`|\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/g).map((part, i) => {
    const k = `${key}-${i}`;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      // Solo enlaces a la documentación de Next.js; cualquier otra URL queda como texto.
      const href = link[2].startsWith("/docs/") ? `https://nextjs.org${link[2]}` : null;
      const label = inline(link[1], k);
      return href ? (
        <a key={k} href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-accent">
          {label}
        </a>
      ) : (
        <span key={k}>{label}</span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1)
      return (
        <code key={k} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{part.slice(2, -2)}</strong>;
    if (/^\[\d/.test(part))
      return (
        <span key={k} className="font-mono text-sm font-medium text-accent">
          {part.replace(/\s+/g, "")}
        </span>
      );
    return part;
  });
}

function prose(block: string, key: string): ReactNode {
  const lines = block.split("\n").filter((l) => l.trim());
  const item = /^\s*(?:[-*]|\d+\.)\s+/;
  if (lines.length && lines.every((l) => item.test(l))) {
    const ordered = /^\s*\d+\./.test(lines[0]);
    const List = ordered ? "ol" : "ul";
    return (
      <List key={key} className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(item, ""), `${key}-${i}`)}</li>
        ))}
      </List>
    );
  }
  return <p key={key}>{inline(lines.join(" "), key)}</p>;
}

export function Answer({ text }: { text: string }) {
  const parts = text.split(/```[^\n]*\n([\s\S]*?)```/g); // impares = código
  return (
    <div className="space-y-4 leading-relaxed">
      {parts.map((part, i) =>
        i % 2 ? (
          <pre key={i} className="overflow-x-auto rounded-md border border-line bg-surface p-4 font-mono text-sm leading-6">
            <code>{part.replace(/\n$/, "")}</code>
          </pre>
        ) : (
          part
            .split(/\n\s*\n/)
            .filter((b) => b.trim())
            .map((b, j) => prose(b, `${i}-${j}`))
        ),
      )}
    </div>
  );
}
