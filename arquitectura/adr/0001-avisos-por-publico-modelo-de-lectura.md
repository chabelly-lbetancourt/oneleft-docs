# ADR 0001 · Avisos de planes cercanos filtrados por público: modelo de lectura en `notifications`

- **Estado:** aceptado
- **Fecha:** 16/11/2026
- **Relacionado:** HU-006 (avisos), HU-070 (público del plan), backend#144

## Contexto

Un plan puede ser solo para mujeres, para hombres o para un rango de edad (HU-070). La búsqueda cercana y el flujo en tiempo real ya respetan esa regla, pero los avisos de HU-006 (servicio `notifications`) no: avisaban de planes a los que la persona luego no podía unirse. `notifications` no conoce el género ni la edad de los candidatos, y la **fecha de nacimiento no puede salir de `users`**.

## Opciones consideradas

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| **1. Modelo de lectura en `notifications`**, alimentado por un evento de `users` | Funciona aunque `users` esté caído; una sola consulta por lote; mismo patrón que la copia de bloqueos | La edad puede quedar desfasada hasta el siguiente evento |
| 2. Consulta síncrona a `users` al publicar | Edad siempre exacta; no se guarda nada | Depende de `users` en ese instante; necesita credenciales entre servicios |
| 3. No filtrar los avisos | Es lo más barato | Se avisa de planes a los que la persona no puede unirse |

## Decisión

Opción 1. `users` publica `demographics.changed` en `oneleft.accounts` con `{userId, gender, age, occurredAt}`: al guardar los datos y cada noche (00:10 UTC) para quien cumple años. `notifications` lo guarda en `member_audience` (cola durable propia), lo borra con `user.deleted` y lo incluye en la exportación de datos. El plan ya lleva su público en `plan.published`.

Regla: un plan para todos no consulta nada; si tiene género o edad, quien no tiene datos conocidos no recibe el aviso. «No binario» y «prefiero no decirlo» solo encajan en planes para todos.

## Consecuencias

- La fecha de nacimiento no viaja; solo género y edad en años.
- Quien guardó sus datos antes de este cambio no tiene copia hasta que los cambie o cumpla años: solo recibe planes para todos. Pendiente decidir una republicación única.
- Sin outbox: si el broker cae al guardar, se registra el fallo y la copia conserva la edad anterior hasta el siguiente cambio o cumpleaños.
- La edad se desfasa como mucho un día (el aviso nocturno corrige los cumpleaños).
