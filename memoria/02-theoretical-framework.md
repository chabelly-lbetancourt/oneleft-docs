# 2. Marco teórico y estado del arte

Este capítulo resume los conceptos en los que se apoya el trabajo y justifica, frente a sus alternativas, las
tecnologías elegidas. No pretende ser un tratado de cada tema, sino explicar lo necesario para entender por qué
OneLeft está construido como está.

## 2.1 Metodologías ágiles: Scrum, Kanban, MoSCoW y puntos de historia

**Scrum** [SCRUM-GUIDE] organiza el trabajo en iteraciones de duración fija (*sprints*) con un objetivo, una
planificación al inicio, un incremento utilizable al final y una revisión que permite adaptar el plan. Sus roles
(*Product Owner*, *Scrum Master*, equipo de desarrollo) y eventos están pensados para equipos; en un proyecto individual
se conservan su ritmo y sus artefactos (backlog priorizado, backlog del sprint, incremento) y se simplifican las
ceremonias. A esta adaptación se la llama en este trabajo **Scrum ligero**.

**Kanban** [ANDERSON-KANBAN] visualiza el flujo de trabajo en un tablero por columnas y **limita el trabajo en curso**
(WIP). El límite obliga a terminar antes de empezar algo nuevo y hace visibles los cuellos de botella. Combinado con
Scrum, el sprint fija *qué* se intenta hacer en la semana y el tablero, *cómo* avanza cada tarea día a día.

**MoSCoW** [CLEGG-MOSCOW] clasifica los requisitos en *Must have* (imprescindible para que el producto tenga sentido),
*Should have* (importante, pero el producto funciona sin ello), *Could have* (deseable si hay tiempo) y *Won't have
this time* (fuera del alcance de esta versión). Es especialmente útil cuando el tiempo es fijo, como en un TFM: lo que
se recorta ante un retraso está decidido de antemano.

Los **puntos de historia** [COHN-ESTIMATING] estiman el esfuerzo relativo de una historia, no su duración en horas. Se
suele usar la serie de Fibonacci (1, 2, 3, 5, 8, 13) porque la distancia creciente entre valores refleja que la
incertidumbre aumenta con el tamaño. La **velocidad** (puntos completados por sprint) permite comparar lo planificado
con lo realizado y ajustar la planificación.

## 2.2 Arquitectura de microservicios y arquitectura hexagonal

Una **arquitectura de microservicios** [LEWIS-FOWLER-MICROSERVICES] [NEWMAN-MICROSERVICES] descompone un sistema en
servicios pequeños, desplegables por separado, cada uno responsable de una capacidad del negocio y dueño de sus datos.
Frente a un monolito, permite escalar y desplegar cada parte de forma independiente y aislar los fallos, a cambio de
una complejidad operativa mayor: red, consistencia entre servicios, observabilidad y despliegue de muchas piezas.

Algunos patrones de esta arquitectura que se aplican en OneLeft [RICHARDSON-PATTERNS]:

- **Base de datos por servicio** (*database per service*): ningún servicio lee las tablas de otro; se comunican por su
  API o por eventos.
- **API Gateway:** un único punto de entrada que enruta, autentica y aplica políticas comunes (límite de peticiones,
  CORS) antes de llegar a cada servicio.
- **Comunicación asíncrona por eventos:** un servicio publica un hecho («se ha publicado un plan») y los interesados
  reaccionan sin que el emisor los conozca. Reduce el acoplamiento temporal: si el receptor está caído, procesa el
  evento al volver.
- **Circuit breaker:** ante un servicio externo que falla, se deja de llamarlo durante un tiempo para no propagar la
  lentitud.

La **arquitectura hexagonal** o de puertos y adaptadores [COCKBURN-HEXAGONAL] sitúa el dominio en el centro, sin
dependencias de frameworks. El dominio declara **puertos** (interfaces) de entrada, que son sus casos de uso, y de
salida, que son lo que necesita del exterior (persistencia, mensajería, otros servicios). Los **adaptadores** implementan
esos puertos con una tecnología concreta. La ventaja práctica es que las reglas de negocio se prueban sin base de datos
ni red, y que cambiar de proveedor (por ejemplo, de geocodificador o de almacenamiento de objetos) solo afecta a un
adaptador.

## 2.3 Aplicaciones web con Angular y aplicaciones híbridas con Capacitor

**Angular** [ANGULAR] es un framework de aplicaciones de una sola página (SPA) en TypeScript. Sus versiones recientes
introducen los **signals**, un modelo de reactividad de grano fino que permite prescindir de Zone.js (*zoneless*): la
vista se actualiza cuando cambia un signal, no tras cada evento del navegador. Las aplicaciones se organizan en
componentes *standalone* con carga diferida por ruta.

**PrimeNG** [PRIMENG] aporta una biblioteca de componentes de interfaz (formularios, listas, menús, autocompletado) con
sistema de temas, y **Tailwind CSS** [TAILWIND] es un framework de utilidades CSS. En OneLeft, como se explica en 4.4,
los estilos propios se escriben en SCSS con un sistema de diseño de tokens y Tailwind queda limitado al *reset* y a
utilidades de accesibilidad.

Una **aplicación híbrida** empaqueta una aplicación web dentro de una aplicación nativa que la muestra en un WebView.
**Capacitor** [CAPACITOR] hace ese empaquetado y expone las capacidades nativas (compartir, ficheros, barras del
sistema, navegador del sistema) a través de *plugins* con una API JavaScript. Frente a una aplicación nativa (Kotlin) o
a otros frameworks multiplataforma (Flutter, React Native), permite reutilizar todo el código de la web.

## 2.4 Bases de datos: relacionales, geoespaciales y en memoria

**PostgreSQL** [POSTGRESQL] es un sistema gestor de bases de datos relacional de código abierto, con transacciones ACID,
restricciones declarativas, índices parciales y de expresión, y extensibilidad. **PostGIS** [POSTGIS] lo extiende con
tipos geométricos y geográficos, índices espaciales GiST y funciones como `ST_DWithin` (¿está un punto a menos de *d*
metros de otro?) o el operador de distancia `<->`, que permite ordenar por cercanía usando el índice. La diferencia
entre `geometry` (coordenadas en el plano) y `geography` (sobre el elipsoide, con distancias en metros) es relevante
para medir distancias reales.

**Redis** [REDIS] es un almacén de estructuras de datos en memoria. En OneLeft se usa como estado compartido entre
réplicas (los contadores del límite de peticiones) y como caché con caducidad (la previsión del tiempo, las sugerencias
de lugares y la primera página del feed).

El **control de concurrencia optimista** añade una versión a cada fila: una actualización solo se aplica si la versión
no ha cambiado desde que se leyó; si cambió, se reintenta con los datos frescos [KLEPPMANN-DDIA]. Es adecuado cuando
los conflictos son raros, como ocupar la última plaza de un plan.

**Flyway** [FLYWAY] versiona el esquema de cada base de datos con migraciones SQL numeradas, de modo que el esquema
forma parte del código y se aplica igual en todos los entornos.

## 2.5 Contenedores: Docker y Docker Compose

Un **contenedor** empaqueta una aplicación con sus dependencias en una imagen inmutable que se ejecuta aislada sobre el
núcleo del sistema [DOCKER]. **Docker Compose** describe en un fichero un conjunto de contenedores, sus redes,
volúmenes, comprobaciones de salud y dependencias, y permite agruparlos por **perfiles**. Que el mismo tipo de
definición sirva para el entorno local y para el servidor reduce las diferencias entre entornos, uno de los principios
de *The Twelve-Factor App* [TWELVE-FACTOR].

## 2.6 Computación en la nube: AWS

**Amazon Lightsail** [AWS-LIGHTSAIL] ofrece servidores privados virtuales con precio mensual fijo que incluye una cuota
de tráfico, IP estática y zona DNS, además de *snapshots* automáticos y almacenamiento de objetos compatible con S3.
Frente a servicios gestionados de contenedores (Amazon ECS) o a instancias EC2, simplifica la operación y hace el coste
previsible, a cambio de escalar verticalmente (instancias más grandes) en lugar de horizontalmente. **Amazon SES**
[AWS-SES] envía correo transaccional, que en OneLeft usará Keycloak para verificar cuentas y recuperar contraseñas.

## 2.7 Observabilidad: logs, métricas, Grafana, Loki y Prometheus

La **observabilidad** es la capacidad de entender el estado interno de un sistema a partir de lo que emite: métricas,
logs y trazas. **Prometheus** [PROMETHEUS] recoge métricas numéricas por *scraping* periódico de un endpoint HTTP y
las consulta con PromQL; **Loki** [LOKI] almacena logs indexando solo sus etiquetas, lo que reduce mucho el consumo
frente a soluciones de indexación completa como Elasticsearch; **Grafana** [GRAFANA] presenta ambos en paneles. En Spring
Boot, **Micrometer** expone las métricas en el formato de Prometheus a través de Actuator [SPRING-BOOT].

## 2.8 Calidad del software: pruebas automatizadas, cobertura y SonarQube

La **pirámide de pruebas** [COHN-PYRAMID] recomienda muchas pruebas unitarias rápidas, menos de integración y pocas de
extremo a extremo sobre los flujos críticos. En OneLeft:

- **Unitarias** con JUnit 5 [JUNIT] en el backend y Vitest [VITEST] en la web.
- **De integración** con **Testcontainers** [TESTCONTAINERS], que arranca PostgreSQL, RabbitMQ o Redis reales en
  contenedores durante la prueba, y WireMock para simular servicios HTTP externos.
- **De arquitectura** con **ArchUnit** [ARCHUNIT], que convierte en pruebas las reglas de dependencia de la arquitectura
  hexagonal.
- **De extremo a extremo** con **Playwright** [PLAYWRIGHT], que maneja navegadores reales.

La **cobertura** mide qué parte del código ejecutan las pruebas; **JaCoCo** [JACOCO] la calcula en Java y puede detener
la compilación si baja de un umbral. Es un suelo, no un objetivo: indica qué no se ha probado, no que lo probado sea
correcto. **SonarQube** [SONARQUBE] analiza el código estáticamente (errores probables, vulnerabilidades, duplicación,
deuda técnica) y define un *quality gate* que una *pull request* debe superar.

## 2.9 DevOps, integración y despliegue continuos

**DevOps** une desarrollo y operación mediante la automatización del camino desde el commit hasta producción. La
**integración continua** compila y prueba cada cambio en un entorno limpio; el **despliegue continuo** lleva
automáticamente lo integrado a los entornos. En OneLeft se usa **GitHub Actions** [GITHUB-ACTIONS] para validar ramas y
mensajes de commit (**Conventional Commits** [CONVENTIONAL-COMMITS]), compilar, probar, medir cobertura, construir y
publicar imágenes en GitHub Container Registry, y ejecutar las pruebas E2E antes de promocionar a `pre`.

Las herramientas concretas del proyecto (IDE, control de versiones, tablero, mensajería, diagramas) se detallan en el
apartado 4.2.

## 2.10 Inteligencia artificial aplicada: sistemas de recomendación y modelos de lenguaje

Decidir **a quién avisar primero** de un plan es un problema de ordenación (*learning to rank*) propio de los sistemas de
recomendación: se estima, para cada persona candidata, la probabilidad de que acepte, y se avisa por orden. Un
clasificador probabilístico entrenado con avisos pasados (aceptados o no) y variables del contexto produce esa
probabilidad. El **gradient boosting** [FRIEDMAN-GBM] combina muchos árboles de decisión pequeños, cada uno corrigiendo
los errores de los anteriores, y funciona bien con pocas variables tabulares heterogéneas. Se evalúa con el **AUC**,
que mide qué tan bien ordena, y con la **puntuación de Brier** [BRIER], que mide la calibración de las probabilidades.
La implementación usa scikit-learn [SCIKIT-LEARN].

Los **modelos de lenguaje de gran tamaño** (LLM) generan texto a partir de instrucciones y pueden extraer información
estructurada de una frase en lenguaje natural. Su principal riesgo en una aplicación es que **se equivocan** y que pueden
recibir **instrucciones inyectadas** dentro de los datos que procesan (*prompt injection*), el primer riesgo del OWASP
Top 10 para aplicaciones con LLM [OWASP-LLM]. Por eso, en OneLeft el modelo solo propone un borrador, cada campo se
valida con las reglas del dominio y la persona confirma antes de publicar (apartado 4.6). Spring AI [SPRING-AI] abstrae
el proveedor del modelo detrás de una interfaz común.

## 2.11 Uso de inteligencia artificial para el desarrollo

> **Pendiente:** apartado previsto en la estructura de la memoria. Su contenido lo decide la autora.

## 2.12 Estado del arte

### Aplicaciones similares

*Tabla 2.1. Aplicaciones similares y diferencia con OneLeft (del anteproyecto).*

| Aplicación | Qué ofrece | Diferencia con OneLeft |
|---|---|---|
| Meetup | Grupos por intereses con eventos programados | Planes con días de antelación; orientado a comunidades |
| Timeleft | Cenas semanales con desconocidos | Un solo tipo de plan, organizado por la plataforma |
| WeMeet (WeRoad), Meet5 | Quedadas en grupo para conocer gente | Eventos organizados; el objetivo es socializar |
| Bumble BFF, Amigos | Encontrar amistades cercanas por intereses | Orientadas a conocer personas, no a completar un plan |
| Couchsurfing Hangouts | Quedadas espontáneas con viajeros | Público viajero; sin plazas ni caducidad |
| Playtomic | Partidos abiertos de pádel | Un único deporte y ligado a la reserva de pista |

**Hueco que cubre OneLeft:** planes de **cualquier actividad** en un **horizonte de horas**, con **plazas exactas** que se
llenan en tiempo real y **caducidad automática**.

> **Pendiente:** añadir las referencias (web y fecha de consulta) de cada aplicación en la bibliografía, y revisar si
> alguna ha cambiado sus funciones desde el anteproyecto.

### Trabajos previos en el Máster en Ingeniería Web

En el Archivo Digital UPM hay TFM del máster con dominios relacionados (gestión de un club de pádel, 2021; organización
de viajes en grupo, 2024), pero ninguno aborda la formación de grupos inmediatos por proximidad, la asignación
concurrente de plazas ni el uso de IA para decidir a quién notificar. Como referencia metodológica y de estructura se
toma CRIApp [GIL-CRIAPP].

> **Pendiente:** citar con título, autor y enlace los dos TFM mencionados (club de pádel, 2021; viajes en grupo,
> 2024); no figuran en la documentación del proyecto.

### Alternativas tecnológicas y justificación de las elegidas

*Tabla 2.2. Alternativas evaluadas. Las tres primeras columnas proceden del anteproyecto; la última indica qué cambió
durante el desarrollo.*

| Necesidad | Elegida | Alternativas | Motivo | Cambios durante el desarrollo |
|---|---|---|---|---|
| Backend | Spring Boot + Spring Cloud | NestJS, Quarkus, Micronaut | Ecosistema maduro para microservicios; tecnología central del máster | Spring Boot 4.1 y Spring Cloud 2025.1 ([entrada 03](../proceso/03-sprint1-entorno-y-esqueletos.md)) |
| Frontend | Angular + PrimeNG + Tailwind | React + MUI, Vue + Vuetify | Framework del máster; componentes complejos y diseño propio | PrimeNG 22 dejó de ser MIT y requiere la *PrimeUI Community License* (entrada 03); Tailwind queda solo como *reset* |
| App móvil | Capacitor | Kotlin nativo, Flutter, React Native | Reutiliza el código Angular con acceso nativo | Sin cambios |
| Geolocalización | PostGIS + Redis GEO | MongoDB geoespacial, Elasticsearch | Consultas persistentes y posiciones en tiempo real | El servicio `geo` con Redis GEO no llegó a crearse: la búsqueda y el modo «estoy libre» se resuelven con PostGIS ([entradas 11](../proceso/11-entorno-pre-staging.md) y [30](../proceso/30-hu035-estoy-libre-ahora.md)) |
| Mensajería | RabbitMQ | Kafka, Amazon SQS | Suficiente para el volumen previsto y más sencillo de operar | Sin cambios |
| Identidad | Keycloak | Amazon Cognito, Auth0 | Código abierto, OAuth 2 / OIDC estándar | Sin cambios; se añade Google como proveedor federado (HU-021) |
| Despliegue | Docker Compose en AWS Lightsail | Amazon ECS, EC2 con Compose | Misma definición que en local; precio fijo | Compose de producción con Caddy preparado y probado en local; despliegue en AWS pendiente (infra#5) |
| Logs | Loki + Grafana | ELK | Menor consumo; integración con Grafana | Sin cambios |
| Almacén de objetos (nuevo) | Versity S3 Gateway en local, S3/Lightsail al desplegar | MinIO | — | MinIO dejó de publicar sus imágenes ([entrada 40](../proceso/40-hu020-foto-de-perfil.md)) |
| Mapas (nuevo) | Leaflet + OpenStreetMap | Google Maps | Sin clave ni facturación; licencia BSD-2 | [Entrada 12](../proceso/12-hu004-planes-cercanos-web.md) |
| Geocodificación (nuevo) | Photon (OpenStreetMap) | Nominatim, Google Places | La política de Nominatim prohíbe el autocompletado; Google pide clave y facturación | [Entrada 33](../proceso/33-hu071-sugerir-sitios.md) |
| i18n (nuevo) | Transloco | `@angular/localize` | Un único bundle con cambio de idioma en tiempo de ejecución | [Entrada 10](../proceso/10-sprint7-cercanos-idiomas-y-codigo-en-ingles.md) |
| E2E (nuevo) | Playwright | Puppeteer (usado para capturas) | Varios contextos en un test, geolocalización simulada, trazas y vídeo | [Entrada 16](../proceso/16-tests-e2e-playwright.md) |
