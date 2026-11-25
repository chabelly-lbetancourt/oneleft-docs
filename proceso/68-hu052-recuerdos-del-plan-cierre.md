# 68 · HU-052: recuerdos del plan, la galería y el cierre de la historia

**Fecha:** 25/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#71 · HU-052 Recuerdos del plan | Historia | Could | 5 | cerrada el 25/11/2026 (backend en la PR #151, [entrada 65](65-hu052-recuerdos-del-plan-backend.md)) |
| frontend#176 · Recuerdos del plan en la web y la app | Historia | Could | 5 | PR #177, cerrada |
| infra#79 · Dar la configuración del almacenamiento al servicio `plans` | Tarea | Should | 1 | PR #80, cerrada |
| docs#153 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** la [entrada 65](65-hu052-recuerdos-del-plan-backend.md) dejó el álbum hecho solo en el backend. Faltaban tres cosas para cerrar la historia: la galería, que `plans` tuviera el almacenamiento en los Compose y dos decisiones de la autora.

## 2. Infraestructura: `plans` recibe el almacenamiento

- **Bloque compartido `x-storage`** en `compose.yaml` y `compose.prod.yaml`, que `users` y `plans` combinan: las variables `STORAGE_*` no pueden divergir entre los dos servicios. El entorno de `users` queda igual; no cambia ningún valor ni hay variables nuevas.
- **`plans` espera al almacenamiento** donde ya lo hacía `users` (`compose.yaml` y `compose.prod.local.yaml`).
- El límite de memoria de `plans` (640 MB) no se toca.
- `README.md`, `PRODUCCION.md`, `.env.example` y `.env.prod.example` dicen que los dos servicios usan el *bucket* (`plans`, bajo el prefijo `memories/`).

Solo se ejecutó `docker compose config` sobre las tres definiciones: no se arrancó ningún contenedor.

## 3. La galería en la web y la app

Sección «Recuerdos» en el detalle de un plan `FINISHED`, solo para quien lo organizó y quienes participaron (componente nuevo `app-plan-memories`, debajo de los kudos).

| Parte | Cómo |
|---|---|
| **Galería** | Lista en rejilla (2 fotos por fila en el móvil, 3 a partir de 40 rem), cada foto con quién la subió, texto alternativo con sentido («Foto de Ana, subida el 21 de noviembre de 2026, 19:05»), `loading="lazy"` y «Ver más fotos» de 20 en 20 («20 de 43 fotos»). Una foto cuyo enlace firmado ya no carga enseña un hueco con texto |
| **Subir** | Selector de ficheros, varias a la vez, una detrás de otra. Cada foto se prepara en el navegador antes de salir del dispositivo: entera (sin recortar), lado mayor de 1600 px como máximo, WebP o JPEG, y se prueban lados menores (1280, 960, 720) hasta que cabe en los 2 MiB del servicio. Después, enlace firmado → `PUT` de los bytes → `POST` con la clave. Un `<progress>` con «Subiendo la foto 1 de 3…» |
| **Quitar** | Solo mis fotos tienen «Quitar», con confirmación («¿Quitar esta foto del álbum?») |
| **Estados** | Cargando (esqueletos y `role="status"`), vacío y error |

| Decisión | Motivo |
|---|---|
| **Se reutiliza HU-020** ([entrada 40](40-hu020-foto-de-perfil.md)): `square-photo.ts` exporta ahora `readPhoto` y `encodePhoto`, y `memory-photo.ts` se apoya en ellas | Las comprobaciones y la codificación son las mismas que en la foto de perfil, que se comporta como antes |
| **El `PUT` al almacenamiento lleva solo las cabeceras del enlace firmado, sin token** | El almacenamiento no es una ruta de la API: el token de OneLeft no debe viajar allí (lo comprueba el E2E) |
| **Los límites (10 por persona, 100 por álbum) los dice el servicio** (`memory.personLimit`, `memory.planLimit`); la app no los cuenta | Los valores viven en un solo sitio. La ayuda de la sección dice «Hasta 10 por persona» |
| **La siguiente página se calcula con lo que ya se ve**, saltando lo que ya está | Las fotos añadidas o quitadas entretanto no se repiten |
| **Degradación limpia:** si la primera página falla con `404` (un servicio sin álbum, como las imágenes `:pre`), con `403` o con algo que no es una página, la sección no aparece; con cualquier otra cosa (`503 memory.unavailable`, servicio caído), dice que ahora no se pueden ver los recuerdos y ofrece «Reintentar» | El resto del plan no se ve afectado nunca |
| **Todos los códigos de error del álbum traducidos** (`errors.memory.*`, es/en), más los textos de reserva sin código | Ningún error sin texto |
| **Accesibilidad:** sección con nombre, semántica de lista, botones con nombre propio (el de quitar dice qué foto), confirmación como `group` con nombre, resultado de subir y quitar en una región `role="status"` siempre presente, y foco llevado a donde pasan las cosas | No depende del color ni del ratón |

Colores solo de los tokens `--ol-*`, en los dos temas. Ninguna dependencia nueva.

> **Pendiente: capturas** de la sección «Recuerdos» (galería, subida con progreso, confirmación al quitar y estado degradado). No se generaron en este hito.

## 4. El cierre de la historia

La [entrada 65](65-hu052-recuerdos-del-plan-backend.md) dejó tres casillas sin marcar. Así se han resuelto:

| Casilla | Resolución |
|---|---|
| Álbum compartido del plan tras terminar, en Amazon S3 | Marcada: backend (PR #151), galería (PR #177) y configuración (PR #80) fusionados |
| Visible según la privacidad del plan | Marcada por decisión de la autora: los planes no tienen ajuste de privacidad, y **acepta el álbum privado del grupo** (solo lo ven la organizadora y quienes participaron) como lectura de este criterio |
| Moderación de imágenes (HU-011) | **Sale de la historia y pasa a HU-011** (backend#14), donde se hará junto con la de planes y mensajes. HU-011 tiene ahora el criterio «Moderación de las imágenes de los álbumes de recuerdos» |

La historia backend#71 se cerró el 25/11/2026 y está en `Done` en el tablero, en el Sprint 19.

## 5. Pruebas

- **Web:** 102 tests en 8 ficheros. Cobertura del código nuevo: `plan-memories.ts` 117 de 120 líneas, `memories-api.ts` y `memory-photo.ts` al 100 %. No se pasó la suite completa en local. Lint, build (paquete inicial de 738 kB, por debajo del aviso de 750 kB) y tipos del E2E en verde.
- **E2E nuevo `e2e/memories.e2e.ts`:** el plan, su álbum y el almacenamiento se responden en el navegador (no crea nada). Ve la foto de otra persona sin «Quitar», sube una imagen real (comprueba WebP, ≤ 2 MiB y que el `PUT` no lleva `Authorization`) y la quita tras confirmar. No se ejecutó en local; pasó en la CI de la PR #177.
- **Infraestructura:** `docker compose config --quiet` sobre las tres definiciones y la CI de la PR #80, en verde.

## 6. Pendiente

- **No verificado contra el backend y el almacenamiento reales:** según la PR #177, la galería no se ha visto en un navegador ni en la app Android, y la subida real solo la cubren los tests unitarios y el E2E con la API simulada. La PR #80 tampoco arrancó contenedores.
- **La sub-issue frontend#176 se cerró con una casilla sin marcar:** «WCAG 2.2 AA: teclado, foco visible, nombres accesibles y `aria-live`». Los patrones están aplicados, pero no hay auditoría con axe ni con lector de pantalla.
- **El stack de los E2E recibirá el almacenamiento de `plans` con la promoción a `pre`:** el job de E2E del frontend usa el `compose.yaml` de `oneleft-infra` de la rama `pre` más sus propios ajustes (`e2e/compose.e2e.yaml`), así que no necesita un cambio propio, pero hasta que la PR #80 se promocione `plans` no tiene allí las variables `STORAGE_*`. El E2E del álbum no depende de ello, porque responde la API en el navegador.
- **Decisiones por confirmar:**
  - las fotos no se recortan y suben a 1600 px como máximo; en la rejilla se ven cuadradas (`object-fit: cover`) y **no hay vista ampliada**;
  - al elegir varias fotos, la primera que falla detiene las demás (las anteriores se quedan en el álbum);
  - que un `403 plan.notParticipant` en la primera página oculte la sección en vez de enseñar un error;
  - la posición de la sección: después de los kudos y antes de «Reportar el plan».
- Siguen abiertas las decisiones del backend de la [entrada 65](65-hu052-recuerdos-del-plan-backend.md) (límites, bloqueos dentro del álbum, que quien organiza no borre fotos ajenas).
- **Las fotos del álbum en el resumen para Stories (HU-057)** pasan a frontend#182 ([entrada 69](69-prueba-en-android-real-y-cierre-de-stories.md)).
- **No incluido:** avisar al grupo de fotos nuevas.
- Capturas (apartado 3).
