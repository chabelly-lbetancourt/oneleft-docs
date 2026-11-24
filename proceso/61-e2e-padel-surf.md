# 61 · Los E2E que también encontraban «Pádel surf»

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| frontend#170 · Two E2E tests also match the Padel surf activity | Bug | Must | 1 | PR #171 |
| docs#145 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** el job de E2E de la CI se puso en rojo en las PR de reputación del sprint ([entrada 59](59-hu066-anti-trampas-de-reputacion.md) y [entrada 60](60-hu062-niveles-y-rachas.md)) por dos tests que no tenían nada que ver con ellas.

## 2. El fallo

Con HU-068 ([entrada 55](55-hu068-mas-categorias-de-actividad.md)) el catálogo de actividades ganó **«Pádel surf»**. Dos tests elegían la actividad «Pádel» por su nombre visible **sin coincidencia exacta**, así que el localizador encontraba dos elementos y Playwright se detenía con `strict mode violation: … resolved to 2 elements`:

| Test | Localizador |
|---|---|
| `e2e/notifications.e2e.ts` · elegir los avisos (zona, actividades y horas de silencio) | `.activity-chip` filtrado con `hasText` |
| `e2e/publish.e2e.ts` · publicar un plan con un mínimo de participantes | `getByRole('option', { name })` |

Fallaban los dos, en español y en inglés (4 fallos). **El error estaba en los tests, no en la app.**

El job de E2E solo se ejecuta en las PR con la etiqueta `e2e`, contra las imágenes `:pre`; se vio por primera vez en las PR #168 y #169.

## 3. Arreglo

Los dos localizadores usan ahora el **nombre accesible exacto** (`exact: true`), como ya hacía `e2e/activities.e2e.ts`. El chip de avisos se localiza como `.activity-chip` que además es el botón con ese nombre exacto. Son 5 líneas en 2 ficheros, sin cambios en la app.

## 4. Pruebas

- En local: tipos del E2E (`tsc -p tsconfig.e2e.json`), ESLint y Prettier sobre los dos ficheros. Los E2E no se ejecutaron en local.
- En la CI: el job «End-to-end tests (Playwright)» de la PR #171 pasó en verde contra las imágenes `:pre`, en español y en inglés. Tras fusionarla, la PR #169 se rebasó sobre `dev` y su job de E2E también pasó.

## 5. Incidencias

- **Un fallo distinto con el mismo síntoma.** El primer job de E2E en rojo del día no fue por el selector: la descarga de una imagen `:pre` desde `ghcr.io` agotó el tiempo y el stack no arrancó. Al relanzarlo apareció el fallo real de «Pádel». Conviene leer el paso que falla antes de relanzar.
- **El emulador de Android no fue usable** en el equipo de desarrollo (8 GB de memoria), así que este sprint no se pudo comprobar nada en la app Android.

## 6. Pendiente

- **La comprobación en Android de HU-042 y de HU-056** sigue pendiente por el emulador; hace falta un dispositivo físico u otro equipo.
- Revisar si otros E2E eligen actividades por nombre sin `exact: true`: cualquier actividad nueva cuyo nombre contenga el de otra repetiría el fallo.
- Capturas: no hay cambio visible en la interfaz.
