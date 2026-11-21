# Handoff para Opus: RAG sobre la documentación de Next.js con evals

Este archivo es para continuar el proyecto desde cero. Léelo entero antes de tocar código.

## 1. Qué es el proyecto

Un RAG público sobre la documentación oficial de Next.js, con una evaluación medible. Sirve como pieza del portafolio de Daniel Barros, orientado a trabajos de IA en Chile. Tiene dos partes:

- **El demo:** un campo para preguntar sobre la documentación. Responde citando los fragmentos usados.
- **El eval:** un conjunto de preguntas de referencia con sus respuestas y fragmentos correctos. Las métricas (abajo) se muestran en una página, como tabla de resultados.

La idea es que un reclutador vea calidad: números reproducibles, no solo una demo bonita.

## 2. Decisiones ya tomadas (no reabrir sin hablar con Daniel)

- **Corpus:** documentación pública de Next.js. Nada de CV ni datos privados.
- **Modelo para responder y evaluar:** Gemini API en su plan gratuito. Si se agota la cuota, el demo responde con error y no cobra.
- **Respaldo de pago:** DeepSeek API, solo si el plan gratuito no alcanza. Las fuentes no coinciden en precios; verifica la tabla oficial antes de cargar saldo. Con las tarifas que encontré, una corrida de 40 preguntas cuesta centavos.
- **Anthropic no se usa** para este proyecto por ahora. Sin plan gratuito; Haiku 5.5 y Sonnet 5.5 quedan como opción futura.
- **Demo acotado:** mostrar resultados del eval y un campo de preguntas con límite por visitante. No un demo abierto sin límite, porque cada visita puede costar.
- **Ubicación:** este proyecto va en su propio deploy en Vercel. Plan B si el deploy separado da problemas: mover el código a `portafolio/src/app/rag` dentro del portafolio. Por eso mantén el código autocontenido, sin depender de piezas del portafolio.
- **Vercel:** el deploy está creado y responde (ver sección 5). Los límites del plan Hobby no están verificados. Hobby es solo para uso personal y no comercial.

## 3. Investigación previa (last30days)

Se investigó con last30days (Reddit, Hacker News, YouTube, GitHub, 2 búsquedas web de apoyo). Ventana: 22 oct a 21 nov 2026. Resultado: evidencia escasa, sobre todo en inglés.

Conclusiones que sí tienen respaldo:

- **Un RAG con evaluación medible es la pieza más citada.** Varias guías coinciden en que lo que separa a un candidato es demostrar si una respuesta es buena, con un set de preguntas, métricas y una tabla de resultados. Fuentes: [DEV Community](https://dev.to/klement_gunndu/5-ai-portfolio-projects-that-actually-get-you-hired-in-2026-5bpl), [Towards AI](https://pub.towardsai.net/stop-building-toy-chatbots-the-5-ai-engineering-projects-that-will-get-you-hired-d569eebe89fd), [TechInterview](https://www.techinterview.org/post/3233475399/ai-portfolio-built-with-ai-2026-interviews/).
- **Documentar lo que falló y las métricas.** TechInterview recomienda explicar problema, enfoque, métricas, despliegue y qué se rompió.
- **Publicar una demo con clic.** Una oferta de DevRel de [Hugging Face](https://apply.workable.com/huggingface/jobs/view/92C372F493) pide demos, ejemplos y documentación. Una guía de [Coderhouse Chile](https://www.coderhouse.com/cl/coderlibrary/portfolio-proyectos-ia-conseguir-trabajo-argentina) dice algo parecido. Es comercial.
- **Chile:** [Robert Half Chile](https://www.roberthalf.com/cl/es/sobre-robert-half/prensa/selecci0n2025) indica que los filtros automáticos reemplazan la revisión manual del CV, así que importan las palabras clave y un enlace visible.

Lo que NO encontré: comentarios de gente chilena sobre qué portafolio les sirvió para conseguir trabajo. Esa parte no tiene respaldo. No la presentes como hecho.

Advertencia: la afirmación de que "las encuestas de 2026 ponen los evals como la señal número 1" no se pudo verificar. No la cites.

## 4. Eval propuesto (a validar)

Esto es una propuesta mía, no decidida con Daniel. Confírmala antes de construir:

- **Set de preguntas:** unas 40 preguntas sacadas de la documentación de Next.js, cada una con el fragmento correcto de referencia.
- **Métricas:**
  - Recuperación: ¿el fragmento correcto aparece entre los primeros k resultados? (recall@k)
  - Respuesta: ¿es correcta respecto a la referencia? Juzgada por un LLM. Advertir que tiene sesgo.
  - Citas: ¿las citas apuntan a fragmentos que realmente respaldan la respuesta?
- **Búsqueda:** empezar con BM25 (sin costo ni API para recuperar). Si los números son malos, probar embeddings de Gemini.
- **Qué mostrar:** tabla con las métricas, fecha de la corrida y el modelo usado.

## 5. Estado actual (verificado)

- **Proyecto creado con Next.js** en `C:\Claude-Workspace\Vercel\rag-docs-nextjs`, con App Router, TypeScript, Tailwind, ESLint y `src/`.
- **Página de prueba vacía:** `src/app/page.tsx` muestra "Página de prueba: RAG sobre la documentación de Next.js. Aún vacía." Verificado: la URL de producción sirve ese texto.
- **Vercel:** proyecto `rag-docs-nextjs` en el equipo `breaking3`. URL: https://rag-docs-nextjs.vercel.app. El deploy fue el primero, así que fue a producción. Deployment Protection está activa (`vercel_authentication`), pero solo protege los previews: la URL de producción es pública (verificado con `curl` simple, responde 200 con el texto de prueba). Por eso el `vercel curl` y su bypass secret no eran necesarios.
- **Bypass secret:** `vercel curl` creó un "Protection Bypass for Automation secret". Se revocó el 2026-11-21 a pedido de Daniel; verificado: el proyecto quedó con 0 secrets y producción sigue respondiendo 200. Para verificar producción usa `curl` simple, no `vercel curl`.
- **Git:** repositorio local creado por create-next-app, con un commit inicial. El cambio de `page.tsx` y este archivo NO están commiteados.
- **Dependencias:** NO instaladas en local (`npm install` pendiente). Vercel construye con sus propias dependencias.
- **Título:** cambiado en local (ver sección 7).

## 6. Reglas de trabajo

- **Lee la documentación de Next.js incluida en el proyecto antes de escribir código.** `AGENTS.md` lo exige: esta versión tiene cambios que rompen compatibilidad. Ruta: `node_modules/next/dist/docs/` (después de instalar).
- **Pide permiso antes de:** instalar dependencias, hacer commit, hacer push a GitHub o desplegar a producción. Daniel lo pidió así.
- **Verificación:** después de cambios visibles, levanta el servidor con `npm run dev` y revisa la página. Antes de cerrar, corre `npx tsc --noEmit`, `npx eslint src` y `npm run build`.
- **Secretos:** las API keys van en `.env.local` y nunca se commitean. Agrega `.env*.local` al `.gitignore` si hace falta.

## 7. Pendientes para revisar (decisión de Daniel, no tomada)

- **Fuente Arial en `src/app/globals.css` (línea 25):** el hook de diseño la marca como "fuente muy usada". Es la fuente por defecto de create-next-app, no una decisión de diseño. Quedó sin cambios a propósito. Se elige cuando se diseñe la interfaz real. No añadir supresión (`ignore-value`) sin que Daniel lo confirme.
- **Título:** cambiado en local a "RAG sobre la documentación de Next.js" y `lang="es"` (sin commit ni deploy).
- **`.gitignore`:** Haiku añadió una segunda línea `.vercel` que ya estaba. Redundante, inofensiva; se puede quitar.

## 7b. Avance 2026-11-21 (Opus)

- **Decidido con Daniel:** corpus = docs del paquete (`node_modules/next/dist/docs`, next 16.4.6); eval tal cual la sección 4; `npm install` hecho.
- **Corpus:** `node scripts/build-corpus.ts` → `data/corpus.json` (2950 fragmentos, cortados por `##`/`###`, sin los ejemplos JS duplicados). Lógica en `src/lib/corpus.ts`.
- **BM25:** `src/lib/bm25.ts`, sin dependencias. Autoprueba: `node --test src/lib/bm25.test.ts`.
- **Preguntas:** `data/eval-questions.json`, 40 en inglés, cada una con 1 a 3 fragmentos válidos (`refs`). Las refs se eligieron leyendo el texto; solo se añadió una después de la primera corrida (q32, el fragmento de SSR responde la pregunta).
- **Recall:** `node scripts/eval-retrieval.ts` → `data/results-retrieval.json`. BM25: recall@1 25 %, @3 60 %, **@5 70 %**, @10 75 %, MRR@10 42,6 %. Los fallos son de vocabulario (p. ej. "skeleton" vs `loading.js`, "list of URLs" vs sitemap).
- **Hallazgo:** preguntas en español contra el corpus en inglés no recuperan nada útil con BM25. El demo necesitará traducir/reescribir la consulta (Gemini) antes de buscar, o embeddings multilingües.
- **Maquetas de Gemini** (6 variantes) para la interfaz: estaban en `Downloads/rag-nextjs-mockups.zip`.

## 7c. Modelos y keys (2026-11-21)

- **Proveedores (decisión de Daniel):** Gemini y Groq, ambos gratuitos. DeepSeek (de pago) solo si alguno no puede hacer algo.
- **Keys:** `GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY` como Shared Environment Variables del equipo, tipo Secret, enlazadas solo a `rag-docs-nextjs`. En local: `vercel env pull .env.local --environment=development` (sí trae los valores). `.env*` está en `.gitignore`.
- **Modelos** (en `.env.local`; en Vercel faltan como Config): `GEMINI_MODEL=gemini-3.5-flash-lite` responde; `GROQ_MODEL=openai/gpt-oss-120b` juzga. Juez de otra familia para reducir el sesgo de autoevaluación. Se fija el nombre exacto, no alias `-latest`, para reproducibilidad.
- **Probado el 2026-11-21:** `gemini-flash-latest` y `gemini-3.8-flash` daban 503 (alta demanda); `gemini-2.5-flash` ya no está disponible para cuentas nuevas. Groq free para gpt-oss-120b: 8000 tokens/min.
- **Cliente:** `src/lib/llm.ts` (REST con fetch, reintenta 429/503, corta con `QuotaError` si se agota la cuota diaria). Generación y juez: `src/lib/rag.ts`.
- **Eval de respuestas:** `node --env-file=.env.local scripts/eval-answers.ts [--limit N]` → `data/results-answers.json`. Reanudable.
- **Primera corrida completa (2026-11-21, BM25 top 5 + gemini-3.5-flash-lite, juez gpt-oss-120b):** 32 correctas, 2 parciales, 6 incorrectas (puntaje 82,5 %). Citas que respaldan: 94,7 %. Sin cortes de cuota.
- **Hallazgo:** las 6 incorrectas son preguntas donde BM25 no trajo el fragmento correcto, y en las 6 el modelo dijo "los fragmentos no lo contienen" en vez de inventar. La palanca para mejorar es la recuperación (embeddings, búsqueda híbrida o reescritura de la consulta), no el modelo.
- **Ojo con las refs:** q04 salió correcta con un fragmento que no está en sus `refs` (`06-fetching-data#streaming`). El recall está algo subestimado; no se cambiaron refs después de ver los resultados de las respuestas.
- **Bug corregido:** Gemini cita como `[1, 3]`; `citedNumbers` ahora lo acepta.

## 7d. Mejora de la búsqueda (2026-11-21)

- **Reescritura de la consulta (`rewriteQuery` en `src/lib/rag.ts`):** Gemini pasa la pregunta (cualquier idioma) a palabras clave en inglés con los nombres de API probables; BM25 busca sobre eso. Script: `scripts/eval-rewrite.ts` → `data/results-rewrite.json`. Reescrituras en caché: `data/query-rewrites.json`.

  | Idioma | Método | R@5 | R@10 | MRR@10 |
  |---|---|---|---|---|
  | en | BM25 | 70,0 % | 75,0 % | 42,6 % |
  | en | BM25 + reescritura | 75,0 % | 85,0 % | 51,0 % |
  | en | RRF(BM25, BM25 + reescritura) | 77,5 % | 85,0 % | 56,3 % |
  | es | BM25 | 22,5 % | 27,5 % | 11,1 % |
  | es | BM25 + reescritura | 67,5 % | 82,5 % | 40,6 % |
  | es | RRF(BM25, BM25 + reescritura) | 47,5 % | 67,5 % | 26,4 % |

  Preguntas en español: `data/eval-questions-es.json` (traducción de las 40). Método elegido por defecto: **BM25 + reescritura** (bueno en ambos idiomas; la fusión solo ayuda en inglés).
- **Respuestas con reescritura (en):** 35 correctas, 3 parciales, 2 incorrectas → **91,25 %** (antes 82,5 %). Citas que respaldan: 95,8 %. Archivo: `data/results-answers-rewrite-en.json`; la corrida anterior quedó en `results-answers-bm25-en.json`. Uso: `scripts/eval-answers.ts --retrieval bm25|rewrite --lang en|es`.
- **Riesgo observado:** en q26 la reescritura trajo vocabulario de versiones antiguas (`unstable_cache`) y la búsqueda se fue al modelo de caché anterior. En q06 la referencia probablemente es demasiado simple (no menciona `global-not-found.js`); no se cambió.
- **Embeddings (`gemini-embedding-2`, 768 dim):** el plan gratuito permite **1000 embeddings por día** por modelo. Van 950/2950 en `data/embeddings.bin` (+ `.json`). `scripts/build-embeddings.ts` se reanuda solo; faltan ~2 días de cuota. Cuando esté completo: `scripts/eval-retrieval.ts` compara BM25, vectores e híbrida (RRF) en en/es. Código listo en `src/lib/vector.ts` y `src/lib/retrieve.ts`. Ojo: la cuota diaria también la usarán las preguntas del demo si se usan vectores en producción.
- **Decisión de Daniel (2026-11-21):** no más pruebas para cuidar la cuota gratuita. El demo es para público en español y el nivel actual basta (es un demo, no tiene que ser perfecto). Método final: **BM25 + reescritura con Gemini**. No se corre el eval de respuestas en español; los embeddings quedan en pausa en 950/2950 (opcional a futuro, no bloquea nada). En la página de resultados, mostrar los números medidos (respuestas en inglés, búsqueda en ambos idiomas) y decir que las respuestas en español no se midieron.

## 7e. Interfaz (2026-11-21)

- **Páginas:** `/` (preguntar + métricas) y `/resultados` (métricas, tabla de búsqueda en/es, aprendizajes, 40 casos con filtro y detalle). Ambas estáticas; los datos salen de `data/*.json` en el build (`src/lib/eval-data.ts`).
- **Endpoint:** `POST /api/ask` (`src/app/api/ask/route.ts` + `src/lib/ask.ts`): valida la pregunta (3-500 caracteres), límite de 5 por IP al día, reescribe con Gemini, BM25 top 5, responde con citas. Si se agota la cuota de Gemini devuelve 503 con mensaje; no cobra.
- **Límite por visitante:** contador en memoria por instancia (shortcut documentado en el código). Suficiente para un demo; pasar a KV/Redis si hay abuso.
- **Respuesta del modelo:** se renderiza como texto de React con un markdown mínimo (`src/components/Answer.tsx`); los enlaces solo se activan si apuntan a `/docs/` (van a nextjs.org).
- **Diseño:** tema oscuro de las maquetas, acento verde menta, IBM Plex Sans + Plex Mono (reemplaza Arial/Geist).
- **Verificado en local** (`preview_start` "rag-docs-nextjs", puerto 3200, configurado en `C:\Claude-Workspace\.claude\launch.json`): una pregunta real de punta a punta, filtros y detalle de casos, sin scroll horizontal a 375 px. Pruebas (7), tsc, eslint y build OK.
- **Antes del deploy:** agregar `GEMINI_MODEL=gemini-3.5-flash-lite` en Vercel como Config (el demo no usa Groq; Groq solo juzga en el eval). Decidir qué de `data/` se commitea: `corpus.json` (3,6 MB) es necesario en el deploy; `embeddings.bin` (9 MB) no se usa y puede quedar fuera.

## 7f. Deploy a producción (2026-11-21)

- **En línea:** https://rag-docs-nextjs.vercel.app (deploy `dpl_5KUntnMVY59iuNSyds8jkgJdr8eT`, hecho con `vercel deploy --prod` desde archivos locales, sin commit). Verificado: `/` y `/resultados` 200; una pregunta real a `/api/ask` respondió en español con citas a `cookies.md`.
- **Segunda clave de Gemini:** `GEMINI_API_KEY2` (Secret, solo este proyecto). `src/lib/llm.ts` la usa solo si la primera agota su cuota. Probada con una llamada.
- **Variables de modelo en Vercel:** `GEMINI_MODEL` y `GROQ_MODEL` en los 3 entornos (el equipo las guardó como Secret en Production/Preview; da igual, no son secretas).
- **En Vercel se falla rápido:** con `VERCEL` definido, 1 reintento en vez de 5, para que el visitante no espere minutos.
- **`.vercelignore`:** excluye `.env*`, embeddings, `scripts/` y `HANDOFF.md`. Verificado en el listado de archivos del deploy: sin `.env`.
- **Regla de Daniel:** demos y pruebas pequeñas para cuidar la cuota gratuita; preguntar antes de corridas grandes.
- **Pendiente:** commit y repositorio en GitHub (pedir permiso). Enlazar desde el portafolio.

## 8. Pasos siguientes (en orden)

1. Confirmar con Daniel: eval propuesto (sección 4), corpus exacto y de dónde sale la documentación de Next.js.
2. Instalar dependencias (pedir permiso).
3. Preparar el corpus: fragmentar la documentación y guardar la fuente de cada fragmento.
4. Escribir el set de preguntas de referencia.
5. Implementar la recuperación con BM25 y medir recall@k.
6. Agregar la respuesta con Gemini (plan gratuito) y el juez LLM.
7. Página de resultados del eval y demo con límite por visitante.
8. Enlazar desde el portafolio cuando esté listo.
