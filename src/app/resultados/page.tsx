import type { Metadata } from "next";
import { Cases } from "@/components/Cases";
import { Metrics } from "@/components/Metrics";
import { evalData, pct } from "@/lib/eval-data";

export const metadata: Metadata = { title: "Resultados del eval · RAG sobre la documentación de Next.js" };

const METHOD = {
  bm25: "BM25 con la pregunta tal cual",
  "bm25+rewrite": "BM25 + reescritura con Gemini",
  "rrf(bm25, bm25+rewrite)": "Fusión RRF de ambas",
} as Record<string, string>;

export default function Resultados() {
  const { baseline, summary } = evalData;
  return (
    <div className="space-y-10">
      <h1 className="sr-only">Resultados de la evaluación</h1>
      <Metrics />

      <section aria-labelledby="busqueda" className="space-y-3">
        <h2 id="busqueda" className="text-lg font-medium">
          Búsqueda: ¿aparece el fragmento correcto?
        </h2>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-2 font-normal">Idioma</th>
                <th className="px-4 py-2 font-normal">Método</th>
                <th className="px-4 py-2 text-right font-normal">Recall@1</th>
                <th className="px-4 py-2 text-right font-normal">Recall@5</th>
                <th className="px-4 py-2 text-right font-normal">Recall@10</th>
                <th className="px-4 py-2 text-right font-normal">MRR@10</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {evalData.retrievalRuns.map((r) => (
                <tr key={r.lang + r.method} className={`border-b border-line last:border-0 ${r.method === "bm25+rewrite" ? "text-accent" : ""}`}>
                  <td className="px-4 py-2">{r.lang === "en" ? "Inglés" : "Español"}</td>
                  <td className="px-4 py-2 font-sans">{METHOD[r.method] ?? r.method}</td>
                  <td className="px-4 py-2 text-right">{pct(r.recall["recall@1"])}</td>
                  <td className="px-4 py-2 text-right">{pct(r.recall["recall@5"])}</td>
                  <td className="px-4 py-2 text-right">{pct(r.recall["recall@10"])}</td>
                  <td className="px-4 py-2 text-right">{pct(r.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">
          En verde, el método que usa el demo. La fusión mejora el inglés pero empeora el español, porque la pregunta original en español
          solo agrega ruido a una búsqueda por palabras sobre documentación en inglés.
        </p>
      </section>

      <section aria-labelledby="aprendido" className="space-y-3">
        <h2 id="aprendido" className="text-lg font-medium">
          Qué se aprendió
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Reescribir la consulta subió las respuestas correctas de {pct(baseline.accuracy)} a {pct(summary.accuracy)} y las incorrectas
            bajaron de {baseline.incorrect} a {summary.incorrect}.
          </li>
          <li>
            Con BM25 sin reescritura, todas las respuestas incorrectas fueron casos donde la búsqueda no trajo el fragmento correcto, y en
            todos el modelo dijo que no tenía la información en lugar de inventar.
          </li>
          <li>
            Riesgo de reescribir: en q26 el modelo agregó vocabulario de versiones antiguas (<code className="font-mono">unstable_cache</code>)
            y la búsqueda se fue al modelo de caché anterior.
          </li>
          <li>
            Las referencias tienen límites: algunas respuestas usan un fragmento válido que no estaba en la lista, así que el recall real
            puede ser algo mayor. No se ajustaron referencias después de ver los resultados.
          </li>
        </ul>
      </section>

      <Cases cases={evalData.cases} />
    </div>
  );
}
