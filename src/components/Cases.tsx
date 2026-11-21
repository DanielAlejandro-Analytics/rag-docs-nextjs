"use client";

import { useState } from "react";
import type { EvalCase } from "@/lib/eval-data";
import { Answer } from "./Answer";

const LABEL = { correct: "Correcta", partial: "Parcial", incorrect: "Incorrecta" } as const;
const BADGE = {
  correct: "bg-accent/15 text-accent",
  partial: "bg-warn/15 text-warn",
  incorrect: "bg-danger/15 text-danger",
} as const;
type Filter = "all" | "ok" | "fail";

export function Cases({ cases }: { cases: EvalCase[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const ok = cases.filter((c) => c.correctness === "correct");
  const shown = filter === "all" ? cases : filter === "ok" ? ok : cases.filter((c) => c.correctness !== "correct");
  const tabs: [Filter, string][] = [
    ["all", `Todas (${cases.length})`],
    ["ok", `Correctas (${ok.length})`],
    ["fail", `Con fallas (${cases.length - ok.length})`],
  ];

  return (
    <section aria-labelledby="casos" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="casos" className="text-lg font-medium">
          Casos de prueba
        </h2>
        <div role="group" aria-label="Filtrar casos" className="flex flex-wrap gap-1 rounded-full border border-line p-1">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-sm ${filter === key ? "bg-accent/15 text-accent" : "text-muted hover:text-text"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted">
        Las preguntas están en inglés, el idioma de la documentación. Abre una fila para ver la respuesta y el veredicto del juez.
      </p>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {shown.map((c) => (
          <li key={c.id}>
            <details className="group">
              <summary className="grid cursor-pointer grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-surface sm:grid-cols-[3rem_minmax(0,1fr)_6rem_4rem_7rem]">
                <span className="font-mono text-sm text-muted">{c.id}</span>
                <span>{c.question}</span>
                <span className="hidden font-mono text-sm sm:block" title="Posición del fragmento de referencia en la búsqueda">
                  {c.rank && c.rank <= 5 ? <span className="text-accent">✓ top {c.rank}</span> : <span className="text-warn">✗ fuera</span>}
                </span>
                <span className="hidden font-mono text-sm sm:block" title="Citas que respaldan / citas">
                  {c.citesOk}/{c.cites}
                </span>
                <span className={`justify-self-end rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[c.correctness]}`}>
                  {LABEL[c.correctness]}
                </span>
              </summary>
              <div className="space-y-4 border-t border-line bg-surface px-4 py-4 text-sm">
                <p>
                  <span className="text-muted">Juez: </span>
                  {c.reason}
                </p>
                <p className="text-muted">
                  Búsqueda reescrita: <span className="font-mono text-text">{c.query}</span>
                </p>
                <div>
                  <p className="mb-2 text-muted">Respuesta generada</p>
                  <Answer text={c.answer} />
                </div>
                <div>
                  <p className="mb-1 text-muted">Fragmentos recuperados</p>
                  <ol className="list-decimal space-y-0.5 pl-6 font-mono text-xs break-all">
                    {c.retrieved.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
