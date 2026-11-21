import { Ask } from "@/components/Ask";
import { Metrics } from "@/components/Metrics";
import { DAILY_LIMIT, MAX_QUESTION } from "@/lib/ask";
import { evalData } from "@/lib/eval-data";

export default function Home() {
  const info: [string, string][] = [
    ["Versión docs", `Next.js ${evalData.nextVersion}`],
    ["Fragmentos", evalData.chunks.toLocaleString("es-CL")],
    ["Búsqueda", "BM25 + reescritura"],
    ["Modelo", evalData.model],
  ];
  return (
    <div className="space-y-10">
      <h1 className="sr-only">Pregunta sobre la documentación de Next.js</h1>
      <Ask dailyLimit={DAILY_LIMIT} maxLength={MAX_QUESTION} info={info} />
      <Metrics linkToCases />
    </div>
  );
}
