# 58 · HU-006 + HU-070: los avisos respetan el público del plan

**Fecha:** 16/11/2026 · **Sprint:** 18 (13/11–19/11/2026)

## 1. Planificación

| Issue | Tipo | Puntos | Resultado |
|---|---|---|---|
| backend#144 · Filtrar los avisos de planes cercanos por el público del plan | Tarea | 3 | PR #145 |
| docs · ADR 0001 y esta entrada | Documentación | 1 | esta entrada |

**Por qué:** tras HU-070, la búsqueda y el tiempo real ya respetaban género y edad, pero los avisos no: se avisaba de planes a los que la persona no podía unirse.

## 2. Decisión

Se eligió un **modelo de lectura en `notifications`** alimentado por un evento de `users`, frente a consultar a `users` en cada publicación o no filtrar. El detalle y las alternativas están en el [ADR 0001](../arquitectura/adr/0001-avisos-por-publico-modelo-de-lectura.md).

## 3. Qué cambia

- `users` emite `demographics.changed` (género y edad, nunca la fecha de nacimiento) al guardar y cada noche para quien cumple años.
- `notifications` guarda la copia (`member_audience`, migración V5), la borra con la cuenta y la incluye en la exportación.
- Los avisos por preferencias y por alertas guardadas dejan fuera a quien el plan no admite; quien no tiene datos solo recibe planes para todos.

## 4. Pruebas

Tests unitarios del público, del notificador (solo mujeres, rango de edad, no binario, desconocido, alertas) y del servicio de `users` (evento y cumpleaños); la integración de borrado de datos se amplió y pasa en la CI de la PR. No se probó el evento por RabbitMQ de extremo a extremo con el stack local (sus imágenes eran anteriores al cambio).

## 5. Pendiente

- Republicar una vez los datos de quien los guardó antes del cambio.
- Sin outbox: si el broker cae al guardar, la copia mantiene la edad anterior hasta el siguiente cambio o cumpleaños.
- Capturas: no hay cambio visible en la interfaz.
