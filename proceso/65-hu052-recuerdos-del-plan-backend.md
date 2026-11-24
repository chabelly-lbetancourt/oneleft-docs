# 65 · HU-052: recuerdos del plan (parte de backend)

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#71 · HU-052 Recuerdos del plan | Historia | Could | 5 | PR #151 («Part of»); la historia sigue abierta |
| docs#149 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** un plan terminado no dejaba nada. Un álbum de fotos compartido por quienes fueron guarda el recuerdo y es lo que necesita el resumen de HU-057 ([entrada 64](64-hu057-hu058-resumen-y-sticker-para-stories.md)) para llevar fotos. Esta entrada cubre solo el backend: la galería en la web está por hacer.

## 2. Reglas

| Regla | Valor |
|---|---|
| Quién sube, ve y borra | Solo el grupo del plan: quien lo organiza y quienes participan. El resto recibe `403 plan.notParticipant` en las cuatro operaciones, antes de cualquier otra comprobación |
| Cuándo se puede subir | Cuando el plan ha terminado: 3 horas después de su inicio (`Plan.endsAt()`). Un plan cancelado no admite fotos. Antes, `409 memory.planNotFinished`. No hay plazo máximo para añadir fotos después |
| Formato y tamaño | WebP o JPEG, hasta 2 MiB por foto (`400 memory.format`, `memory.empty`, `memory.tooBig`) |
| Límites del álbum | 10 fotos por persona y álbum, y 100 por álbum (`409 memory.personLimit`, `memory.planLimit`) |
| Borrar | Cada persona borra solo sus fotos (`403 memory.notYours`); quien organiza no tiene más poder |
| Listar | Páginas desde 0, de 1 a 50 fotos y 20 por defecto, las más recientes primero (`400 page.invalid`) |
| Enlaces firmados | 5 minutos para subir y 1 hora para ver; el *bucket* es privado |
| Subidas sin confirmar | Se borran del almacenamiento la siguiente vez que esa persona pide un enlace para ese álbum, cuando tienen más de una hora |

El grupo puede leer el álbum en cualquier momento (vacío hasta que el plan termina).

## 3. Cómo se sube una foto

Es el mismo mecanismo que la foto de perfil (HU-020, [entrada 40](40-hu020-foto-de-perfil.md)): **la foto nunca pasa por el backend**.

1. `POST /api/v1/plans/{planId}/memories/uploads` con el tipo y el tamaño: devuelve una clave y un enlace firmado que solo acepta un `PUT` de ese tipo y ese tamaño.
2. El cliente hace el `PUT` de los bytes directamente al almacenamiento.
3. `POST /api/v1/plans/{planId}/memories` con la clave: el servicio comprueba en el almacenamiento el tamaño, el tipo y **los primeros bytes** de lo que se subió de verdad. Un fichero que solo dice ser una foto se borra y se responde `400 memory.notAPhoto`. Repetir la confirmación devuelve la misma foto.
4. `GET /api/v1/plans/{planId}/memories?page=0&size=20` lista el álbum con enlaces firmados para ver cada foto.
5. `DELETE /api/v1/plans/{planId}/memories/{memoryId}` borra una foto propia.

## 4. Decisiones

| Decisión | Motivo |
|---|---|
| **El álbum vive en `plans`**, no en `users` | Es un dato del plan, y todas sus reglas las responde lo que `plans` ya tiene: quién está en el grupo, cuándo termina, el borrado de la cuenta y la exportación de datos. En `users` haría falta una llamada a `plans` en cada petición |
| **`plans` tiene su propio adaptador de almacenamiento** (mismo *bucket* y mismas variables `STORAGE_*` que `users`, objetos bajo `memories/` en vez de `photos/`) | Cada servicio del repositorio tiene sus adaptadores. `plans` usa ahora `software.amazon.awssdk:s3`: no es una librería nueva en el proyecto (mismo artefacto y versión que `users` desde HU-020, gestionada por el BOM del `pom.xml` padre), pero sí en este módulo |
| **La clave es `memories/<usuario>/<plan>/<aleatorio>.<ext>`**; nunca se usa el nombre original del fichero, y una clave solo se acepta de la persona y para el plan a los que se dio | Evita nombres controlados por el usuario y que alguien confirme la subida de otra persona |
| **La confirmación bloquea la fila del plan** (`SELECT … FOR UPDATE`) | Dos fotos a la vez no pueden ocupar las dos el último hueco |
| **«Tras terminar» se decide por la hora**, no por el estado que la tarea del ciclo de vida actualiza algo después | El álbum se abre en cuanto pasa la hora, sin esperar a esa tarea |
| **No ser del grupo es `403`** con el código que ya existía, `plan.notParticipant` (los check-ins responden `409` con ese mismo código) | Un 403 es el estado correcto para un permiso |
| **Cuenta y datos personales (HU-045, [entrada 52](52-hu045-exportar-y-borrar-mis-datos.md)):** las fotos salen en `memories` de `GET /api/v1/plans/me/data` y se van con la cuenta, del álbum y del almacenamiento (todo lo que hay bajo `memories/<usuario>/`) | Son datos personales |
| **Si el almacenamiento no responde al borrar una cuenta**, se borra el resto y se registra un `ERROR` con la carpeta que hay que borrar a mano | El borrado llega como evento por una cola sin *dead-letter queue*: fallar lo reintentaría para siempre y bloquearía el resto del borrado |
| **Migración `V18__plan_memories.sql`:** solo añade la tabla `plan_memory` | Es inofensiva para la versión anterior |

## 5. Pruebas

- **Unitarias, en local:** 31 tests en verde (`MemoryTest`, `MemoryServiceTest`, `PersonalDataServiceTest`, `S3MemoryStorageTest` y la arquitectura hexagonal).
- **Integración, solo en la CI, en verde:** `MemoryIntegrationTest`, con PostgreSQL y un almacenamiento compatible con S3 real (Versity S3 Gateway, como en `users`): subir por el enlace firmado y leer la foto, 401 sin token en las cuatro operaciones, 403 para quien no participó, 404 para un plan que no existe, un fichero de tipo falso rechazado y borrado, un enlace que solo acepta aquello para lo que se firmó, los dos límites, las páginas, que cada persona solo borra lo suyo, y las fotos en la exportación y borradas con la cuenta. Borra los planes, las filas y las fotos que crea.
- **Sin verificar en local:** todo lo que necesita Docker (los tests de integración y la migración `V18` contra un PostgreSQL real). No se ha probado contra la web ni contra un almacenamiento desplegado.

## 6. Qué queda de la historia

Solo está marcada la casilla «Solo pueden subir fotos los participantes».

| Casilla sin marcar | Por qué |
|---|---|
| Álbum compartido del plan tras terminar, en Amazon S3 | El backend está hecho, pero falta la **galería en la web** (ver, subir y borrar fotos) y que `oneleft-infra` dé a `plans` las variables `STORAGE_*` |
| Visible según la privacidad del plan | Los planes no tienen ajuste de privacidad. Se ha tomado la lectura más simple (álbum privado del grupo) y la casilla se deja sin marcar hasta confirmarla |
| Moderación de imágenes (HU-011) | HU-011 aún no existe |

## 7. Pendiente

- **Infraestructura:** `oneleft-infra` tiene que dar a `plans` las variables `STORAGE_*` de `users`, en los dos Compose y en el Compose de los E2E del frontend. Sin ellas `plans` arranca y funciona como antes, y solo el álbum responde `503 memory.unavailable`.
- **Galería en la web y la app** (parte de frontend de la historia).
- **Decisiones por confirmar:**
  - **la privacidad del álbum:** privado del grupo del plan;
  - **los límites:** 2 MiB por foto, 10 por persona y álbum, 100 por álbum, solo WebP y JPEG (constantes de `MemorySize` y `Memory`);
  - que el álbum viva en `plans` con su propio adaptador;
  - que «tras terminar» sea por la hora (3 horas después del inicio) y sin plazo para añadir fotos;
  - **los bloqueos (HU-033, [entrada 50](50-hu033-bloquear-y-reportar.md)) no se aplican dentro del álbum**, como en el resto de lo que ve el grupo (quién ha llegado, el chat): dos personas que se bloquearon ven las fotos de la otra en ese plan;
  - que quien organiza no pueda borrar fotos de otras personas.
- **No incluido:** avisar al grupo de fotos nuevas (SSE o push).
- **Deuda:** el borrado de una cuenta con el almacenamiento caído deja fotos que hay que borrar a mano; la solución completa es un reintento con *dead-letter queue*.
- El servicio `plans` arranca dos clientes de S3 y, en desarrollo, comprueba o crea el *bucket* al arrancar (un aviso si el almacenamiento no está).
- Capturas: no hay cambio visible en la interfaz (solo backend).
