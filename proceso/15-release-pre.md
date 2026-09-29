# 15 · Release: primeras promociones de dev a pre

**Fecha:** 28–29/09/2026 · **Release:** infra#23

## 1. Contenido

Todo lo integrado hasta ahora pasa al entorno **pre** (*staging*):

| Bloque | Historias y tareas |
|---|---|
| Funcionalidad | HU-001 a HU-005 (perfil, publicar, planes cercanos con mapa y tiempo real, unirse a un plan) |
| Idiomas y código | HU-022 (es/en), todo el código en inglés |
| Datos | Seed de demostración (perfil `seed`, nunca en `pro`) |
| Seguridad | Límite de peticiones en el gateway (Bucket4j + Redis) |
| Operación | Entorno `pre`, avisos de la CI en Slack, panel de rechazos en Grafana |

## 2. Promociones

Se hicieron en tres tandas, porque durante el día se siguió integrando en `dev`:

| Tanda | backend | frontend | infra | docs |
|---|---|---|---|---|
| Sprint 7 | #39 | #25 | #24 | #25 |
| Seed y HU-005 | #83 | #35 | #28 | #28 |
| Límite de peticiones | (incluido en #83) | #38 | #31 | #31 |

La PR del backend #83 salía de `dev`, así que al final también incluía el límite de peticiones. Por eso se abrió una
tercera tanda en los otros repositorios: sin la de infra, el gateway de `pre` se habría quedado sin `REDIS_HOST`.

## 3. Verificación

- Todas las PR de promoción con el lint del camino `dev → pre` y la CI en verde.
- Imágenes `oneleft-gateway`, `oneleft-users` y `oneleft-plans` con la etiqueta `:pre` publicadas en GHCR, y
  compilación `pre` de la web.
- Aviso de la CI de `pre` recibido en Slack.

## 4. Incidencia: un test intermitente frenó la promoción

La CI de la PR #83 falló en `RateLimitTest`. Las peticiones permitidas se reenvían a un servidor HTTP de prueba, y el
proxy del gateway a veces reutilizaba una conexión del pool que ese servidor estaba cerrando
(`NullPointerException` en `Http1Exchange`). Se arregló en backend#85: el servidor de prueba lee la petición y
responde con `Connection: close`. En local pasó cinco veces seguidas y la CI volvió a verde.

**Lección:** un test que depende de la red tiene que controlar las conexiones igual que el código de producción.
La promoción a `pre` sirvió justo para eso: detectó un fallo que en `dev` había pasado.
