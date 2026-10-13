# 35 · Release: cuarta promoción de dev a pre

**Fecha:** 13/10/2026 · **Sprint:** 13 (09–15/10/2026) · **Release:** infra#58

## 1. Contenido

Todo lo integrado en `dev` desde la [tercera promoción](24-release-pre-3.md) pasa al entorno **pre** (*staging*):

| Bloque | Historias y tareas |
|---|---|
| Ciclo de vida de los planes | HU-007 (caducidad y recordatorio), HU-039 (mínimo de participantes), HU-040 («voy de camino / llego tarde») |
| Descubrir y publicar | HU-026 (aviso del tiempo), HU-071 (sugerir sitios al escribir el punto de encuentro), HU-027 (añadir al calendario) |
| Avisos | HU-035 («estoy libre ahora»), HU-036 (alertas guardadas) |
| Comunidad | HU-008 (chat del plan): **nuevo servicio `chat`** y relé del WebSocket en el gateway |
| Interfaz y app Android | HU-032 (modo oscuro), barras del sistema en Android (frontend#80), cabecera fija (frontend#92), compartir planes empezados (frontend#93), sugerencias en el móvil (frontend#98), sitio escrito a mano (frontend#102) |
| Infraestructura | La web como servicio de Docker Compose y su imagen (infra#54, frontend#74, frontend#76), el servicio `chat` (infra#56) y su arranque en el stack de los E2E (frontend#104) |

## 2. Promociones

El orden de siempre: backend e infra primero, porque la PR del frontend hacia `pre` ejecuta los E2E contra las imágenes
`:pre` del backend y el compose de la rama `pre` de infra. Esta vez el frontend necesitaba antes un cambio en `dev`: el
stack de los E2E no levantaba el servicio `chat` (frontend#104).

| Orden | Repositorio | PR | Contenido |
|---|---|---|---|
| 1 | backend | #115 | Nueve historias y backend#110; la imagen `oneleft-chat:pre` se publica por primera vez |
| 2 | infra | #59 | La web como servicio y el servicio `chat` |
| 3 | frontend | #105 → `dev` | `chat` en `e2e/compose.e2e.yaml` |
| 4 | frontend | #106 | Toda la interfaz de esta release |
| 5 | docs | | Diarios 25 a 35 |

## 3. Verificación

- PR de backend e infra con el lint del camino `dev → pre` y la CI en verde.
- Imágenes `oneleft-gateway`, `oneleft-users`, `oneleft-plans`, `oneleft-notifications` y, por primera vez,
  `oneleft-chat` con la etiqueta `:pre` publicadas en GHCR por la CI de la rama `pre` del backend.
- El compose de la rama `pre` de infra incluye `chat`, y `e2e/compose.e2e.yaml` lo arranca con su imagen `:pre`.
- **E2E de la PR del frontend: 34 de 34** (17 recorridos en español y en inglés) en 4,1 minutos contra el stack de
  `pre`, con el contenedor `oneleft-chat` arrancado y sano. Pasan por primera vez contra `pre` los de HU-007, HU-035,
  HU-036, HU-039, HU-040, HU-071 y HU-008, entre ellos los cinco que fallaban en la PR de HU-071.
- **App Android:** con el stack local, Lucía abre en el emulador el chat de un plan terminado: el historial llega por
  el gateway y el WebSocket conecta desde la WebView (`ws://localhost` con `adb reverse`), en solo lectura.

## 4. Incidencias

- **Un rojo que no era solo de `pre`.** En la PR de HU-071 se atribuyeron a las imágenes de `pre` los cinco recorridos
  que fallaban, pero `publish.e2e.ts` escondía además un error de esa historia (frontend#102,
  [entrada 34](34-hu008-chat-del-plan.md)). Ahora, con todo en `pre`, la batería entera pasa. La regla que queda:
  antes de culpar al entorno, pasar en local los recorridos que fallan.
- **El servicio nuevo, antes que el frontend.** El stack de los E2E se arranca con el compose de la rama `pre` de infra
  y `e2e/compose.e2e.yaml` del frontend. Añadir `chat` a este último en `dev` antes de tiempo habría roto cualquier PR
  con la etiqueta `e2e`, porque `oneleft-chat:pre` no existía: por eso el orden fue backend (publica la imagen), infra
  (añade el servicio) y después frontend#104 y la promoción del frontend.
- **Docker parado y una sesión caducada.** Al probar el chat en Android, Docker estaba parado tras cerrarse la app y
  la sesión de Lucía había caducado durante la noche; `adb shell input text` volvió a perder caracteres de la
  contraseña en el primer intento.

