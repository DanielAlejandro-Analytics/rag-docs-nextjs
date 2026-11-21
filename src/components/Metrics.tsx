import Link from "next/link";
import { evalData, fmtDate, pct } from "@/lib/eval-data";

export function Metrics({ linkToCases = false }: { linkToCases?: boolean }) {
  const { summary, recall5 } = evalData;
  const cards = [
    { value: pct(summary.accuracy), label: "Respuestas correctas", note: `${summary.correct} correctas, ${summary.partial} parciales (½ punto)` },
    { value: pct(summary.citationPrecision), label: "Citas que respaldan", note: "según el juez" },
    { value: pct(recall5.en), label: "Recall@5 en inglés", note: "fragmento correcto en el top 5" },
    { value: pct(recall5.es), label: "Recall@5 en español", note: "mismas preguntas traducidas" },
  ];
  return (
    <section aria-labelledby="eval" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="eval" className="text-sm text-muted">
          Evaluación · {evalData.questions} preguntas · corrida del {fmtDate(evalData.date)}
        </h2>
        {linkToCases && (
          <Link href="/resultados" className="text-sm text-accent hover:underline">
            Ver los casos fallidos →
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label} className="rounded-lg border border-line bg-surface p-4">
            <p className="font-mono text-3xl font-medium text-accent">{c.value}</p>
            <p className="mt-1 text-sm">{c.label}</p>
            <p className="text-xs text-muted">{c.note}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Responde {evalData.model}; juzga {evalData.judge}, de otra familia de modelos para reducir el sesgo, pero el juicio de un LLM
        sigue pudiendo equivocarse. Las respuestas en español no se midieron.
      </p>
    </section>
  );
}
