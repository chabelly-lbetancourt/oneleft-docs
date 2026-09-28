# Estructura de la memoria

Estructura basada en la memoria de [CRIApp](https://oa.upm.es/97133/) (Máster en Ingeniería Web, 2026, dirigida
por el Dr. Francisco Javier Gil Rubio), adaptada a OneLeft.

## Puntos que deben tener más peso

La memoria debe hacer énfasis en estos aspectos. Cada uno indica dónde se trata y qué evidencias lo respaldan.

| Aspecto | Capítulo | Evidencias |
|---|---|---|
| Metodologías ágiles (Scrum ligero + Kanban) | 2.1, 4.1 | Capturas del tablero en cada sprint, tabla de sprints |
| Priorización (MoSCoW) y estimación (puntos Fibonacci) de las tareas de cada sprint | 4.1 | Tabla de planificación y ejecución por sprint, gráfico de velocidad |
| Herramientas utilizadas | 2.9, 4.2 | Tabla de tecnologías **con sus logos** (`assets/logos`, README), capturas de IntelliJ, WebStorm, GitHub, SonarQube, Slack |
| Proceso documentado | 4 (todo) | Diario `proceso/` con capturas de cada hito |
| Estado del arte | 2 | Comparativa de aplicaciones, TFM previos y alternativas tecnológicas |
| Requisitos | 3.2, 3.3 | Tablas RF y RNF con trazabilidad a historias de usuario |
| Historias de usuario | 3.4 | Catálogo HU con criterios de aceptación, MoSCoW y puntos |
| Diagramas UML (PlantUML) | 3.5–3.8 | Casos de uso, componentes, clases, estados, secuencia y despliegue |
| Bases de datos | 3.9 | Modelo entidad-relación, base de datos por servicio, PostGIS y Redis |
| Arquitectura | 3.5, 4.3 | Microservicios con arquitectura hexagonal, eventos, gateway; diagrama 17 con los logos de cada tecnología |
| Infraestructura | 4.7 | Docker, Kubernetes, entornos **dev / pre (staging) / pro** con su flujo de promoción (diagrama 18), pipelines (diagrama 10) |
| Cómo encaja AWS | 3.8, 4.7 | Diagrama de despliegue en AWS, servicios usados y control de costes |
| App móvil | 4.5, 5 | Pipeline de Capacitor, capturas en Android |
| Estructura de directorios | 4.3, 4.4, anexo | Árbol de cada repositorio con explicación |
| Fotos de los resultados | 5 | Capturas de la app web y Android, Grafana, SonarQube, pruebas de carga |

## Diagramas

Los diagramas del anteproyecto están en `anteproyecto/diagramas` y los nuevos de la memoria en
`memoria/diagramas`, siempre en PlantUML (fuentes en `src/`, generados con `tools/render-plantuml.sh`).

## Portada

- Universidad Politécnica de Madrid · Escuela Técnica Superior de Ingeniería de Sistemas Informáticos
- Máster Universitario en Ingeniería Web
- Título: *OneLeft: plataforma web y móvil de microservicios para completar planes inmediatos con personas cercanas en tiempo real* (provisional)
- Trabajo de Fin de Máster · Presentado para la obtención del título de Máster por: *nombre*
- Bajo la supervisión de: *tutor/a*
- Madrid, 2027

## Preliminares

- Agradecimientos
- Abstract
- Resumen
- Índice de figuras
- Índice de tablas
- Abreviaturas y acrónimos

## 1. Introducción

- 1.1 Motivación y problema
- 1.2 Objetivos (general y específicos, con cómo se mide cada uno)
- 1.3 Metodología (resumen)
- 1.4 Estructura del documento

## 2. Marco teórico y estado del arte

- 2.1 Metodologías ágiles: Scrum, Kanban, MoSCoW y estimación con puntos de historia
- 2.2 Arquitectura de microservicios y arquitectura hexagonal
- 2.3 Aplicaciones web con Angular y aplicaciones híbridas con Capacitor
- 2.4 Bases de datos: relacionales, geoespaciales (PostGIS) y en memoria (Redis)
- 2.5 Contenedores y orquestación: Docker y Kubernetes
- 2.6 Computación en la nube: AWS
- 2.7 Observabilidad: logs, métricas, Grafana, Loki y Prometheus
- 2.8 Calidad del software: pruebas automatizadas, cobertura y SonarQube
- 2.9 DevOps, integración y despliegue continuos y herramientas del proyecto
- 2.10 Inteligencia artificial aplicada: sistemas de recomendación y modelos de lenguaje
- 2.11 Uso de inteligencia artificial para el desarrollo
- 2.12 Estado del arte
  - Aplicaciones similares
  - Trabajos previos en el Máster en Ingeniería Web
  - Alternativas tecnológicas y justificación de las elegidas

## 3. Análisis, diseño y especificación del sistema

- 3.1 Descripción del sistema
- 3.2 Requisitos funcionales
- 3.3 Requisitos no funcionales
- 3.4 Historias de usuario (catálogo con MoSCoW, puntos y criterios de aceptación)
- 3.5 Arquitectura del sistema (diagrama de componentes)
- 3.6 Diagrama de casos de uso
- 3.7 Diseño detallado: diagramas de clases, estados y secuencia
- 3.8 Diagrama de despliegue y encaje en AWS
- 3.9 Modelo de datos y bases de datos

## 4. Implementación

- 4.1 Gestión del proyecto con GitHub Projects
  - Marco metodológico y tablero Kanban
  - Priorización MoSCoW y estimación de tareas en cada sprint
  - Planificación y ejecución de sprints
  - Análisis de velocidad y desviaciones
- 4.2 Herramientas y entorno de trabajo (IntelliJ, WebStorm, GitHub, asistencia con IA)
- 4.3 Microservicios del backend (estructura de directorios y capas)
- 4.4 Aplicación web (estructura de directorios, PrimeNG y Tailwind)
- 4.5 Aplicación móvil con Capacitor
- 4.6 Funcionalidades de inteligencia artificial
- 4.7 Infraestructura y despliegue
  - Estrategia de ramas y política de contribución
  - Entorno de desarrollo con Docker Compose
  - Kubernetes y autoescalado
  - Infraestructura en AWS y control de costes
  - Pipeline de CI/CD y SonarQube
  - Observabilidad
- 4.8 Pruebas
  - Pruebas unitarias y de integración
  - Métricas de cobertura
  - Pruebas de carga

## 5. Presentación del producto MVP

Con capturas de la app web y Android de cada pantalla:

- Identidad visual (logotipo, colores, tipografía)
- Autenticación
- Publicación de un plan (formulario y lenguaje natural)
- Planes cercanos (mapa y lista)
- Unirse a un plan y chat
- Notificaciones
- Perfil y reputación
- Panel de administración y moderación
- Resultados de observabilidad, calidad y pruebas de carga

## 6. Conclusiones

- Cumplimiento de los objetivos
- Limitaciones del trabajo
- Líneas de trabajo futuro

## Bibliografía

## Anexos

- Configuración del entorno de asistencia con IA
- Catálogo completo de historias de usuario
- Estructura de directorios de los repositorios
- Manual de despliegue

## Convenciones de idioma

- **Código en inglés** (comentarios, nombres, enumerados, mensajes de la API y de la CI): backend#33 y sub-issues.
- **App en español e inglés** (HU-022): los textos de la interfaz están en `oneleft-frontend/public/i18n`.
- **Memoria, diario y diagramas en español**, como exige la normativa del TFM.
