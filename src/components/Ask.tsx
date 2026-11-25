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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Pregunta y respuesta" className="min-w-0 space-y-8">
        <form onSubmit={onSubmit} className="panel space-y-4">
          <h2 className="panel-title glow">Consulta</h2>
          <div className="flex gap-2 border border-line p-3 focus-within:border-accent">
            <span aria-hidden="true" className="font-mono text-accent">&gt;</span>
            <label htmlFor="q" className="sr-only">
              Pregunta sobre Next.js
            </label>
            <textarea
              id="q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                // isComposing: with an IME (Japanese, Chinese) Enter confirms characters, it must not send.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(question);
                }
              }}
              maxLength={maxLength}
              rows={2}
              placeholder="Pregunta sobre Next.js 16 (caché, App Router, Server Actions)…"
              className="w-full resize-none bg-transparent text-base caret-accent placeholder:text-muted focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs text-muted">
              {remaining === null ? `Hasta ${dailyLimit} preguntas por día` : `Quedan ${remaining} de ${dailyLimit} preguntas hoy`}
            </p>
            <button
              type="submit"
              disabled={loading || question.trim().length < 3 || remaining === 0}
              className="bg-accent px-4 py-2 font-mono text-sm font-medium uppercase tracking-wider text-accent-ink disabled:opacity-40"
            >
              {loading ? "Buscando…" : "Preguntar"}
            </button>
          </div>
          <ul aria-label="Preguntas de ejemplo" className="grid gap-2 sm:grid-cols-2">
            {EXAMPLES.map((ex, i) => (
              <li key={ex}>
                <button
                  type="button"
                  onClick={() => send(ex)}
                  disabled={loading || remaining === 0}
                  className="h-full w-full border-x-2 border-line px-3 py-2 text-left font-mono text-sm hover:border-accent hover:bg-surface disabled:opacity-40"
                >
                  <span className="text-muted">{i + 1}:</span> {ex}
                </button>
              </li>
            ))}
          </ul>
        </form>

        <section aria-labelledby="respuesta" aria-live="polite" className="panel min-h-40">
          <h2 id="respuesta" className="panel-title glow">
            Respuesta
          </h2>
          {state.status === "idle" && <p className="font-mono text-sm text-muted">&gt; Esperando una pregunta…</p>}
          {loading && (
            <p className="font-mono text-sm text-muted">
              &gt; {state.question}
              <br />
              [PENSANDO] Reescribiendo la consulta, buscando en la documentación y redactando…
            </p>
          )}
          {state.status === "error" && (
            <p role="alert" className="border border-danger/40 bg-danger/10 p-4 text-danger">
              {state.message}
            </p>
          )}
          {result && (
            <article className="space-y-4">
              <p className="font-mono text-sm text-muted">&gt; {state.status === "done" && state.question}</p>
              <Answer text={result.answer} />
              <p className="font-mono text-xs text-muted">
                Modelo: {result.model} · Búsqueda: {result.query}
              </p>
            </article>
          )}
        </section>
      </section>

      <aside aria-labelledby="sistema" className="panel min-w-0 space-y-6 self-start">
        <h2 id="sistema" className="panel-title glow">
          Sistema y contexto
        </h2>
        <section aria-labelledby="indice">
          <h3 id="indice" className="mb-2 font-mono text-xs tracking-wider text-muted uppercase">
            Estado del índice
          </h3>
          <dl className="font-mono text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-1">
                <dt className="text-muted uppercase">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="fragmentos">
          <h3 id="fragmentos" className="mb-2 font-mono text-xs tracking-wider text-muted uppercase">
            Fragmentos usados
          </h3>
          {result ? (
            <ol className="space-y-3 border-l border-line">
              {result.chunks.map((c) => {
                const cited = result.cited.includes(c.n);
                return (
                  <li key={c.n} className="relative pl-4 before:absolute before:top-[0.7em] before:left-0 before:w-3 before:border-t before:border-line">
                    <div className="flex items-start justify-between gap-3 font-mono text-sm">
                      <p className="min-w-0">
                        <span className={cited ? "text-accent glow" : "text-muted"}>[{c.n}]</span>{" "}
                        <span className="break-words">{c.file.replace(/\.md$/, "")}</span>
                        <span className="text-muted"> › {c.heading}</span>
                      </p>
                      <p className="shrink-0 text-xs text-muted" title="Puntaje BM25">
                        {c.score}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{c.excerpt}</p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="border border-dashed border-line p-4 text-sm text-muted">
              {loading ? "Buscando fragmentos…" : "Los 5 fragmentos más relevantes aparecerán aquí al hacer una pregunta."}
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
