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
| 28/09/2026 | Sprint 3 | [06 · Inicio de sesión con Keycloak y observabilidad](06-sprint3-login-y-observabilidad.md) |
| 28/09/2026 | Sprint 4 | [07 · Documentación OpenAPI con Swagger UI y microservicios en contenedores](07-openapi-y-contenedores.md) |
| 28/09/2026 | Sprint 4 | [08 · HU-002 Perfil con aficiones y nivel](08-sprint4-perfil.md) |
| 28/09/2026 | Sprint 5 | [09 · HU-003 Publicar un plan con plazas libres](09-sprint5-publicar-plan.md) |
| 28/09/2026 | Sprint 7 | [10 · HU-004 backend, código en inglés, HU-022 idiomas, logos y control de tiempos](10-sprint7-cercanos-idiomas-y-codigo-en-ingles.md) |
| 28/09/2026 | Sprint 7 | [11 · Entorno pre (staging) y documentación al día](11-entorno-pre-staging.md) |
| 28/09/2026 | Sprint 7 | [12 · HU-004 Planes cercanos en la app (lista, mapa y tiempo real)](12-hu004-planes-cercanos-web.md) |
| 28/09/2026 | Sprint 7-8 | [13 · Seed de demostración y HU-005 Unirse a un plan](13-seed-y-hu005-unirse.md) |
| 28/09/2026 | Sprint 6 | [14 · Límite de peticiones y anti-spam en el gateway](14-limite-de-peticiones.md) |
| 29/09/2026 | Sprint 7 | [15 · Release: primeras promociones de dev a pre](15-release-pre.md) |
| 29/09/2026 | Sprint 6 | [16 · Tests de extremo a extremo con Playwright](16-tests-e2e-playwright.md) |
| 29/09/2026 | Sprint 7 | [17 · Rediseño de la identidad visual y páginas de acceso](17-rediseno-y-paginas-de-acceso.md) |
| 29/09/2026 | Sprint 7 | [18 · HU-023 Salir de un plan y lista de espera](18-hu023-salir-y-lista-de-espera.md) |
| 29/09/2026 | Sprints 5-6 | [19 · HU-021 Inicio de sesión con Google](19-hu021-login-con-google.md) |
| 29/09/2026 | Sprint 7 | [20 · HU-024 Compartir un plan por enlace](20-hu024-compartir-enlace.md) |
| 29/09/2026 | Sprint 7 | [21 · Release: segunda promoción de dev a pre](21-release-pre-2.md) |
| 30/09/2026 | Sprint 5 | [22 · La app Android con Capacitor](22-app-android-capacitor.md) |
| 30/09/2026 | Sprint 7 | [23 · HU-006 Avisos de planes cercanos](23-hu006-avisos-planes-cercanos.md) |
| 03/10/2026 | Sprint 12 | [24 · Release: tercera promoción de dev a pre](24-release-pre-3.md) |

## Convenciones

- Una entrada por hito, numerada (`01-`, `02-`...).
- Las capturas se guardan en [`../capturas`](../capturas), en una carpeta por categoría (gestión, código, integración continua, infraestructura, API, pruebas, app web y app Android), con el prefijo numérico de su orden de aparición.
- Los diagramas están en [`../diagramas`](../diagramas), en una carpeta por tipo (casos de uso, componentes, clases, estados, secuencia, datos, despliegue y procesos).
- Cada entrada indica el sprint y los issues relacionados.
- Las capturas se generan con las herramientas de [`../tools`](../tools): `capture-terminal.sh`, `capture-web.mjs`, los
  recorridos `capture-*.mjs` de cada historia y `tree.py`. Las figuras con varias pantallas se montan con
  `compose-figure.mjs`. Todas las capturas de la app se hacen con la licencia de PrimeUI y sin animaciones.
- Los diagramas se escriben en **PlantUML** y se generan con `tools/render-plantuml.sh`.
