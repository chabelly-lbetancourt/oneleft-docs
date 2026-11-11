# 57 · HU-070: fecha de nacimiento, género y público del plan

**Fecha:** 11/11/2026 · **Sprint:** 17 (06/11–12/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#100 · HU-070 Planes por género y edad | Historia | Should | 3 | PR #139, #142 |
| frontend#63 · Fecha de nacimiento, género y público del plan | Historia | Should | 3 | PR #159, #160 |
| docs · Documentación (esta entrada) | Documentación | Should | 1 | esta entrada |

**Por qué:** hay planes pensados solo para mujeres, para hombres o para un rango de edad. El organizador lo indica al publicar y el sistema lo comprueba, no solo la interfaz.

## 2. Decisiones

| Decisión | Motivo |
|---|---|
| **`users` es dueño de la fecha de nacimiento y el género**; la fecha no sale nunca de `users` | Es un dato personal; los demás servicios solo necesitan género y edad |
| **`plans` pregunta a `users` con el token de la propia persona** (`GET /me/demographics/audience`) | Una persona solo puede preguntar por sí misma; no hay un endpoint para consultar a otras |
| **Público del plan:** género (todos, mujeres, hombres) y edad mínima y máxima opcionales; por defecto, todos | Los planes que ya existen y los que no indican nada no cambian ni llaman a `users` |
| **«No binario» y «prefiero no decirlo» solo encajan en planes para todos** | Un plan «solo mujeres» o «solo hombres» no se puede cumplir de otra forma |
| **Solo mayores de 18 años; la fecha se puede cambiar un par de veces** | OneLeft es para adultos y se evita falsear la edad cambiando la fecha |
| **Los demás ven el tramo de edad** (18–24, 25–34, 35–44, 45–54, 55–64, 65+), nunca la fecha | Es lo que el organizador necesita para decidir |
| **Unirse y pedir plaza se comprueban en el backend**: `plan.audienceMismatch`, `demographics.required`, `demographics.unavailable` (409) | Si `users` no responde, nadie entra por error |
| **Cercanos:** la búsqueda filtra en SQL con género y edad de quien busca; si se desconoce, solo ven los planes para todos. El flujo en tiempo real aplica la misma regla (el evento `plan.published` lleva el público) | La lista en tiempo real y al recargar deben coincidir |
| **La solicitud de plaza guarda el tramo de edad del momento** (V15), si se conoce | El organizador lo ve en su bandeja sin preguntar a `users` |
| **Web:** la comprobación del cliente solo evita mostrar el botón a quien no encaja; decide el servicio | La interfaz nunca es la barrera |

## 3. Pruebas

- **Backend:** unitarios del modelo (público, miembro, búsqueda cercana), de los servicios (comprobación, solicitudes con tramo de edad) y de integración con PostgreSQL de `users` y `plans` (en la CI).
- **Web:** 406 tests unitarios: tarjeta del perfil, selector al publicar, público en el ticket y el detalle, y el tramo de edad en la bandeja. La CI de las PR pasó en verde. El E2E de Playwright salió como `skipping`.

## 4. Incidencias

- **El mock de `UsersApi` del perfil no tenía `demographics`**: la tarjeta nueva rompió 20 tests de `profile.spec` hasta añadirlo.
- **La carga de la máquina** obligó a parar el stack para pasar los tests unitarios.

## 5. Pendiente

- **Los avisos HU-006 no filtran por público:** el servicio de notificaciones no conoce el género ni la edad de los candidatos. Hace falta un diseño (modelo de lectura propio o consulta entre servicios) y un ADR; la fecha no puede viajar.
- **El nivel de quien pide plaza** no se muestra en la bandeja (backend#99 sigue abierta).
- Capturas de la tarjeta del perfil, del selector al publicar y del plan con público.
- E2E del flujo de HU-070 contra la API respondida en el navegador.
