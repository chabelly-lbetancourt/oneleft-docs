# OneLeft · Documentación

[![lint](https://github.com/chabelly-lbetancourt/oneleft-docs/actions/workflows/lint.yml/badge.svg?branch=dev)](https://github.com/chabelly-lbetancourt/oneleft-docs/actions/workflows/lint.yml)

**OneLeft** conecta planes para las próximas horas que tienen plazas libres («falta uno») con personas cercanas que pueden unirse en tiempo real.

## Contenido

- `memoria/`: memoria del TFM, siguiendo la estructura de los TFM del Máster en Ingeniería Web.
- `proceso/`: diario del desarrollo con capturas de cada hito (repositorios, tablero, pipelines, despliegues).
- `anteproyecto/`: propuesta del TFM.

## Tecnologías

| Área | Tecnologías | Uso en OneLeft |
|---|---|---|
| Frontend web | <img src="assets/logos/svg/angular.svg" height="28" alt="Angular 22" title="Angular 22"> <img src="assets/logos/svg/typescript.svg" height="28" alt="TypeScript" title="TypeScript"> <img src="assets/logos/svg/primeng.svg" height="28" alt="PrimeNG 22" title="PrimeNG 22"> <img src="assets/logos/svg/tailwindcss.svg" height="28" alt="Tailwind CSS 4" title="Tailwind CSS 4"> <img src="assets/logos/svg/leaflet.svg" height="28" alt="Leaflet" title="Leaflet"> <img src="assets/logos/svg/openstreetmap.svg" height="28" alt="OpenStreetMap" title="OpenStreetMap"> | App web zoneless con signals, PrimeNG + Tailwind, i18n es/en con Transloco |
| App móvil | <img src="assets/logos/svg/capacitor.svg" height="28" alt="Capacitor" title="Capacitor"> <img src="assets/logos/svg/android.svg" height="28" alt="Android" title="Android"> | La app Android replica la web: mismo código Angular empaquetado con Capacitor |
| Backend | <img src="assets/logos/svg/java.svg" height="28" alt="Java 21" title="Java 21"> <img src="assets/logos/svg/springboot.svg" height="28" alt="Spring Boot 4" title="Spring Boot 4"> <img src="assets/logos/svg/spring.svg" height="28" alt="Spring Cloud Gateway" title="Spring Cloud Gateway"> <img src="assets/logos/svg/hibernate.svg" height="28" alt="Hibernate" title="Hibernate"> <img src="assets/logos/svg/flyway.svg" height="28" alt="Flyway" title="Flyway"> <img src="assets/logos/svg/maven.svg" height="28" alt="Maven" title="Maven"> <img src="assets/logos/svg/openapi.svg" height="28" alt="OpenAPI" title="OpenAPI"> <img src="assets/logos/svg/swagger.svg" height="28" alt="Swagger UI" title="Swagger UI"> | Microservicios con arquitectura hexagonal detrás de un API Gateway |
| Seguridad | <img src="assets/logos/svg/keycloak.svg" height="28" alt="Keycloak 26" title="Keycloak 26"> | OIDC + PKCE, roles del realm, login en es/en (y Google, HU-021) |
| Datos y mensajería | <img src="assets/logos/svg/postgresql.svg" height="28" alt="PostgreSQL 17" title="PostgreSQL 17"> <img src="assets/logos/png/postgis.png" height="28" alt="PostGIS" title="PostGIS"> <img src="assets/logos/svg/rabbitmq.svg" height="28" alt="RabbitMQ 4" title="RabbitMQ 4"> <img src="assets/logos/svg/redis.svg" height="28" alt="Redis" title="Redis"> | Base de datos por servicio, búsqueda geoespacial y eventos de dominio |
| Infraestructura | <img src="assets/logos/svg/docker.svg" height="28" alt="Docker" title="Docker"> <img src="assets/logos/svg/kubernetes.svg" height="28" alt="Kubernetes" title="Kubernetes"> <img src="assets/logos/svg/aws.svg" height="28" alt="AWS" title="AWS"> <img src="assets/logos/svg/aws-eks.svg" height="28" alt="Amazon EKS" title="Amazon EKS"> <img src="assets/logos/svg/aws-rds.svg" height="28" alt="Amazon RDS" title="Amazon RDS"> <img src="assets/logos/svg/aws-s3.svg" height="28" alt="Amazon S3" title="Amazon S3"> <img src="assets/logos/svg/aws-elb.svg" height="28" alt="Elastic Load Balancing" title="Elastic Load Balancing"> <img src="assets/logos/svg/aws-cloudwatch.svg" height="28" alt="Amazon CloudWatch" title="Amazon CloudWatch"> | Docker Compose en local; Kubernetes y AWS en la fase de despliegue |
| Observabilidad | <img src="assets/logos/svg/prometheus.svg" height="28" alt="Prometheus" title="Prometheus"> <img src="assets/logos/svg/grafana.svg" height="28" alt="Grafana" title="Grafana"> <img src="assets/logos/png/loki.png" height="28" alt="Loki" title="Loki"> <img src="assets/logos/svg/micrometer.svg" height="28" alt="Micrometer" title="Micrometer"> | Métricas, logs centralizados y dashboards aprovisionados |
| Pruebas y calidad | <img src="assets/logos/svg/junit5.svg" height="28" alt="JUnit 5" title="JUnit 5"> <img src="assets/logos/svg/testcontainers.svg" height="28" alt="Testcontainers" title="Testcontainers"> <img src="assets/logos/png/archunit.png" height="28" alt="ArchUnit" title="ArchUnit"> <img src="assets/logos/png/jacoco.png" height="28" alt="JaCoCo" title="JaCoCo"> <img src="assets/logos/svg/vitest.svg" height="28" alt="Vitest" title="Vitest"> <img src="assets/logos/svg/puppeteer.svg" height="28" alt="Puppeteer" title="Puppeteer"> <img src="assets/logos/svg/sonarqubecloud.svg" height="28" alt="SonarQube Cloud" title="SonarQube Cloud"> | Cobertura ≥ 80 %, reglas de arquitectura, recorridos E2E con capturas |
| Proceso y herramientas | <img src="assets/logos/svg/git.svg" height="28" alt="Git" title="Git"> <img src="assets/logos/svg/github.svg" height="28" alt="GitHub" title="GitHub"> <img src="assets/logos/svg/githubactions.svg" height="28" alt="GitHub Actions" title="GitHub Actions"> <img src="assets/logos/svg/slack.svg" height="28" alt="Slack" title="Slack"> <img src="assets/logos/svg/intellijidea.svg" height="28" alt="IntelliJ IDEA" title="IntelliJ IDEA"> <img src="assets/logos/svg/webstorm.svg" height="28" alt="WebStorm" title="WebStorm"> <img src="assets/logos/svg/nodejs.svg" height="28" alt="Node.js" title="Node.js"> <img src="assets/logos/png/plantuml.png" height="28" alt="PlantUML" title="PlantUML"> | Kanban en GitHub Projects, CI/CD, avisos en Slack y diagramas como código |

![Arquitectura y tecnologías](memoria/diagramas/17-arquitectura-tecnologias.png)

Los logos se descargan con [`tools/fetch-logos.mjs`](tools/fetch-logos.mjs); su origen y licencia están en
[`assets/logos/SOURCES.md`](assets/logos/SOURCES.md). Son marcas de sus propietarios y se usan solo para identificar
cada tecnología.

## Proyecto

| Repositorio | Contenido |
|---|---|
| [oneleft-backend](https://github.com/chabelly-lbetancourt/oneleft-backend) | Microservicios Spring Boot |
| [oneleft-frontend](https://github.com/chabelly-lbetancourt/oneleft-frontend) | App web Angular y app Android con Capacitor |
| [oneleft-infra](https://github.com/chabelly-lbetancourt/oneleft-infra) | Docker, Kubernetes, AWS y observabilidad |
| [oneleft-docs](https://github.com/chabelly-lbetancourt/oneleft-docs) | Memoria del TFM y documentación del proceso |

Entornos: **dev** (integración) → **pre** (*staging*) → **pro** (`main`), ver [CONTRIBUTING.md](CONTRIBUTING.md).

Tablero Kanban: [OneLeft · TFM](https://github.com/users/chabelly-lbetancourt/projects/4) · Normas de trabajo: [CONTRIBUTING.md](CONTRIBUTING.md)

---
Trabajo Fin de Máster · Máster Universitario en Ingeniería Web · ETSISI · Universidad Politécnica de Madrid
