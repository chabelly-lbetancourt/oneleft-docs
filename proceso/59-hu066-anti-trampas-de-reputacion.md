# 59 · HU-066: anti-trampas de reputación

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#82 · HU-066 Anti-trampas de reputación | Historia | Should | 5 | PR #148 |
| frontend#167 · Por qué un apunte dio menos puntos | Historia | Should | 2 | PR #169 |
| docs#145 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** la reputación (HU-009, [entrada 38](38-hu009-reputacion.md)) decide en quién se confía al unirse a un plan. Si se puede inflar con check-ins a planes vacíos o con kudos entre amigos, deja de servir.

## 2. Reglas

Solo se limita lo que **suma** puntos; lo que resta (no presentarse, cancelar tarde, reportes confirmados) no tiene tope. Los valores son constantes de `AntiCheatRules`, en el servicio `reputation`.

| Regla | Valor | Efecto | Motivo en el apunte |
|---|---|---|---|
| Tope diario por motivo | 4 planes a los que se asiste, 3 planes organizados que se celebran y 10 kudos recibidos al día | Al llegar al tope, los apuntes de ese motivo de ese día valen 0 | `DAILY_CAP` |
| Puntos decrecientes con la misma persona | Kudos de la misma persona a la misma persona en 30 días | Cada uno vale la mitad que el anterior: 5, 2, 1, 0 | `SAME_PERSON` |
| Pares que se valoran siempre entre sí | 3 kudos o más en **cada** sentido en 30 días | Sus kudos valen 0 | `MUTUAL_PAIR` |
| Solo cuentan los planes con check-in | Ya se cumplía: asistir es el check-in, organizar exige un participante con check-in y los kudos solo se dan entre quienes hicieron check-in (HU-060) | Sin cambio de comportamiento; ahora tiene tests propios | (no aplica) |

## 3. Decisiones

| Decisión | Motivo |
|---|---|
| **El apunte recortado se guarda igualmente**, con los puntos que dio de verdad y el motivo (`limited_by`) | El libro de apuntes sigue explicando la puntuación y los eventos siguen siendo idempotentes |
| **Los días empiezan a medianoche en España** (`Europe/Madrid`) y se cuentan desde la hora del evento, no desde «ahora» | Reprocesar un evento da siempre el mismo resultado |
| **Si varios límites recortan un apunte, el último explica sus puntos finales** | Un solo motivo por apunte, fácil de mostrar |
| **La insignia «Alma del barrio» (HU-044) cuenta solo los kudos que dieron puntos** | Si no, la insignia se podría conseguir con los mismos kudos que la regla anula |
| **Migración `V4__anti_cheating.sql`:** columna `limited_by` opcional con `CHECK` e índice `(user_id, reason, occurred_at)` | El índice sirve al recuento diario; la columna es aditiva y el código anterior la ignora |
| **`limited_by` entra en la exportación de datos personales** (HU-045) | Forma parte del libro de apuntes de la persona |
| **La API solo añade un campo opcional** `limitedBy` (`DAILY_CAP`, `SAME_PERSON`, `MUTUAL_PAIR` o `null`) en `GET /api/v1/reputation/me/ledger` | Los clientes anteriores lo ignoran; la web lo trata como opcional y funciona igual contra un backend sin HU-066 |
| **La web explica el recorte con palabras**, debajo del motivo del apunte, y no solo con un color | Accesibilidad: el icono es decorativo (`aria-hidden`) |

## 4. En la app

En «Mi reputación», un apunte recortado dice por qué: «Ese día ya habías llegado al máximo de puntos por este motivo», «Vale menos: esa persona ya te había dado kudos hace poco, y cada uno vale la mitad que el anterior» o «No suma: os dais kudos muy a menudo el uno al otro». Un apunte de 0 puntos muestra «0» en lugar de «−0», y «Cómo funciona» explica los topes diarios, los kudos que valen la mitad y los pares.

> **Pendiente: capturas** del libro de apuntes con un apunte recortado y de «Cómo funciona». No se generaron en este hito (no se levantó el stack local).

## 5. Pruebas

- **Backend:** 48 tests unitarios en verde (reglas, servicios de reputación y de kudos, insignias, arquitectura hexagonal) con dobles en memoria y reloj fijo. Los de integración nuevos (`ReputationIntegrationTest`: tope diario en el libro real y `limitedBy` en la API; `KudosIntegrationTest`: el segundo kudos de la misma persona vale 2) usan Testcontainers y se ejecutaron solo en la CI, en verde; borran lo que crean.
- **Web:** 9 tests unitarios de la página y de la API (97 % de líneas en `reputation-page.ts`), lint, build y tipos del E2E en verde. E2E nuevo en `e2e/reputation.e2e.ts` con un apunte `MUTUAL_PAIR` y el servicio de reputación respondido en el navegador (no crea datos): no se ejecutó en local por los límites de la máquina; pasó en la CI de la PR.

## 6. Incidencias

- **Conflictos al rebasar.** HU-066 y HU-062 ([entrada 60](60-hu062-niveles-y-rachas.md)) se desarrollaron a la vez y tocan los mismos ficheros. En el frontend, la PR #169 se rebasó sobre la #168 (página de reputación, modelo, `es.json`, `en.json` y `e2e/reputation.e2e.ts`); los conflictos se resolvieron conservando los dos cambios.
- **Los E2E de la PR #169 fallaron dos veces** por una causa ajena a la historia: dos tests seleccionaban «Pádel» y encontraban también «Pádel surf». Se corrigió aparte ([entrada 61](61-e2e-padel-surf.md)); con el arreglo en `dev`, la CI de la PR pasó en verde.

## 7. Pendiente

- **Valores de los topes** (4, 3 y 10 al día; ventana de 30 días; 3 kudos por sentido): son una primera propuesta, pendiente de mi confirmación.
- **Los topes diarios están copiados en la web** (`DAILY_CAPS` del modelo) para el texto de «Cómo funciona». Si cambian en el backend hay que cambiarlos en los dos sitios; pendiente decidir si la API debe darlos.
- **Dos eventos de la misma persona procesados a la vez** podrían pasar los dos un tope. Los consumidores procesan de uno en uno, así que es poco probable; se acepta por ser un límite blando.
- Según la PR #169, la web no se probó contra el backend real con HU-066 (el backend aún no estaba fusionado); tampoco se ha hecho al escribir esta entrada.
- Capturas (apartado 4).
