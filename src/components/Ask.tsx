"use client";

import { useState, type FormEvent } from "react";
import type { AskResult } from "@/lib/ask";
import { Answer } from "./Answer";

const EXAMPLES = [
  "¿Cómo revalido datos en caché después de una mutación?",
  "¿Cuándo usar Server Components frente a Client Components?",
  "¿Cómo manejo errores con error.tsx y not-found.tsx?",
  "¿Qué pasó con el middleware en Next.js 16?",
];

type State =
  | { status: "idle" }
  | { status: "loading"; question: string }
  | { status: "done"; question: string; result: AskResult }
  | { status: "error"; question: string; message: string };

export function Ask({ dailyLimit, maxLength, info }: { dailyLimit: number; maxLength: number; info: [string, string][] }) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  // null hasta la primera respuesta: el conteo real lo lleva el servidor.
  const [remaining, setRemaining] = useState<number | null>(null);

  async function send(q: string) {
    const text = q.trim();
    if (text.length < 3 || state.status === "loading") return;
    setQuestion(text);
    setState({ status: "loading", question: text });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      setState(res.ok ? { status: "done", question: text, result: data } : { status: "error", question: text, message: data.error });
    } catch {
      setState({ status: "error", question: text, message: "No hubo conexión con el servidor." });
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(question);
  };
  const result = state.status === "done" ? state.result : null;
  const loading = state.status === "loading";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Pregunta y respuesta" className="min-w-0 space-y-6">
        <form onSubmit={onSubmit} className="rounded-lg border border-line bg-surface p-3 focus-within:border-accent">
          <label htmlFor="q" className="sr-only">
            Pregunta sobre Next.js
          </label>
          <textarea
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(question);
              }
            }}
            maxLength={maxLength}
            rows={3}
            placeholder="Escribe una pregunta sobre Next.js 16 (caché, App Router, Server Actions)…"
            className="w-full resize-none bg-transparent text-base placeholder:text-muted focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {remaining === null ? `Hasta ${dailyLimit} preguntas por día` : `Quedan ${remaining} de ${dailyLimit} preguntas hoy`}
            </p>
            <button
              type="submit"
              disabled={loading || question.trim().length < 3 || remaining === 0}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40"
            >
              {loading ? "Buscando…" : "Preguntar"}
            </button>
          </div>
        </form>

        {state.status === "idle" && (
          <div>
            <h2 className="mb-3 text-sm text-muted">Preguntas de ejemplo</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => send(ex)}
                    disabled={remaining === 0}
                    className="h-full w-full rounded-lg border border-line bg-surface p-4 text-left hover:border-accent disabled:opacity-40"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div aria-live="polite">
          {loading && <p className="text-muted">Reescribiendo la consulta, buscando en la documentación y redactando…</p>}
          {state.status === "error" && (
            <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-4 text-danger">
              {state.message}
            </p>
          )}
          {result && (
            <article className="space-y-4">
              <Answer text={result.answer} />
              <p className="text-xs text-muted">
                Modelo: {result.model} · Búsqueda: <span className="font-mono">{result.query}</span>
              </p>
            </article>
          )}
        </div>
      </section>

      <aside className="min-w-0 space-y-6">
        <section aria-labelledby="indice" className="rounded-lg border border-line bg-surface p-4">
          <h2 id="indice" className="mb-3 text-sm text-muted">
            Estado del índice
          </h2>
          <dl className="divide-y divide-line font-mono text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="fragmentos">
          <h2 id="fragmentos" className="mb-3 text-sm text-muted">
            Fragmentos usados
          </h2>
          {result ? (
            <ol className="space-y-3">
              {result.chunks.map((c) => {
                const cited = result.cited.includes(c.n);
                return (
                  <li key={c.n} className={`rounded-lg border bg-surface p-3 ${cited ? "border-accent" : "border-line"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-mono text-sm">
                        <span className={cited ? "text-accent" : "text-muted"}>[{c.n}]</span>{" "}
                        <span className="break-words">{c.file.replace(/\.md$/, "")}</span>
                        <span className="text-muted"> › {c.heading}</span>
                      </p>
                      <p className="shrink-0 text-right font-mono text-xs text-muted">
                        BM25
                        <br />
                        <span className="text-sm text-text">{c.score}</span>
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{c.excerpt}</p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
              {loading ? "Buscando fragmentos…" : "Los 5 fragmentos más relevantes aparecerán aquí al hacer una pregunta."}
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
