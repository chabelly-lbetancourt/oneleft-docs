# 47 · Sprint 15: las mejoras del panel de kudos

**Fecha:** 24/10/2026 · **Sprint:** 15 (23–29/10/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| frontend#143 · El panel de kudos pierde el foco al dar uno, y tres problemas de robustez | Bug | Should | 1 | PR #144 |
| docs#115 · Documentación (esta entrada) | Documentación | Should | 1 | esta entrada |

**Por qué ahora:** la revisión de la PR #138 ([entrada 44](44-hu060-kudos.md)) dejó cuatro mejoras que no impedían
fusionarla, y en la [entrada 46](46-fusiones-y-pruebas-en-android.md) quedaron para otra PR. Una de ellas es de
accesibilidad, que HU-060 pide en sus criterios de aceptación.

**Objetivo:** que el panel de kudos se maneje igual con teclado y lector de pantalla, y que no enseñe datos de otro
plan ni desaparezca con un error.

## 2. Decisiones

| Problema | Decisión | Motivo |
|---|---|---|
| Al dar un kudos, la ficha pulsada desaparece y el foco cae a la página | El foco pasa a «Le diste …», un párrafo con `tabindex="-1"`, con `afterNextRender` como en el chat | Quien usa teclado sigue en el mismo sitio, y el lector de pantalla lee lo que acaba de pasar. Mover el foco basta: una región `aria-live` repetiría el mismo texto |
| Si al dar un kudos falla también la relectura, el panel desaparecía con su error | Una relectura que falla deja el panel como estaba, con el mensaje | El error explica qué pasó; quitarlo todo deja a la persona sin saberlo |
| Una respuesta tardía de otro plan podía pisar la del plan abierto | Las cargas pasan por un `switchMap`; al cambiar de plan, el panel se vacía hasta que llegan sus kudos, y un kudos dado justo antes no toca el plan nuevo | El router reutiliza el detalle cuando solo cambia el id del plan |
| El panel se pedía también en planes cancelados | Solo en planes en curso o terminados (`withKudos`) | Un plan cancelado nunca cierra su asistencia, así que nunca tiene kudos: era una petición que siempre volvía vacía |

Los textos no cambian, ni en español ni en inglés.

## 3. Pruebas

- **Unitarias:** cuatro tests nuevos, uno por problema: el foco tras dar un kudos, una relectura que falla y deja el
  panel con su error, una respuesta tardía de otro plan y un plan cancelado que no pide kudos. Antes de dar el cambio
  por bueno se comprobó que **los cuatro fallan con el código anterior** y pasan con el nuevo. En total, 313 tests con
  un 96,8 % de cobertura, y lint sin errores.
- **E2E** contra el stack local, en español y en inglés: `kudos.e2e.ts` (dar «Organizó genial» al organizador de un
  plan terminado y el aviso de un kudos recibido) y `reputation.e2e.ts`: 8 de 8.
- **CI** de la PR #144 en verde: lint, tests, cobertura, compilación, imagen Docker y APK.

## 4. Incidencias

- **Docker no arrancaba tras reiniciar.** Docker Desktop se quedó con un error del *Secrets Engine*: no podía renombrar
  un *socket* viejo (`AppData\Local\docker-secrets-engine\engine.sock`, del 19/10). Se cerró Docker, se borró ese
  fichero, que Docker vuelve a crear, y arrancó.
- **Docker se cerró a mitad de las pruebas.** Lo había arrancado la sesión del asistente, y al interrumpirla se
  cerró con ella; sin Keycloak, los E2E fallaban todos al iniciar sesión (`ERR_CONNECTION_REFUSED` en el puerto 8180,
  visto en la traza de Playwright). Docker Desktop debe arrancarse desde el menú Inicio, fuera de la sesión.
- **Los E2E en Windows.** Tres cosas impidieron lanzarlos tal cual en este equipo: `e2e/serve.mjs` construye la ruta
  de `dist/` con `URL.pathname`, que en Windows da `/C:/…`; el realm se busca en `../oneleft-infra`, junto al
  frontend (se pasó con `ONELEFT_REALM`); y la grabación de vídeo necesita el ffmpeg de Playwright, que no estaba
  descargado. Se ejecutaron con Google Chrome (`channel: 'chrome'`), una copia local de `serve.mjs` con
  `fileURLToPath` y el vídeo desactivado solo durante la ejecución; nada de eso se subió. Lo de `serve.mjs` es del
  mismo tipo que frontend#141 y que `tools/lib/app.mjs` de este repositorio (entrada 45), y queda para su propia issue.
- **El *healthcheck* de la web en contenedor.** `oneleft-web` sale como *unhealthy* aunque responde: dentro del
  contenedor, `wget http://localhost:8080/healthz` va por IPv6 (`::1`) y nginx solo escucha en IPv4. Queda anotado
  para oneleft-infra.
- **Prettier en Windows.** `prettier --check` avisa en todos los ficheros por los finales de línea CRLF de la copia de
  trabajo; con LF, los ficheros del cambio están bien formateados, y Git los guarda en LF.

## 5. Resultado

El 24/10/2026, con la CI en verde y sin conflictos, se fusionaron en `dev` la PR #144 (`5cf092b`), que cerró
frontend#143, y la PR #116 de esta entrada (`ee0142a`), que cerró docs#115. Con las mejoras del panel ya fusionadas, se
cerró **HU-060** (backend#76): su último criterio, «Suman reputación (+5) y se muestran en el perfil», estaba comprobado
desde la [entrada 44](44-hu060-kudos.md) (el +5 en el libro y los kudos recibidos en el perfil de Ana). frontend#143 y
docs#115 se añadieron al tablero, en el Sprint 15, como sub-issues de HU-060.

Quedan pendientes, sin issue todavía, las dos cosas de las incidencias: la ruta de `dist/` de `e2e/serve.mjs` en Windows
y el *healthcheck* de `oneleft-web`, que va por IPv6. Se arreglaron en la
[entrada 48](48-arreglos-pendientes-y-google-en-android.md) (frontend#145 e infra#70).

