# 62 · HU-063: ventajas por reputación

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#79 · HU-063 Ventajas por reputación | Historia | Should | 5 | PR #150, cerrada |
| frontend#174 · Ventajas por reputación en la web y la app | Historia | Should | | PR #175, cerrada |
| docs#149 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** los niveles de HU-062 ([entrada 60](60-hu062-niveles-y-rachas.md)) eran solo un nombre junto a la puntuación. Con HU-063 el nivel da ventajas reales, para que merezca la pena ser buena compañía.

## 2. Reglas

**Ventajas por nivel.** Los números están solo en el servicio `reputation` (constantes de `Perks`); los demás servicios los piden o los copian, nunca los calculan.

| Nivel | Prioridad en la lista de espera | Peso en los avisos | Planes a la vez | Alertas guardadas |
|---|---|---|---|---|
| `NEW` (Nuevo) | 0 | 1,0 | 5 | 5 |
| `REGULAR` (Habitual) | 1 | 1,1 | 6 | 6 |
| `NEIGHBOURHOOD_REFERENCE` (Referente del barrio) | 2 | 1,25 | 8 | 8 |
| `LEGEND` (Leyenda) | 3 | 1,5 | 10 | 10 |

| Ventaja | Servicio | Cómo se aplica |
|---|---|---|
| Prioridad en la lista de espera (HU-023, [entrada 18](18-hu023-salir-y-lista-de-espera.md)) | `plans` | Quien tiene más prioridad espera delante; entre iguales se mantiene el orden de llegada |
| Más peso en los avisos (HU-012, [entrada 53](53-hu012-avisar-a-quien-mas-probabilidad-tiene.md)) | `notifications` | La probabilidad del modelo de aceptación se multiplica por el peso antes de ordenar las tandas |
| Más planes a la vez | `plans` | Límite **nuevo** de planes publicados, no cancelados y sin empezar: 5 para todo el mundo y hasta 10 con el nivel. Por encima, `409 plan.tooManyActive` con el límite en `max` |
| Alertas guardadas extra (HU-036, [entrada 29](29-hu036-alertas-guardadas.md)) | `notifications` | El límite de 5 que ya existía pasa a 6, 8 o 10 con el nivel (`409 alerts.limit`, como antes) |

**Sello «Organizador de confianza».** Lo tiene quien cumple las dos condiciones: nivel `REGULAR` o superior **y** 5 o más planes organizados que se celebraron (`TRUSTED_ORGANIZER_LEVEL` y `TRUSTED_ORGANIZER_PLANS`). Una buena puntuación sola no basta.

## 3. Decisiones

| Decisión | Motivo |
|---|---|
| **La prioridad se fija al entrar en la lista de espera** (`plan_waitlist.priority`, migración `V17` de `plans`) y no se recalcula | Un cambio de nivel posterior no reordena una lista en la que ya hay gente esperando |
| **El peso solo se aplica al orden del modelo**; la regla por distancia (`NOTICES_STRATEGY=distance`) y la de reserva no tienen pesos | La regla por distancia es la línea base de HU-012 y debe seguir siendo comparable |
| **`plans` pregunta las ventajas con el token de quien actúa** (`GET /api/v1/reputation/me/perks`), solo al entrar en una lista de espera y cuando la organizadora llega al límite de todo el mundo | `plans` tiene el token de la persona; es el mismo reparto que en HU-070 ([entrada 57](57-hu070-fecha-de-nacimiento-y-publico.md)) para el género y la edad |
| **`notifications` guarda una copia** (`member_perks`, migración `V6`) que se rellena con el evento nuevo `reputation.perks-changed` (exchange `oneleft.reputation`, cola durable `notifications.perks`) | Ordena los avisos sin token, así que no puede preguntar por cada persona |
| **El evento se publica después del commit y solo cuando los puntos cambian el nivel**, al subir o al bajar; gana el más reciente | A los demás servicios solo les importa el nivel, no cada apunte |
| **Una ventaja nunca hace fallar nada:** sin token (el seed) o sin respuesta de `reputation`, la persona tiene lo que tiene todo el mundo | La reputación es un extra, no una dependencia de publicar o apuntarse |
| **La copia de `notifications` se borra con la cuenta y entra en la exportación de datos** (HU-045, [entrada 52](52-hu045-exportar-y-borrar-mis-datos.md)) | Es un dato de la persona |
| **API:** endpoint nuevo `GET /api/v1/reputation/me/perks` y campo `trustedOrganizer` en `/me`, `/people/{userId}` y `/scores?ids=…` | La lista de planes ya pide `/scores`: el sello del organizador llega sin otra llamada |
| **En la web todos los campos nuevos son opcionales** y, si falla `/me/perks`, se oculta «Mis ventajas» y el resto de la página sigue | El job de E2E usa las imágenes `:pre`, que aún no tienen HU-063 |
| **El sello es texto visible**, no un icono con *tooltip*, en el color del texto | Accesibilidad: no depende del icono ni de un color |
| **La web no calcula ningún número:** pinta los que da el servicio (`noticeWeight` 1,1 se cuenta como «10 %») | Los valores viven en un solo sitio |

## 4. En la app

- **Sello «Organizador de confianza»** (icono de verificación y texto) detrás del nivel, en mi perfil, en el perfil social de una persona, junto al organizador en la lista de planes cercanos y en el detalle del plan. En pantallas estrechas la insignia salta de línea en vez de desbordarse.
- **«Mis ventajas» en «Mi reputación»:** lo que da mi nivel con palabras: si voy delante en las listas de espera (sin el número de prioridad), cuánto más probable es que me avisen entre los primeros de un plan cercano, cuántos planes puedo tener publicados a la vez y cuántas alertas puedo guardar; además, el sello o cómo se consigue.
- **Alertas guardadas:** el límite de la página es mi `maxSavedAlerts`; el 5 fijo queda solo como reserva si el endpoint falla.
- **Formulario de publicar:** `409 plan.tooManyActive` se traduce con su `max` («Ya tienes 5 planes publicados sin empezar, el máximo de tu nivel…»), en español y en inglés.

> **Pendiente: capturas** del sello en el perfil y en la lista de planes, y de «Mis ventajas» en «Mi reputación». No se generaron en este hito (no se levantó el stack local).

## 5. Pruebas

- **Backend:** 127 tests unitarios en verde en local (`reputation`, `notifications` y `plans`: ventajas, niveles, racha, alertas, orden de los avisos, lista de espera, publicación y arquitectura hexagonal). Los de integración usan Testcontainers y se ejecutaron solo en la CI, en verde; borran lo que crean: `PerksIntegrationTest` (`/me/perks`, 401 sin token, cada persona solo recibe sus ventajas, el sello en `/scores` y `/people`, y el evento por un RabbitMQ real), `PerkCopiesIntegrationTest` (la copia en PostgreSQL rellenada por el evento), `PerksControllerTest` (orden de la lista de espera y promoción, `409 plan.tooManyActive`, 401 sin token) y `PersonalDataIntegrationTest` (la copia se borra con la cuenta).
- **Web:** 165 tests en 11 ficheros (insignia, ticket del plan, reputación, alertas guardadas, errores de la API, planes cercanos, detalle, publicar, perfil y persona); no se pasó la suite completa en local. Lint, build y tipos del E2E en verde. `e2e/reputation.e2e.ts` responde `/me/perks` y `trustedOrganizer` en el navegador (no crea datos) y comprueba el sello y «Mis ventajas»; no se ejecutó en local y pasó en la CI de la PR.

## 6. Incidencias

- **La primera CI de la PR #150 falló por un evento duplicado.** `PerksIntegrationTest.reachingALevelTellsTheOtherServicesWhatItIsWorth` esperaba un solo `reputation.perks-changed` y llegaron dos. Un check-in suma dos veces en la misma transacción: sus puntos y la bonificación de la racha (HU-062). La puntuación se actualiza con una consulta nativa, y al sumar la racha el servicio leía la puntuación **anterior**, que seguía en la caché de primer nivel de JPA; con ese dato viejo volvía a ver el paso de nivel y lo anunciaba otra vez. Se arregló en un segundo commit: la consulta lleva `@Modifying(flushAutomatically = true, clearAutomatically = true)`, así que la siguiente lectura va a la base de datos. El test comprueba además la puntuación final (95 + 10 + 5). La segunda CI pasó en verde. Los tests unitarios, con dobles en memoria, no podían verlo.
- **Hallazgo: no hay forma de cancelar un plan.** La API no tiene ningún endpoint para que la organizadora cancele un plan, así que el mensaje de `plan.tooManyActive` solo puede decir que se espere a que empiece uno. Tiene otra consecuencia: los E2E que publican planes de verdad (como `e2e/publish.e2e.ts`) no pueden borrarlos al terminar, y cuando el límite nuevo de 5 planes sin empezar llegue a las imágenes `:pre` acabarán chocando con él (el Compose de los E2E no tiene servicio `reputation`, así que `plans` aplica el límite de todo el mundo). Se ha abierto la tarea [oneleft-backend#152](https://github.com/chabelly-lbetancourt/oneleft-backend/issues/152) para añadir la cancelación (`DELETE /api/v1/plans/{planId}`, solo la organizadora y antes de que el plan empiece).

## 7. Pendiente

- **Operativo, tras desplegar:** lanzar una vez `POST /api/v1/reputation/scores/rebuild` (administración). El evento solo sale cuando cambia un nivel, así que quien ya tenía nivel no está en la copia de `notifications` hasta entonces; la reconstrucción anuncia ahora las ventajas de todas las personas con puntuación.
- **Decisiones por confirmar:**
  - los valores de la tabla de ventajas;
  - la regla del sello (nivel `REGULAR` y 5 planes organizados que se celebraron);
  - **el límite de planes a la vez es nuevo** (5 para todo el mundo): es la única ventaja que restringe algo que antes era libre, y se aplica a todas las personas desde el despliegue;
  - que la prioridad se fije al entrar en la lista de espera;
  - que el sello sea texto visible (alarga la línea del organizador en la lista de planes).
- **Cancelar un plan:** tarea [oneleft-backend#152](https://github.com/chabelly-lbetancourt/oneleft-backend/issues/152), abierta. Cuando esté, hay que adaptar los E2E para que cancelen los planes que publican, antes de que el límite llegue a `pre`.
- **La regla del sello está copiada en las traducciones** de la web («Nivel Habitual y 5 planes organizados que se celebraron»): si cambia en el backend, hay que cambiar el texto.
- Dos publicaciones en el mismo instante podrían pasar el límite por uno (no hay bloqueo); se acepta por ser un límite blando.
- Según la PR #175, el sello y «Mis ventajas» no se han visto en un navegador ni en la app Android: solo los cubren los tests unitarios y el E2E.
- Capturas (apartado 4).
