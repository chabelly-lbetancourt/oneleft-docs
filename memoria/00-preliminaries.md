# Preliminares

> **Borrador.** Primera versión completa de la memoria, redactada a partir del diario del proceso
> ([`proceso/`](../proceso/README.md)), el [anteproyecto](../anteproyecto/anteproyecto.md), los diagramas y el código
> de los repositorios. Las notas **Pendiente** señalan lo que todavía no está documentado o lo que debe decidir la
> autora.

## Portada

**Universidad Politécnica de Madrid**
Escuela Técnica Superior de Ingeniería de Sistemas Informáticos
Máster Universitario en Ingeniería Web

**OneLeft: plataforma web y móvil de microservicios para completar planes inmediatos con personas cercanas en tiempo
real** *(título provisional)*

Trabajo de Fin de Máster

Presentado para la obtención del título de Máster por: **Chabelly Lezcano Betancourt**

Bajo la supervisión de: *[tutor/a]*

Madrid, 2027

> **Pendiente:** ¿quién es el tutor o la tutora, y cuál es el título definitivo? El anteproyecto y la entrada 02 del
> diario dejan pendientes la asignación de tutor y la firma del Anexo I.

## Agradecimientos

> **Pendiente:** ¿a quién quieres agradecer el trabajo? El texto es tuyo.

## Abstract

OneLeft is a web and Android platform for plans that start within the next few hours and still have free spots
("one left"). An organiser publishes a plan with an exact number of free spots and a start time between five minutes
and twelve hours from now; nearby people who match the activity are notified in real time, spots are taken on a
first-come basis without overbooking, and the plan expires automatically when it ends.

The system is built as a set of Spring Boot microservices with hexagonal architecture (gateway, users, plans,
notifications, chat, social and reputation), a Python ranking service, PostgreSQL with PostGIS, Redis, RabbitMQ and
Keycloak. The client is a single Angular application packaged for Android with Capacitor. The project was managed
with a lightweight Scrum and Kanban process on GitHub Projects, with MoSCoW prioritisation and story points, and every
milestone is documented in a development log with screenshots. Continuous integration enforces branch and commit
rules, 80 % test coverage and end-to-end tests with Playwright, and the whole stack runs with Docker Compose.

> **Pendiente:** ¿qué extensión pide la normativa para el *abstract* y el resumen? Hay que revisarlos cuando se
> decida qué pasa con el despliegue en AWS (infra#5), las pruebas de carga (HU-015) y la moderación (HU-011).

**Keywords:** microservices, hexagonal architecture, geospatial search, real-time, Angular, Capacitor, Spring Boot,
DevOps, agile.

## Resumen

OneLeft es una plataforma web y Android para planes que empiezan en las próximas horas y a los que les faltan
personas («te falta uno»). Quien organiza publica un plan con un número exacto de plazas libres y una hora de inicio
entre cinco minutos y doce horas desde ese momento; el sistema avisa en tiempo real a las personas cercanas a las que
les interesa esa actividad, las plazas se ocupan por orden de llegada sin sobreocupación y el plan caduca solo al
terminar.

El sistema se ha construido como un conjunto de microservicios Spring Boot con arquitectura hexagonal (`gateway`,
`users`, `plans`, `notifications`, `chat`, `social` y `reputation`), un servicio de ordenación en Python, PostgreSQL con
PostGIS, Redis, RabbitMQ y Keycloak. El cliente es una única aplicación Angular que se empaqueta para Android con
Capacitor. El proyecto se ha gestionado con Scrum ligero y Kanban en GitHub Projects, con priorización MoSCoW y puntos
de historia, y cada hito está documentado en un diario con capturas. La integración continua comprueba ramas y
commits, una cobertura mínima del 80 % y pruebas de extremo a extremo con Playwright, y todo el sistema se ejecuta con
Docker Compose.

**Palabras clave:** microservicios, arquitectura hexagonal, búsqueda geoespacial, tiempo real, Angular, Capacitor,
Spring Boot, DevOps, metodologías ágiles.

## Índice

1. [Introducción](01-introduction.md)
2. [Marco teórico y estado del arte](02-theoretical-framework.md)
3. [Análisis, diseño y especificación del sistema](03-analysis-and-design.md)
4. [Implementación](04-implementation.md)
5. [Presentación del producto MVP](05-product-presentation.md)
6. [Conclusiones](06-conclusions.md)
7. [Bibliografía](07-bibliography.md)
8. [Anexos](08-annexes.md)

## Índice de figuras y de tablas

Las figuras y tablas se numeran por capítulo (Figura 3.1, Tabla 4.2…).

> **Pendiente:** ¿la versión final se maqueta en Word o en PDF? Los índices de figuras y de tablas se generan ahí;
> en Markdown no se generan automáticamente.

## Abreviaturas y acrónimos

| Sigla | Significado |
|---|---|
| ADR | *Architecture Decision Record*, registro de una decisión de arquitectura |
| API | *Application Programming Interface* |
| APK | *Android Package*, paquete de instalación de Android |
| AUC | *Area Under the ROC Curve*, área bajo la curva ROC |
| CI/CD | Integración y despliegue continuos |
| CORS | *Cross-Origin Resource Sharing* |
| E2E | Pruebas de extremo a extremo (*end-to-end*) |
| GHCR | GitHub Container Registry |
| HU | Historia de usuario |
| JWT | *JSON Web Token* |
| LLM | *Large Language Model*, modelo de lenguaje de gran tamaño |
| MoSCoW | *Must, Should, Could, Won't*: técnica de priorización |
| MVP | *Minimum Viable Product*, producto mínimo viable |
| OE | Objetivo específico |
| OIDC | OpenID Connect |
| PKCE | *Proof Key for Code Exchange* |
| RF / RNF | Requisito funcional / no funcional |
| RGPD | Reglamento General de Protección de Datos |
| SPA | *Single Page Application* |
| SSE | *Server-Sent Events* |
| TFM | Trabajo de Fin de Máster |
| VAPID | *Voluntary Application Server Identification* para Web Push |
| WCAG | *Web Content Accessibility Guidelines* |
| WIP | *Work In Progress*, trabajo en curso |
