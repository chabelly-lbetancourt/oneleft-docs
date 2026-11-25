# 66 · Cancelar un plan como organizadora

**Fecha:** 25/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#152 · Cancelar un plan como organizadora | Tarea | Must | 3 | PR #153, cerrada |
| frontend#178 · Cancelar un plan en la web y la app | Tarea | Must | 3 | PR #179, cerrada |
| frontend#180 · Los E2E cancelan los planes que publican | Tarea | Must | 2 | PR #181, cerrada |
| docs#153 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** la [entrada 62](62-hu063-ventajas-por-reputacion.md) dejó anotado que no había forma de cancelar un plan, aunque el resto del sistema ya lo daba por hecho: `reputation` tenía la regla `LATE_CANCELLATION` para un motivo (`ORGANIZER`) que `plans` nunca enviaba, y el mensaje de `plan.tooManyActive` decía «o cancela uno». Además, los E2E publican planes de verdad y no podían borrarlos, así que iban a chocar con el límite de 5 planes sin empezar de HU-063 cuando llegara a `pre`.

## 2. Backend: `DELETE /api/v1/plans/{planId}`

Quien organiza un plan puede cancelarlo antes de que empiece. Responde `204`.

| Caso | Respuesta |
|---|---|
| Sin token | `401` |
| No es quien lo organiza | `403 plan.notOrganizer` |
| El plan no existe | `404 plan.notFound` |
| El plan ya ha empezado o terminado | `409 plan.started` |
| Conflicto con otra escritura a la vez | `409 plan.busy`, como en el resto de escrituras |
| El plan ya estaba cancelado | `204`, sin un segundo evento (idempotente) |

| Decisión | Motivo |
|---|---|
| **`DELETE` sobre el plan con `204`**, aunque el plan no se borra: queda en `CANCELLED` y se sigue leyendo con `GET` | Las otras acciones de «deshacer» del controlador también son `DELETE` |
| **Se reutiliza la transición a `CANCELLED` de HU-039** ([entrada 27](27-hu039-minimo-de-participantes.md)): `Plan.cancel(organizerId, now)` conserva a los participantes y vacía la lista de espera y las llegadas | Una sola forma de cancelar en el dominio |
| **Caso de uso nuevo** `CancelPlanUseCase` / `PlanCancellationService`, con el mismo bloqueo optimista que unirse | Mismo mecanismo de reintento que el resto de escrituras del plan |
| **La comprobación de quién organiza va primero:** quien no organiza recibe siempre `403`, esté como esté el plan | No se da información del plan a quien no le corresponde |
| **Mismo evento `plan.cancelled`, con el valor nuevo `reason = ORGANIZER`** (HU-039 sigue enviando `MINIMUM_NOT_REACHED`) | Es el valor que `reputation` ya esperaba para `LATE_CANCELLATION`: −10 puntos si se cancela a menos de una hora del inicio. En `reputation` solo cambia un comentario |
| **Sin avisos nuevos:** los destinatarios son los participantes y la lista de espera, que reciben el SSE `plan-cancelled` y la notificación del navegador que ya existían. Quien organiza no recibe aviso de su propia cancelación | Lo ha decidido ella |
| **`notifications` lee ahora `reason`** | El texto de la notificación decía «No se ha apuntado suficiente gente» también cuando cancelaba quien organizaba |
| **Las personas con una solicitud pendiente (HU-069) no reciben aviso** | Igual que en HU-039 |

`chat` y `social` solo leen `planId` del evento y no cambian. Un plan cancelado ya no contaba para el límite de planes a la vez de HU-063; ahora lo cubre un test. Sin dependencias nuevas y sin migración. OpenAPI y README actualizados (sección «Cancelar un plan»).

## 3. Web y app: «Cancelar plan»

En el detalle de un plan que organizo, mientras está `OPEN` o `FULL` y no ha llegado su hora, aparece «Cancelar plan» (componente nuevo `app-plan-cancel`).

| Decisión | Motivo |
|---|---|
| **Confirmación en línea, no un diálogo:** un grupo con nombre que recibe el foco, un botón de peligro «Sí, cancelar el plan» y «No, mantenerlo», que devuelve el foco al botón | Es como ya se confirma salir de un plan o bloquear a una persona |
| **Las consecuencias se dicen antes de confirmar:** se avisará a quien se apuntó o esperaba, no se puede deshacer y, si el plan empieza en menos de 1 hora, cuesta 10 puntos de reputación | El 10 es el de la regla `LATE_CANCELLATION` que la app ya explicaba |
| **Tras cancelar, la página marca el plan como `CANCELLED` y lo vuelve a leer**; el resultado se escribe en una región `role="status"` que está en la página desde el principio, y el foco va a ella | Quien organiza no recibe el aviso SSE de su propia cancelación, y el botón desaparece |
| **El motivo se distingue** en el aviso de `plan-cancelled` y en el detalle: `ORGANIZER` («lo canceló quien lo organizaba») frente a `MINIMUM_NOT_REACHED`; cualquier otro valor dice solo que el plan se ha cancelado | Un `reason` desconocido no debe romper nada |
| **Errores:** `plan.notOrganizer`, `plan.started` y `plan.busy` usan las traducciones que ya existían; el resto, `errors.cancelFailed`. El plan se vuelve a leer | La página enseña cómo ha quedado |
| **«Mis planes» no cambia:** `GET /plans/mine` ya no devuelve un plan cancelado | La lista se lee cada vez que se abre el inicio |

`PlansApi.cancel(id)`, textos en español e inglés, colores de los tokens `--ol-*` y ninguna dependencia nueva. `errors.plan.tooManyActive` dice ahora también «o cancela uno».

> **Pendiente: capturas** del botón «Cancelar plan», de la confirmación con sus consecuencias y del plan cancelado. No se generaron en este hito.

## 4. Los E2E cancelan los planes que publican

- **`cancelLater(user, planId)`**, *fixture* nuevo en `e2e/support/fixtures.ts`: apunta un plan y, al terminar el test (también si falla), lo cancela con `DELETE /api/v1/plans/{id}` a través del gateway y con el token de quien lo publicó.
- **`publishPlan`** apunta por sí mismo cada plan que publica: ningún test que lo usa cambia.
- **`e2e/publish.e2e.ts`** publica por la interfaz: toma el id de la URL y lo apunta. Es el único test que publica así un plan real.

Lo que acepta la limpieza, y nada más:

| Respuesta | Significado |
|---|---|
| `204` | Cancelado, ahora o antes |
| `409 plan.started` | El plan ya ha empezado o terminado |
| `404` o `405` **sin** el código `plan.notFound` | El servicio aún no tiene el endpoint |

Cualquier otra respuesta (`401`, `403`, `404 plan.notFound`, `409 plan.busy`, `5xx` o no conseguir el token) hace fallar el test, después de intentar cancelar todos sus planes, y dice qué plan y qué respondió el servicio.

**La tolerancia del `404`/`405` es temporal.** El job de E2E corre contra las imágenes `:pre`, que no cancelan planes hasta que el backend se promocione. Está comentada en el código con `TODO(#180)`. Un `404` solo se acepta si no trae `plan.notFound`: con ese código el endpoint existe y el plan no, que es un fallo real.

## 5. Pruebas

- **Backend:** unitarias `PlanCancelTest` y `PlanCancellationServiceTest` (`plans`), `NoticeTextsTest` y `PlanCancelledMessageTest` (`notifications`). Integración con Testcontainers, ejecutada en la CI: `CancelPlanControllerTest` (401, 403, 404, 409 con el plan empezado, idempotencia, el evento recibido de un RabbitMQ real y el límite de planes a la vez); borra los planes y la cola que crea. La CI de la PR #153 pasó en verde.
- **Web:** 124 tests en 9 ficheros; `plan-cancel.ts` con 42 de 42 líneas cubiertas. No se pasó la suite completa en local. Lint, build y tipos del E2E en verde.
- **E2E:** `e2e/cancel-plan.e2e.ts` responde el plan y su `DELETE` en el navegador (no crea datos). No se ejecutó en local; pasó en la CI de la PR #179. La PR #181 no cambia tests unitarios y sus E2E pasaron en la CI.

## 6. Incidencias

- **El test nuevo hizo saltar el límite de peticiones del gateway en los E2E.** `cancel-plan.e2e.ts` inicia sesión como Ana una vez más, y con ello los tests que corren seguidos como Ana superaron las 120 peticiones por persona y minuto: `leave.e2e.ts` en inglés recibió `429` en el perfil en dos ejecuciones de dos. Su reintento publicó un plan más, que agotó los 20 avisos diarios de Lucía, y `notifications.e2e.ts` en inglés falló del todo. Se arregló en un segundo commit de la PR #179: el Compose de los E2E pone `RATE_LIMIT_API_PER_MINUTE: '1000'`, junto al límite de publicaciones que ya estaba levantado. Ningún E2E comprueba el propio límite.
- **La descripción de backend#152 no es la suya.** Al consultar la issue para esta entrada, su descripción es la del bug del índice del diario (docs#151); el historial de ediciones de GitHub conserva la original, sustituida el 24/11/2026. Los criterios de la tarea se han tomado de ese historial y de la PR #153. No se ha corregido.

## 7. Pendiente

- **Quitar la tolerancia del `404`/`405`** cuando el backend con el endpoint llegue a `pre`. El `TODO(#180)` apunta a una issue ya cerrada: hace falta una issue nueva o reabrir esa.
- **Las ramas `204` y `409 plan.started` de la limpieza no se han ejecutado nunca:** la CI corre contra `:pre` y solo pasa por «el endpoint aún no existe». Se podrán verificar tras la promoción o contra el stack local con las imágenes de `dev`.
- **Decisiones por confirmar:**
  - que el límite de peticiones se levante en el stack de E2E, en vez de repartir los tests entre más personas;
  - **el plan no guarda por qué se canceló** (`PlanResponse` no tiene motivo). El detalle solo lo sabe si acabo de cancelarlo o si el aviso llega con la página abierta; abierto más tarde, un plan con mínimo dice «no se llegó al mínimo» aunque lo cancelara quien lo organizaba. Mostrarlo siempre bien necesita un `cancelReason` en el backend;
  - que `plan.busy` conserve su texto, escrito para unirse («Mucha gente se está apuntando a la vez…»);
  - que el botón de cancelar sea pequeño y vaya al final de las acciones del plan.
- **La batería de E2E no tiene margen bajo los 20 avisos diarios de Lucía:** un reintento de cualquier test que publique antes de `notifications.e2e.ts` en inglés lo hace fallar. No se ha cambiado; merece su propia issue.
- Si `publish.e2e.ts` falla entre pulsar «Publicar» y llegar a la página del plan, su id no se conoce y ese plan no se cancela.
- Según la PR #179, la cancelación no se ha visto en un navegador, con un lector de pantalla ni en la app Android: solo la cubren los tests unitarios y el E2E.
- Capturas (apartado 3).
