# Registro del proceso de desarrollo

Diario del desarrollo de OneLeft con capturas de cada hito. Sirve como fuente para los capítulos de
implementación y gestión del proyecto de la memoria.

| Fecha | Sprint | Entrada |
|---|---|---|
| 28/09/2026 | Sprint 0 | [01 · Montaje inicial: repositorios, tablero Kanban y normas de contribución](01-montaje-inicial.md) |
| 28/09/2026 | Sprint 0 | [02 · Anteproyecto, priorización MoSCoW y plan de sprints](02-anteproyecto-priorizacion.md) |
| 28/09/2026 | Sprint 1 | [03 · Entorno de desarrollo y esqueletos de backend y frontend](03-sprint1-entorno-y-esqueletos.md) |
| 28/09/2026 | Sprint 1 | [04 · Migración de los diagramas a PlantUML](04-diagramas-plantuml.md) |
| 28/09/2026 | Sprint 2 | [05 · Integración continua con cobertura y SonarQube](05-sprint2-integracion-continua.md) |

## Convenciones

- Una entrada por hito, numerada (`01-`, `02-`...).
- Las capturas se guardan en `img/` con el mismo prefijo numérico que su orden de aparición.
- Cada entrada indica el sprint y los issues relacionados.
- Las capturas se generan con las herramientas de [`../tools`](../tools): `captura-terminal.sh`, `captura-web.mjs` y `arbol.py`.
- Los diagramas se escriben en **PlantUML** y se generan con `tools/render-plantuml.sh`.
