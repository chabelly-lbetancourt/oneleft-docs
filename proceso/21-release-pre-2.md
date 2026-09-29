# 21 · Release: segunda promoción de dev a pre

**Fecha:** 29/09/2026 · **Sprint:** 7 (16–22/11/2026) · **Release:** infra#39

## 1. Contenido

Todo lo integrado en `dev` desde la [primera promoción](15-release-pre.md) pasa al entorno **pre** (*staging*):

| Bloque | Historias y tareas |
|---|---|
| Funcionalidad | HU-023 (salir de un plan y lista de espera), HU-024 (compartir un plan por enlace) |
| Acceso | HU-021 (continuar con Google), páginas de acceso y tema de Keycloak con la identidad de OneLeft |
| Interfaz | Identidad visual sobria y moderna |
| Calidad | E2E con Playwright en la CI, tercera usuaria de prueba, seed al arrancar en local (backend#88) |
| Correcciones | Proxy del gateway con Apache HttpClient (backend#90) y su *pool* de conexiones (backend#93) |

## 2. Promociones

El orden importa: la PR del frontend hacia `pre` ejecuta los E2E contra las imágenes `:pre` del backend y el
compose de la rama `pre` de infra, así que esos dos repositorios van primero.

| Orden | Repositorio | PR | Contenido |
|---|---|---|---|
| 1 | backend | #92 | HU-023, HU-024, seed (#88), Apache HttpClient (#90) |
| 2 | infra | #40 | Google, tema de Keycloak, tercera usuaria |
| 3 | docs | #48 | Diarios 16 a 20 |
| 4 | backend | #95 | *Pool* de conexiones del gateway (#93), tras el fallo de los E2E |
| 5 | frontend | #54 | HU-021, HU-023, HU-024, rediseño, E2E en la CI |

## 3. Verificación

- Todas las PR con el lint del camino `dev → pre` y la CI en verde.
- Imágenes `oneleft-gateway`, `oneleft-users` y `oneleft-plans` con la etiqueta `:pre` publicadas en GHCR.
- **E2E de la PR del frontend: 16 de 16** (8 recorridos en español y en inglés), en 52 s, contra el stack de `pre`.

## 4. Incidencia: el gateway se bloqueaba con cinco streams abiertos

El primer intento de la PR #54 terminó con **12 de 16 E2E fallidos** y más de 20 minutos de ejecución. Pasaban los
recorridos que solo leen (inicio de sesión, perfil) y fallaban todos los que publican, se unen o salen de un plan.
El gateway registraba:

```
org.apache.hc.core5.http.ConnectionRequestTimeoutException: Timeout deadline: 180000 MILLISECONDS
```

**Causa.** Horas antes se había cambiado el cliente HTTP del proxy (backend#90): el del JDK fallaba de forma
intermitente (`NullPointerException` en `Http1Exchange`) cuando un servicio respondía antes de recibir el cuerpo
de la petición, y se sustituyó por Apache HttpClient. Su *pool* admite por defecto **5 conexiones por servicio**.
Los avisos en tiempo real (SSE) mantienen su conexión con `plans` abierta mientras la app está abierta, así que con
5 streams abiertos el resto de peticiones a `plans` esperaban una conexión libre. Con varias páginas abiertas a la
vez, los E2E llegaban a ese límite enseguida.

**Reproducción.** En local, con el gateway en un contenedor: se abren 5 streams y el sexto, igual que un
`GET /api/v1/plans/mine`, ya no responde.

**Solución (backend#93).** `ProxyClientConfig` personaliza el cliente que elige Spring Boot:
`oneleft.proxy.max-connections` (`PROXY_MAX_CONNECTIONS`, 1000 por defecto) para el *pool* y para cada servicio.
`ProxyConnectionsTest` lanza 10 peticiones a la vez contra un servidor de prueba que solo responde cuando han llegado
todas: falla con el *pool* por defecto y pasa con el nuevo. Después, 20 streams abiertos y `GET /mine` responde en
639 ms, y los 16 E2E pasan en local y en la CI.

**Lección.** Cambiar una dependencia de infraestructura (aquí, el cliente HTTP) cambia también sus valores por
defecto. Los tests unitarios del gateway no abrían conexiones largas y no lo detectaron; los E2E contra `pre`, con
varias personas y streams a la vez, sí. En producción habría bastado con cinco personas usando la app.
