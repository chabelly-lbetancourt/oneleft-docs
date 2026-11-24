# 64 · HU-057 y HU-058: el resumen del plan y el sticker de enlace para Stories

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| frontend#33 · HU-057 Resumen del plan al estilo Strava | Historia | Could | 3 | PR #172 («Part of»); la historia sigue abierta |
| frontend#34 · HU-058 Sticker de enlace en Stories | Historia | Could | 1 | PR #173 («Part of»); la historia sigue abierta |
| docs#149 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** la tarjeta de invitación de HU-056 ([entrada 51](51-hu056-tarjeta-para-stories.md)) sirve para llenar un plan. Faltaban las otras dos mitades: enseñar un plan **que ya se hizo** y que la Story lleve a alguien **hasta el plan**. Las dos historias van juntas porque amplían el mismo componente, `app-story-share`.

## 2. HU-057: el resumen de un plan terminado

En la página de un plan con estado `FINISHED`, quien lo organizó y quien participó ve «Resumen del plan» y puede generar una imagen de **1080 × 1920** con «¡Plan hecho!», la actividad, el título, cuántas personas fueron (la cifra grande, al estilo de Strava), el día y el punto de encuentro. Se dibuja en el dispositivo, se enseña antes de compartir y se comparte con la hoja de compartir (app Android) o con la Web Share API; un navegador que no puede compartir ficheros la descarga.

| Decisión | Motivo |
|---|---|
| **Se reutiliza HU-056, no se copia:** `app-story-share` recibe un `kind` (`invite` por defecto o `summary`) y `StoryCard` gana `createSummary()`; el lienzo y el PNG son un `render()` privado común y los dos dibujos comparten `startCard()` (fondo, marca y tarjeta blanca) | La vista previa, la hoja de compartir, la descarga y el error son el mismo código |
| **El resumen no lleva enlace ni código QR**, solo el dominio de la app al pie | El plan ya terminó: nadie puede apuntarse. Tampoco carga la librería `qrcode` |
| **Colores de los tokens `--ol-story-*`**, iguales en los dos temas | Es una imagen, como en HU-056 |
| **La vista previa tiene su texto alternativo** y los textos están en `summary.*` (es/en) | Accesibilidad e i18n |

## 3. HU-058: el enlace para el sticker de Instagram

Una vez hecha la tarjeta de invitación, debajo aparece el bloque «Enlace para el sticker de Instagram»: el enlace del plan, un botón «Copiar el enlace» y cuatro pasos para añadir el sticker «Enlace» en la Story (copiar, usar la tarjeta en una Story, icono de stickers → «Enlace», pegar y «Listo»).

| Decisión | Motivo |
|---|---|
| **El enlace es la página pública del plan** (HU-024, [entrada 20](20-hu024-compartir-enlace.md)): `PlansApi.shareUrl()`, la misma dirección del QR de la tarjeta y del botón de compartir | Una sola dirección pública por plan |
| **Sin SDK de Instagram ni cuenta de Meta:** la app copia el enlace al portapapeles y explica dónde pegarlo | Una imagen compartida con la hoja de compartir no lleva enlace, y el sticker solo lo puede añadir Instagram |
| **Copiar es un botón**, no algo automático al compartir | El portapapeles solo se escribe cuando la persona lo pide |
| **Si el portapapeles no está disponible, la página lo dice** y el enlace entero queda en pantalla para copiarlo a mano | Estado degradado claro |
| **Solo en la invitación**, no en el resumen de HU-057 | Nadie puede apuntarse a un plan terminado |
| **Accesible:** el bloque es un `group` con nombre, los pasos son una lista ordenada y el resultado de copiar se anuncia en una región `role="status"` con icono y texto | No depende solo del color |

No hay canvas, servicio ni dependencia nuevos. Textos en `story.link.*` (es/en).

## 4. En la app

> **Pendiente: capturas** del resumen de un plan terminado (vista previa e imagen de 1080 × 1920) y del bloque del enlace con sus pasos. No se generaron en este hito (no se levantó el stack local).

## 5. Pruebas

- **HU-057:** 59 tests en 3 ficheros (`core/story`, `components/story-share` y el detalle del plan). Lint, build y tipos del E2E en verde. E2E nuevo en `e2e/story.e2e.ts`: un plan terminado respondido en el navegador (no crea datos), genera el resumen y comprueba que el PNG descargado mide 1080 × 1920. El dibujo se renderizó una vez en Chromium sin interfaz, fuera de la app, para comprobar que un título y un sitio largos no se salen de la tarjeta.
- **HU-058:** 64 tests en 3 ficheros, 4 nuevos (el enlace y los pasos, copiar y anunciar, fallo del portapapeles y reinicio al cerrar, y que el resumen no tiene enlace). E2E nuevo en el mismo fichero: un plan abierto respondido en el navegador, comprueba los pasos y que el enlace es `/share/plans/<id>`, lo copia y lo lee del portapapeles.
- Los E2E no se ejecutaron en local (necesitan el stack); pasaron en la CI de las dos PR.

## 6. Qué queda de cada historia

| Casilla sin marcar | Por qué |
|---|---|
| HU-057 · «4 personas · pádel · 90 min · Vallecas» con fotos del álbum (HU-052) | Las **fotos** dependen del álbum, que hoy solo existe en el backend ([entrada 65](65-hu052-recuerdos-del-plan-backend.md)): falta la galería en la web. La **duración** («90 min») no se puede pintar: la API no da hora de fin ni duración. El **barrio** («Vallecas») tampoco existe en la API; se pinta el nombre del punto de encuentro |
| HU-057 · Se comparte con la hoja nativa | El código es el mismo `NativePlatform.shareImage` de HU-056, cubierto con un test unitario, pero **no se ha probado en un Android real** |
| HU-058 · Abre la app si está instalada | No se puede hacer solo en el frontend. La app Android solo responde a `oneleft://callback` (el inicio de sesión). Hay dos caminos: **Android App Links** sobre `https://<host>/share/plans/…` (filtro de *intent* con el host de cada entorno, `/.well-known/assetlinks.json` servido desde ese host con la huella del certificado de firma de la *release* y la ruta atendida en la app; solo se verifica con un APK firmado en un Android real contra un host desplegado, y el navegador interno de Instagram no siempre cede los enlaces a otras apps), o un **esquema propio** (`oneleft://plans/<id>`) con un paso «abrir en la app» en la página pública, que la genera el servicio `plans` (backend) |

## 7. Pendiente

- **Decisiones por confirmar:**
  - **quién cuenta como «personas» en el resumen:** hoy, la organizadora más quienes se apuntaron (`participants.length + 1`), no quienes hicieron check-in;
  - que el sitio sea el nombre del punto de encuentro;
  - que el resumen se ofrezca solo en `FINISHED` (no en `IN_PROGRESS` ni en `CANCELLED`) y solo a la organizadora y a los participantes;
  - **cómo abrir la app desde el enlace:** App Links o esquema propio (apartado 6);
  - que las instrucciones sean solo para Instagram. Los nombres de sus botones («Enlace», «Listo») son los de la app de Instagram hoy y pueden cambiar.
- **Sin verificar en un Android real ni en Instagram:** la hoja de compartir, el portapapeles dentro del WebView de la app y el propio sticker.
- Capturas (apartado 4).
