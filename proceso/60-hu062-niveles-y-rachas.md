# 60 · HU-062: niveles y rachas de reputación

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#78 · HU-062 Niveles y rachas de reputación | Historia | Should | 5 | PR #149 |
| frontend#166 · Niveles y rachas en la web y la app | Historia | Should | 3 | PR #168 |
| docs#145 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** la puntuación sola («★ 135») dice poco. Un nivel con nombre y una racha semanal hacen visible que la actividad se recompensa y dan un motivo para volver cada semana.

## 2. Reglas

**Niveles.** Se calculan a partir de la puntuación y **no se guardan**: si se reconstruyen las puntuaciones, el nivel sigue siendo correcto.

| Nivel | Puntuación | En la app |
|---|---|---|
| `NEW` | 0–99 (y puntuaciones negativas) | 🌱 Nuevo |
| `REGULAR` | 100–499 | ⚡ Habitual |
| `NEIGHBOURHOOD_REFERENCE` | 500–1.499 | 🔥 Referente del barrio |
| `LEGEND` | 1.500 o más | 👑 Leyenda |

**Racha semanal** (`StreakRules`):

- El **primer check-in de una semana** (de lunes a domingo, en `Europe/Madrid`) escribe un apunte `WEEKLY_STREAK` en el libro.
- Vale **5 puntos por cada semana seguida con al menos un plan, con tope de 25**: 5, 10, 15, 20, 25, 25…
- Una semana sin check-ins termina la racha.
- Un segundo plan en la misma semana, o un evento entregado dos veces, no da nada más: el origen del apunte se deriva de la persona y la semana.
- Si esta semana aún no hay plan, la racha que terminó la semana pasada sigue viva hasta que acabe la semana (`thisWeek: false`).

## 3. Decisiones

| Decisión | Motivo |
|---|---|
| **Las semanas se leen de los apuntes `ATTENDED` del libro**, hasta 52 semanas atrás | No hace falta tabla nueva ni migración |
| **Los valores son constantes** (`POINTS_PER_WEEK` = 5, `MAX_BONUS` = 25) | Se pueden cambiar sin tocar la lógica (ver «Pendiente») |
| **Los check-ins anteriores no reciben racha retroactiva**; las puntuaciones suben desde ahora | El libro de apuntes es inmutable |
| **Todas las respuestas de reputación ganan `level` y `nextLevelAt`** (`/me`, `/people/{userId}` y `/scores?ids=…`); `nextLevelAt` es `null` en Leyenda | La lista de planes ya pide `/scores`: el nivel del organizador llega sin otra llamada |
| **Endpoint nuevo `GET /api/v1/reputation/me/streak`** (`weeks`, `thisWeek`, `nextBonus`, `maxBonus`) | La web no calcula la racha: la pinta |
| **La API da solo el identificador del nivel**; el nombre y el emoji están en la web (`REPUTATION_LEVELS` y los ficheros de traducción) | Los textos se traducen en el cliente (es/en) |
| **Compatibilidad hacia atrás en la web:** `level` y `nextLevelAt` son opcionales y la racha se oculta si su endpoint falla | El job de E2E de la CI usa las imágenes `:pre`, que aún no tienen HU-062 |
| **Barra de progreso accesible** (`role="progressbar"` con `aria-valuemin`, `aria-valuemax`, `aria-valuenow` y `aria-valuetext`) y texto visible «Te faltan 365 puntos para 🔥 Referente del barrio» | El progreso no depende solo de la barra; el emoji del nivel es `aria-hidden` y el lector dice «Reputación 135 Nivel Habitual» |

## 4. En la app

- **El nivel junto a la puntuación** («★ 135 ⚡ Habitual») en mi perfil, en el perfil social de una persona y junto al organizador en la lista de planes cercanos y en el detalle del plan.
- **«Mi reputación»:** mi nivel, la barra hasta el siguiente (en Leyenda, «Has llegado al nivel más alto», sin barra) y mi racha: semanas seguidas, si esta semana ya cuenta y cuánto dará el siguiente check-in de la racha.
- **Libro de apuntes:** el motivo nuevo se explica como «Racha semanal: otra semana seguida con planes».
- Colores solo con tokens (`--ol-brand`, `--ol-border`, `--ol-text-muted`), en tema claro y oscuro.

> **Pendiente: capturas** del nivel en el perfil y en los planes, y de «Mi reputación» con la barra y la racha. No se generaron en este hito (no se levantó el stack local).

## 5. Pruebas

- **Backend:** 47 tests unitarios en verde (`LevelTest`, `StreakRulesTest`, `StreakServiceTest` y los de reputación, kudos, insignias y arquitectura) con dobles en memoria y reloj fijo. `ReputationIntegrationTest` (Testcontainers, solo en la CI, en verde): puntuaciones actualizadas con el +5 de la primera semana, apuntes de racha en el libro real, nivel en `/me` y `/scores`, y `/me/streak`; borra lo que crea.
- **Web:** 108 tests en 8 ficheros (insignia, página y API de reputación, ticket, planes cercanos, detalle, persona y perfil); `reputation-page.ts` 98 % de líneas, `reputation-badge.ts` y el modelo 100 %. Lint, build y tipos del E2E en verde. `e2e/reputation.e2e.ts` comprueba además el nivel, la barra, la racha y un apunte `WEEKLY_STREAK`, con el servicio respondido en el navegador (no crea datos); no se ejecutó en local por los límites de la máquina.

## 6. Incidencias

- **Conflictos al rebasar el backend.** La PR #149 se rebasó sobre la #148 de HU-066 ([entrada 59](59-hu066-anti-trampas-de-reputacion.md)), fusionada diez minutos antes: las dos tocan el servicio `reputation` y la misma fila de una tabla del `README.md`. Se resolvieron conservando los dos cambios. Los tests de la #148 ya comprobaban solo los puntos de los check-ins, así que la racha no los rompió.
- **El primer intento del job de E2E de la PR #168 no llegó a arrancar el stack:** al descargar las imágenes `:pre`, la petición a `ghcr.io` agotó el tiempo y Compose terminó con `No such image: …/oneleft-users:pre`. Se relanzó el job.
- **El segundo intento falló por el selector de «Pádel»** ([entrada 61](61-e2e-padel-surf.md)), un error de dos tests que no tocan la reputación. La PR #168 se fusionó con ese check en rojo; la CI de `dev` posterior pasó en verde y el arreglo de los tests llegó con la PR #171.

## 7. Pendiente

- **Decisión por confirmar: la forma de la racha.** El criterio dice «+5 por semana con al menos un plan, con tope». Se ha leído como una bonificación **creciente** (+5 por semana seguida, hasta 25 por semana). Si prefiero un +5 fijo por semana, basta cambiar las constantes.
- Un check-in que llega mucho después que los de semanas posteriores calcula su racha con las semanas conocidas en ese momento y no reescribe las bonificaciones ya dadas.
- Según la PR #168, la web no se probó contra el backend real con HU-062 (el backend aún no estaba fusionado); tampoco se ha hecho al escribir esta entrada.
- Capturas (apartado 4).
