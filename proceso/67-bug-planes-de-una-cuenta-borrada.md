# 67 · Bug: borrar una cuenta cancelaba sus planes sin avisar a nadie

**Fecha:** 25/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| backend#154 · Borrar una cuenta cancela sus planes sin el evento `plan.cancelled` | Bug | Should | 2 | PR #155, cerrada |
| docs#153 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** al añadir la cancelación como organizadora ([entrada 66](66-cancelar-un-plan.md)) quedó a la vista que había otro camino que cancelaba planes sin pasar por el dominio: el borrado de la cuenta de HU-045 ([entrada 52](52-hu045-exportar-y-borrar-mis-datos.md)).

## 2. El fallo

Cuando alguien borra su cuenta, `plans` recibe `user.deleted` y cancela los planes que esa persona organizaba y aún no habían empezado. Lo hacía con un `UPDATE` de SQL en `JdbcPersonalData` (`UPDATE plan SET status = 'CANCELLED' WHERE organizer_id = :userId AND status IN ('OPEN', 'FULL')`), sin la transición del dominio y **sin publicar `plan.cancelled`**.

| Consecuencia | Detalle |
|---|---|
| Nadie se enteraba | Ni los participantes ni la lista de espera recibían el aviso SSE ni la notificación del navegador: podían presentarse a un plan que no se iba a hacer |
| Los demás servicios no reaccionaban | `chat` no cerraba el chat del plan, `social` lo mantenía en los feeds y `notifications` no cerraba sus tandas de avisos |
| El plan quedaba a medias | La lista de espera y los estados de llegada seguían como estaban, al contrario que en cualquier otra cancelación |

## 3. Cómo se confirmó

Primero se escribió el test que lo reproduce, `PersonalDataServiceTest.erasingTheAccountOfAnOrganizerCancelsEachPlanNotStartedAndTellsWhoeverWasInIt`: borrar la cuenta de una organizadora con un plan futuro con participantes debe publicar un `plan.cancelled` por cada plan sin empezar. Según la PR #155, **el test fallaba antes del arreglo** y pasa con él.

## 4. El arreglo

| Decisión | Motivo |
|---|---|
| **`PersonalDataService.erase` llama primero a `CancelPlanUseCase.cancelPlansOfDeletedAccount`**, que cancela cada plan sin empezar con la transición del dominio (`Plan.cancelForDeletedAccount`, mismas reglas que `Plan.cancel`), una transacción por plan, y publica `plan.cancelled` después de cada commit | Una cancelación revertida nunca se anuncia |
| **Los datos personales se borran después, en su propia transacción** | Los destinatarios se leen antes de que se borre nada |
| **Motivo nuevo `ACCOUNT_DELETED`** en `plan.cancelled` y en el aviso SSE `plan-cancelled`. El evento lleva los mismos campos de siempre y nada más sobre la cuenta borrada | Distinguirlo de `ORGANIZER` sin dar más datos de la persona |
| **Sin penalización de reputación:** `reputation` solo resta por `reason = ORGANIZER`, así que una cuenta borrada no recibe el apunte `LATE_CANCELLATION`. No cambia código en `reputation`; lo cubre un test | Borrar la cuenta es un derecho (RGPD), no una cancelación tardía |
| **En `notifications`, `ACCOUNT_DELETED` usa el texto que ya existía de «lo canceló quien lo organizaba»** (es/en) | Sin leer el motivo caía en «No se ha apuntado suficiente gente» |
| **Idempotente:** un plan cancelado ya no está «por empezar», así que un segundo `user.deleted` no cancela ni anuncia nada | El evento de borrado puede repetirse |
| **Si la cancelación de un plan falla (`plan.busy`), no se borra nada** y el evento se reintenta; los planes ya cancelados no se anuncian otra vez | No dejar el borrado a medias |
| **El `UPDATE` de SQL se queda como red de seguridad** para un plan cuya hora ya ha pasado y que la tarea del ciclo de vida aún no ha movido | Ese plan ya no estaba «por empezar»: no se avisa a nadie, como antes |

`chat` y `social` solo leen `planId` y no cambian. Sin cambio de esquema. README actualizado.

**Nota de contrato para la web:** `PlanCancelledNotice.reason` puede valer ahora `ACCOUNT_DELETED`. La web no tiene un texto propio para ese valor: como cualquier motivo que no conoce, dice solo que el plan se ha cancelado ([entrada 66](66-cancelar-un-plan.md)).

## 5. Pruebas

- **Unitarias:** `PersonalDataServiceTest`, `PlanCancellationServiceTest` y `PlanCancelTest` (`plans`) y `PlanCancelledMessageTest` (`notifications`).
- **Integración, en la CI (Testcontainers), en verde:** `PersonalDataIntegrationTest` de `plans` comprueba el evento con una base de datos real, y `ReputationIntegrationTest`, que `ACCOUNT_DELETED` no cuesta puntos.
- No verificado: el recorrido completo en el stack (borrar una cuenta y ver el aviso en el navegador de otra persona).

## 6. Pendiente

- **Por confirmar:** que la web no necesite un texto propio para `ACCOUNT_DELETED` (hoy, el genérico «el plan se ha cancelado»), y que la notificación del navegador diga «lo canceló quien lo organizaba».
- Capturas: no hay cambio visible en la interfaz (solo backend).
