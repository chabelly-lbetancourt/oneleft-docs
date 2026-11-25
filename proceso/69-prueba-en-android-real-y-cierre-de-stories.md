# 69 · La prueba en un Android real y el cierre de las historias de Stories

**Fecha:** 25/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| frontend#30 · HU-042 Cómo llegar al punto de encuentro | Historia | Could | 2 | comprobada en el móvil; cerrada |
| frontend#32 · HU-056 Tarjeta para Stories | Historia | Should | 3 | cerrada por decisión de la autora |
| frontend#33 · HU-057 Resumen del plan al estilo Strava | Historia | Could | 3 | cerrada por decisión de la autora |
| frontend#34 · HU-058 Sticker de enlace en Stories | Historia | Could | 1 | cerrada por decisión de la autora |
| frontend#182 · Stories: mejoras pendientes y comprobaciones en un dispositivo real | Tarea | Could | 5 | abierta, en `Backlog` |
| frontend#183 · La app se ve rota y la tarjeta falla en un WebView antiguo | Bug | | | abierta |
| docs#153 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** HU-042, HU-056 y HU-057 seguían abiertas por lo mismo: una casilla que solo se puede comprobar en Android ([entradas 63](63-hu042-como-llegar-al-punto-de-encuentro.md) y [64](64-hu057-hu058-resumen-y-sticker-para-stories.md)). El emulador no era utilizable en el equipo de 8 GB ([entrada 61](61-e2e-padel-surf.md)), así que hacía falta un móvil.

## 2. Cómo se hizo la prueba

| | |
|---|---|
| Dispositivo | Samsung Galaxy A20e (SM-A202F), Android 11 |
| Android System WebView | 94.0.4606.61 |
| Conexión | Por cable, con `adb reverse` contra el stack local mínimo |
| App | APK de depuración local, compilado desde `dev` (`npm run android:local` y `npm run android:apk`) |

La prueba fue manual. De ella solo quedan las issues: no hay capturas ni registros guardados en los repositorios.

> **Pendiente: capturas** del móvil (Google Maps con el punto de encuentro y la app sin estilos en el WebView 94). No se guardaron durante la prueba.

## 3. Resultados

| Qué | Resultado |
|---|---|
| Inicio de sesión | Falló al principio, por el reloj del móvil (apartado 4). Corregida la hora, funcionó |
| HU-042 · Enlace «Abrir en la app de mapas» | **Comprobado** (apartado 5) |
| HU-056 y HU-057 · Crear la tarjeta | **Falló:** «No se ha podido crear la tarjeta. Inténtalo de nuevo.» (apartado 6) |
| HU-056 y HU-057 · Hoja nativa de compartir | **No se pudo comprobar:** sin tarjeta no hay nada que compartir |
| Aspecto general de la app | Casi sin estilos en ese WebView (apartado 6) |

## 4. Incidencia: el reloj del móvil

El móvil llevaba tiempo apagado y sin red, y su reloj estaba en julio de 2021. Al iniciar sesión, la app rechazó el token con «id_token was issued too far away from the current time».

**Es el comportamiento correcto:** el cliente OIDC comprueba que el token se ha emitido cerca de la hora actual, y con el reloj cinco años atrás no lo estaba. No se cambió nada en la app; se corrigió la hora del móvil y el inicio de sesión funcionó.

## 5. HU-042: el enlace `geo:` abre la app de mapas

Lo que la [entrada 63](63-hu042-como-llegar-al-punto-de-encuentro.md) dejó sin comprobar era si el WebView de Capacitor entrega al sistema las URL que no son de la app. **Sí lo hace:** al pulsar el enlace, Android lanzó una intención `VIEW` con `geo:40.3968,-3.6221?q=…(Café La Partida)` y se abrió Google Maps con el punto de encuentro.

Con eso se marcó la última casilla («Enlace para abrir la navegación en la app de mapas del dispositivo») y la historia frontend#30 se cerró.

## 6. Hallazgo: la app no funciona en un WebView antiguo

El Android System WebView del móvil era la versión 94 (de 2021). Dos efectos, recogidos en el bug frontend#183:

- **La tarjeta para Stories y el resumen no se pueden crear.** `story-card.ts` dibuja la tarjeta con `CanvasRenderingContext2D.roundRect`, que existe a partir de Chrome/WebView 99. En el WebView del móvil, `typeof CanvasRenderingContext2D.prototype.roundRect` es `undefined`.
- **La app entera se ve casi sin estilos:** botones planos, sin colores y contenido que se sale por la derecha. La causa exacta no se ha investigado.

En los dos casos la app no da ninguna pista de por qué. El bug propone decidir el WebView mínimo que se soporta y fijarlo con `android.minWebViewVersion` en la configuración de Capacitor, que enseña una página pidiendo actualizarlo; como opción, dibujar el rectángulo redondeado sin `roundRect` cuando no exista.

No se había visto antes porque los tests unitarios simulan el lienzo (`roundRect` es un doble en `story-card.spec.ts`) y las pruebas en Android se habían hecho en emuladores con API 36 y 37 ([entrada 32](32-app-android-verificada.md)), cuya versión de WebView no está anotada pero es previsiblemente reciente.

## 7. El cierre de HU-056, HU-057 y HU-058

Por decisión de la autora, las tres historias se cerraron el 25/11/2026: su código está fusionado y cubierto por tests, y lo que no se ha podido hacer o comprobar pasa a una tarea aparte, frontend#182, **para que no cuente como hecho**.

| Historia | Cómo queda la casilla | Qué pasa a frontend#182 |
|---|---|---|
| HU-056 · Tarjeta para Stories ([entrada 51](51-hu056-tarjeta-para-stories.md)) | «Se comparte con la hoja nativa»: marcada con la nota «implementado y cubierto por tests; sin comprobar en un Android real» | Comprobar la hoja de compartir en un Android con el WebView al día |
| HU-057 · Resumen del plan ([entrada 64](64-hu057-hu058-resumen-y-sticker-para-stories.md)) | El criterio se reescribió como lo implementado («personas, actividad, día y punto de encuentro»); la hoja nativa, con la misma nota | Las fotos del álbum (HU-052, [entrada 68](68-hu052-recuerdos-del-plan-cierre.md)), la duración y el barrio («90 min · Vallecas»), que la API no da, y la misma comprobación de la hoja de compartir |
| HU-058 · Sticker de enlace ([entrada 64](64-hu057-hu058-resumen-y-sticker-para-stories.md)) | El criterio «Abre la app si está instalada» sale de la historia | Abrir la app desde el enlace: Android App Links (APK firmado y host desplegado) o esquema propio con un paso en la página pública del backend. Necesita una decisión |

## 8. Pendiente

- **La hoja nativa de compartir sigue sin comprobarse en ningún Android real** (frontend#182). Hace falta un dispositivo con el Android System WebView al día, o actualizar el del Galaxy A20e y repetir la prueba. El código (`NativePlatform.shareImage`, con Capacitor Share y Filesystem) solo lo cubren tests unitarios.
- **Bug frontend#183, abierto:** decidir el WebView mínimo y qué ve quien no lo cumple. La issue no está en el tablero: no tiene prioridad, puntos ni sprint.
- **Sin investigar:** por qué la app pierde los estilos en el WebView 94.
- Siguen sin comprobarse en un Android real ni en Instagram el portapapeles dentro del WebView y el propio sticker de enlace ([entrada 64](64-hu057-hu058-resumen-y-sticker-para-stories.md)).
- Las demás decisiones por confirmar de las entradas [63](63-hu042-como-llegar-al-punto-de-encuentro.md) y [64](64-hu057-hu058-resumen-y-sticker-para-stories.md) siguen abiertas.
- Capturas (apartado 2).
