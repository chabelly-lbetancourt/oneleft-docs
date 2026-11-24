# 1. Introducción

## 1.1 Motivación y problema

Cuando a un grupo le falta una persona para un plan inmediato (un partido de pádel a las 19:00, un fútbol 7 en el que
son 13, una entrada que sobra para esta noche), la solución habitual es escribir en varios grupos de mensajería y
esperar. Casi nunca funciona a tiempo: el mensaje se pierde entre otros, llega a gente que está lejos o que no practica
esa actividad, y nadie sabe si la plaza sigue libre cuando alguien por fin responde.

Las aplicaciones para hacer planes con desconocidos se han popularizado como forma de combatir la soledad, pero se
centran en **eventos organizados con días de antelación** y en **conocer gente** (apartado 2.12). No resuelven el caso
concreto de **completar un grupo que ya existe en las próximas horas**. El problema no es social sino logístico: hay un
hueco concreto, con una hora y un lugar, y hay personas cerca que podrían ocuparlo si se enterasen a tiempo.

OneLeft propone una plataforma en la que:

1. Quien organiza publica un plan con fecha de inicio en las próximas horas y el número exacto de plazas libres.
2. El sistema avisa, en tiempo real, a las personas cercanas con más probabilidad de apuntarse.
3. Las plazas se ocupan por orden de llegada, sin que nunca haya más participantes que plazas, y el plan **caduca**
   automáticamente.

El objetivo de producto es que un plan no se caiga; conocer gente es la consecuencia, no el propósito. Esta idea
condiciona muchas decisiones técnicas posteriores: la ventana de 5 minutos a 12 horas para la hora de inicio
(apartado 4.3), la búsqueda geoespacial por distancia, los avisos en tiempo real y el control de concurrencia sobre la
última plaza.

Desde el punto de vista académico, el problema es una buena excusa para aplicar de forma integrada lo estudiado en el
Máster en Ingeniería Web: una arquitectura de microservicios con comunicación síncrona y por eventos, una aplicación
web que se reutiliza como aplicación móvil, bases de datos geoespaciales, seguridad con un proveedor de identidad
estándar, integración continua, contenedores y gestión ágil documentada.

## 1.2 Objetivos

### Objetivo general

Diseñar, desarrollar y desplegar una plataforma web y móvil basada en microservicios que permita completar planes
inmediatos con personas cercanas en tiempo real, aplicando metodologías ágiles, prácticas DevOps y técnicas de
inteligencia artificial.

### Objetivos específicos

Los objetivos específicos y su forma de medirse se fijaron en el anteproyecto. La última columna indica dónde se
evalúa cada uno en esta memoria; el grado de cumplimiento se analiza en el capítulo 6.

*Tabla 1.1. Objetivos específicos.*

| Id | Objetivo | Cómo se mide | Dónde se trata |
|---|---|---|---|
| OE1 | Gestionar el proyecto con Scrum ligero y Kanban en GitHub Projects, con priorización MoSCoW y estimación en puntos de historia | Sprints documentados, velocidad y desviaciones analizadas | 4.1 |
| OE2 | Diseñar una arquitectura de microservicios con arquitectura hexagonal, documentada con UML | Diagramas de componentes, clases, secuencia, estados y despliegue | 3.5–3.9 |
| OE3 | Implementar la búsqueda geoespacial y la asignación concurrente de plazas sin sobreocupación | Pruebas de concurrencia: nunca más participantes que plazas | 4.3, 4.8 |
| OE4 | Desarrollar una aplicación web con Angular, PrimeNG y Tailwind CSS y publicarla como app Android con Capacitor | APK funcional con geolocalización y notificaciones push | 4.4, 4.5 |
| OE5 | Incorporar IA: creación de planes en lenguaje natural, moderación automática y ranking de notificaciones | Tasa de aceptación y tiempo en completar un plan frente a una regla base | 4.6 |
| OE6 | Desplegar la plataforma en AWS Lightsail con Docker Compose, HTTPS, copias de seguridad y entornos de preproducción y producción | Pruebas de carga: capacidad de la instancia, latencias y errores | 4.7, 4.8 |
| OE7 | Implantar observabilidad (logs, métricas) y calidad continua | Dashboards de Grafana y Loki; cobertura ≥ 80 % y quality gate de SonarQube | 4.7, 4.8 |
| OE8 | Documentar todo el proceso con capturas y evidencias | Diario de desarrollo en `oneleft-docs/proceso` | 4 (todo) |

## 1.3 Metodología

El trabajo se ha organizado con **Scrum ligero y Kanban** sobre GitHub Projects (apartados 2.1 y 4.1). Al ser un
proyecto individual, Scrum se adapta sin ceremonias rígidas: sprints semanales, planificación al inicio de cada sprint
moviendo historias del *Backlog* al *Sprint Backlog*, un tablero Kanban con límite de trabajo en curso y una revisión
al final de cada sprint.

- **Priorización MoSCoW:** cada issue se clasifica como *Must*, *Should*, *Could* o *Won't*. Las dos historias *Won't*
  (pagos y reserva de pistas) se crearon a propósito para dejar explícito el alcance.
- **Estimación en puntos de historia** con la serie de Fibonacci y una tabla de referencia de esfuerzo; una historia de
  13 puntos o más se divide.
- **Todo cambio nace de un issue** (historia, tarea o bug) y se integra mediante una *pull request* desde una rama
  `issue#N`, validada por la integración continua.
- **Proceso documentado:** cada hito tiene una entrada en el diario del proceso, con las decisiones, las incidencias y
  las capturas de los resultados. A fecha de esta versión el diario tiene 58 entradas
  ([índice](../proceso/README.md)).

Como referencia metodológica y de estructura se ha tomado el TFM CRIApp del mismo máster [GIL-CRIAPP], del que se
adoptaron la gestión con GitHub Projects, la estrategia de ramas, la validación automática de commits, el umbral de
cobertura y la estructura de esta memoria ([entrada 01](../proceso/01-montaje-inicial.md)).

## 1.4 Estructura del documento

- **Capítulo 2. Marco teórico y estado del arte:** fundamentos de las metodologías, la arquitectura y las tecnologías
  empleadas, aplicaciones similares, trabajos previos y alternativas tecnológicas.
- **Capítulo 3. Análisis, diseño y especificación:** requisitos funcionales y no funcionales, historias de usuario,
  arquitectura, diagramas UML, despliegue y modelo de datos.
- **Capítulo 4. Implementación:** gestión del proyecto, herramientas, microservicios, aplicación web y móvil,
  funcionalidades de inteligencia artificial, infraestructura y pruebas.
- **Capítulo 5. Presentación del producto MVP:** recorrido por las pantallas de la aplicación web y Android.
- **Capítulo 6. Conclusiones:** cumplimiento de los objetivos, limitaciones y trabajo futuro.
- **Bibliografía y anexos:** fuentes citadas, catálogo de historias, estructura de los repositorios y manual de
  despliegue.

Las referencias bibliográficas se citan con una clave entre corchetes (por ejemplo, [RFC9457]) que remite al
[capítulo de bibliografía](07-bibliography.md).
