import { ask, MAX_QUESTION, takeQuota } from "@/lib/ask";
import { QuotaError } from "@/lib/llm";

export async function POST(request: Request) {
  let question: unknown;
  try {
    ({ question } = await request.json());
  } catch {
    return Response.json({ error: "Petición inválida." }, { status: 400 });
  }
  if (typeof question !== "string" || question.trim().length < 3 || question.length > MAX_QUESTION) {
    return Response.json({ error: `Escribe una pregunta de 3 a ${MAX_QUESTION} caracteres.` }, { status: 400 });
  }

  // En Vercel, el primer valor de x-forwarded-for es la IP del visitante.
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const quota = takeQuota(visitor);
  if (!quota.ok) {
    return Response.json({ error: "Llegaste al límite de preguntas de hoy. Vuelve mañana.", remaining: 0 }, { status: 429 });
  }

  try {
    return Response.json({ ...(await ask(question.trim())), remaining: quota.remaining });
  } catch (e) {
    if (e instanceof QuotaError) {
      return Response.json(
        { error: "Se agotó la cuota gratuita del modelo por ahora. Intenta más tarde.", remaining: quota.remaining },
        { status: 503 },
      );
    }
    console.error(e);
    return Response.json({ error: "No se pudo generar la respuesta.", remaining: quota.remaining }, { status: 500 });
  }
}
