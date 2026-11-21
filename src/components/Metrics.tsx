import Link from "next/link";
import { evalData, fmtDate, pct } from "@/lib/eval-data";

export function Metrics({ linkToCases = false }: { linkToCases?: boolean }) {
  const { summary, recall5 } = evalData;
  const cards = [
    { value: pct(summary.accuracy), ratio: summary.accuracy, label: "Respuestas correctas", note: `${summary.correct} correctas, ${summary.partial} parciales (½ punto)` },
    { value: pct(summary.citationPrecision), ratio: summary.citationPrecision, label: "Citas que respaldan", note: "según el juez" },
    { value: pct(recall5.en), ratio: recall5.en, label: "Recall@5 en inglés", note: "fragmento correcto en el top 5" },
    { value: pct(recall5.es), ratio: recall5.es, label: "Recall@5 en español", note: "mismas preguntas traducidas" },
  ];
  return (
    <section aria-labelledby="eval" className="panel space-y-4">
      <h2 id="eval" className="panel-title glow">
        Evaluación · {evalData.questions} preguntas · {fmtDate(evalData.date)}
      </h2>
      <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label} className="font-mono">
            <p className="text-xs tracking-wider text-muted uppercase">{c.label}</p>
            <p className="flex items-baseline gap-3">
              {/* Barra de 10 bloques; el número al lado es el dato real. */}
              <span aria-hidden="true" className="text-accent glow">
                {"█".repeat(Math.round(c.ratio * 10))}
                <span className="text-line">{"░".repeat(10 - Math.round(c.ratio * 10))}</span>
              </span>
              <span className="text-2xl font-medium text-accent glow">{c.value}</span>
            </p>
            <p className="font-sans text-xs text-muted">{c.note}</p>
          </li>
        ))}
      </ul>
      {linkToCases && (
        <Link href="/resultados" className="inline-block font-mono text-sm text-accent hover:underline">
          &gt; Ver los casos fallidos
        </Link>
      )}
      <p className="text-xs text-muted">
        Responde {evalData.model}; juzga {evalData.judge}, de otra familia de modelos para reducir el sesgo, pero el juicio de un LLM
        sigue pudiendo equivocarse. Las respuestas en español no se midieron.
      </p>
    </section>
  );
}
