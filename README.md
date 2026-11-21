# RAG sobre la documentación de Next.js

Demo: https://rag-docs-nextjs.vercel.app

Un buscador que responde preguntas sobre Next.js 16 usando solo la documentación oficial, y cita los fragmentos en los que se apoya. Lo hice para medir algo concreto: si la respuesta es correcta y si las citas de verdad la respaldan. La página [/resultados](https://rag-docs-nextjs.vercel.app/resultados) muestra los 40 casos de prueba, con lo que salió bien y lo que no.

## Cómo funciona

1. **Corpus.** Uso los 475 archivos Markdown que trae el paquete `next` (versión 16.4.6) en `node_modules/next/dist/docs`. Los corto por encabezados `##` y `###`, lo que da 2950 fragmentos. Las docs repiten cada ejemplo en TypeScript y JavaScript; me quedo solo con el de TypeScript.
2. **Reescritura de la consulta.** Gemini convierte la pregunta (en español o inglés) en palabras clave en inglés con los nombres de API que probablemente aparecen en la respuesta. "Esqueleto de carga" pasa a ser algo como `loading.js Suspense fallback`.
3. **Búsqueda.** BM25 sobre esa consulta, implementado a mano en `src/lib/bm25.ts`, sin dependencias. Devuelve los 5 mejores fragmentos.
4. **Respuesta.** Gemini responde solo con esos fragmentos y cita cada afirmación como `[n]`. Si los fragmentos no tienen la respuesta, debe decirlo.

## Resultados

40 preguntas escritas a partir de la documentación, cada una con su respuesta de referencia y de 1 a 3 fragmentos válidos.

**Búsqueda** (¿aparece un fragmento correcto entre los primeros 5?):

| Pregunta en | BM25 solo | BM25 + reescritura |
|---|---|---|
| Inglés | 70,0 % | 75,0 % |
| Español | 22,5 % | 67,5 % |

**Respuestas** (preguntas en inglés, juzgadas por un LLM):

| | BM25 solo | BM25 + reescritura |
|---|---|---|
| Correctas | 32 | 35 |
| Parciales | 2 | 3 |
| Incorrectas | 6 | 2 |
| Puntaje (parcial = 0,5) | 82,5 % | 91,25 % |
| Citas que respaldan lo dicho | 94,7 % | 95,8 % |

Responde `gemini-3.5-flash-lite`. Juzga `openai/gpt-oss-120b` vía Groq: elegí otra familia de modelos para que el modelo no se califique a sí mismo, pero sigue siendo un juez automático y puede equivocarse. Las respuestas en español no las medí, para no gastar la cuota gratuita.

## Lo que aprendí

- **BM25 falla por vocabulario, no por idioma solamente.** Con la pregunta tal cual, las 6 respuestas incorrectas fueron casos donde la búsqueda no trajo el fragmento correcto. En los 6 el modelo dijo que no tenía la información en vez de inventar, que es el comportamiento que quería.
- **En español, BM25 sin ayuda casi no sirve** (22,5 %): compara palabras exactas contra documentación en inglés. La reescritura lo resuelve en buena parte.
- **Reescribir tiene un costo.** En una pregunta sobre caché, el modelo agregó términos de versiones antiguas (`unstable_cache`) y la búsqueda se fue al modelo de caché anterior. El LLM trae lo que aprendió en su entrenamiento, aunque la documentación diga otra cosa.
- **Combinar búsquedas no siempre ayuda.** Fusionar con RRF la búsqueda original y la reescrita sube el inglés a 77,5 %, pero baja el español a 47,5 %, porque la pregunta original en español solo mete ruido.
- **Las referencias tienen límites.** Algunas respuestas correctas usaron un fragmento válido que yo no había marcado, así que el recall real es algo mayor. No cambié las referencias después de ver los resultados.
- **El plan gratuito marca el diseño.** Probé embeddings de Gemini, pero el plan gratis permite 1000 al día y el corpus tiene 2950 fragmentos. Quedaron a medias; el código para compararlos está en `scripts/eval-retrieval.ts` y `src/lib/vector.ts`.

## Límites del demo

- 5 preguntas por visitante al día y un tope total diario, para que la cuota gratuita de Gemini alcance. El contador vive en memoria del servidor, así que se reinicia cuando Vercel levanta una instancia nueva. Para un demo basta; con tráfico real usaría Redis.
- Si se agota la cuota del modelo, el demo responde con un error claro. No hay plan de pago detrás.

## Correrlo en local

Requiere Node 22 o superior (los scripts usan TypeScript directo con `node`).

```bash
npm install
cp .env.example .env.local   # y completa las claves
npm run dev
```

Scripts del eval (hacen llamadas a las APIs; las más largas tardan varios minutos):

```bash
node scripts/build-corpus.ts                                   # regenera data/corpus.json
node --test src/lib/*.test.ts                                  # pruebas
node --env-file=.env.local scripts/eval-rewrite.ts             # recall con y sin reescritura
node --env-file=.env.local scripts/eval-answers.ts --limit 3   # respuestas + juez (empieza con pocas)
```

## Stack

Next.js 16 (App Router), React 19, Tailwind 4, TypeScript. Las APIs de Gemini y Groq se llaman con `fetch`, sin SDK.
