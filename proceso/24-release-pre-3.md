# 24 · Release: tercera promoción de dev a pre

**Fecha:** 01/10/2026 y 03/10/2026 · **Sprint:** 12 (02–08/10/2026) · **Release:** infra#47

## 1. Contenido

Todo lo integrado en `dev` desde la [segunda promoción](21-release-pre-2.md) pasa al entorno **pre** (*staging*). Es
la candidata a la primera release a producción (v0.1.0).

| Bloque | Historias y tareas |
|---|---|
| Funcionalidad | HU-006 (avisos de planes cercanos en la app y como notificación del navegador), HU-067 (verificar el correo y recuperar la contraseña) |
| App móvil | App Android con Capacitor (frontend#3) |
| Interfaz | Estilos estandarizados (frontend#64); layouts, SCSS por componente, pantallas de carga y animaciones (frontend#66) |
| Keycloak | Campo de contraseña como un solo control y sin selector de idioma (infra#49) |
| Documentación | Despliegue en AWS Lightsail, capturas actualizadas, diagramas y capturas organizados (docs#56) |
| Calidad | Reinicio de la base de datos de `notifications` (infra#45) |

## 2. Promociones

Se hicieron en dos rondas: los cambios de interfaz, Keycloak y documentación llegaron a `dev` después de la primera.
En las dos, el orden es el mismo de siempre: backend e infra primero, porque la PR del frontend hacia `pre` ejecuta
los E2E contra las imágenes `:pre` del backend y el compose de la rama `pre` de infra.

| Ronda | Orden | Repositorio | PR | Contenido |
|---|---|---|---|---|
| 1 (01/10) | 1 | backend | #97 | HU-006: servicio `notifications` (su imagen `:pre` se publica por primera vez) |
| | 2 | infra | #48 | Mailpit y SMTP de Keycloak (HU-067), servicio `notifications` y claves VAPID |
| | 3 | frontend | #60 | Avisos en la app, app Android |
| | 4 | docs | #55 | Diarios 22 y 23 |
| 2 (03/10) | 1 | backend | #103 | README y configuración de logs sin Kubernetes |
| | 2 | infra | #53 | Tema de Keycloak (infra#49) y README con Lightsail |
| | 3 | frontend | #70 | Estilos, layouts, pantallas de carga y animaciones |
| | 4 | docs | #70 | Lightsail, capturas y organización de la documentación |

## 3. Verificación

- Todas las PR con el lint del camino `dev → pre` y la CI en verde.
- Imágenes `oneleft-gateway`, `oneleft-users`, `oneleft-plans` y, por primera vez, `oneleft-notifications` con la
  etiqueta `:pre` publicadas en GHCR.
- **E2E de las PR del frontend: 20 de 20 en las dos rondas** (10 recorridos en español y en inglés), en 1,0 y 1,6
  minutos, contra el stack de `pre`. En la segunda ronda pasan además 138 tests unitarios del frontend.
- La regresión visual de la segunda ronda (20 pantallas, móvil y escritorio) es idéntica a la de antes del cambio de
  estilos, salvo la portada, que pierde los botones repetidos de la cabecera.

## 4. Incidencias

**El límite diario de avisos en los E2E locales.** Al repetir muchas veces la batería el mismo día contra el mismo
stack, el test de avisos fallaba: Lucía ya había recibido sus 20 avisos del día. No es un fallo de la app, sino la
regla de HU-006 funcionando. Antes de repetir la batería en local hay que vaciar la base de datos de `notifications`
(`reset-service-database.sh notifications`) y reiniciar el servicio. En la CI no pasa, porque el stack es nuevo en
cada ejecución.

**El límite de peticiones guarda su configuración en Redis.** Para capturar el aviso de «demasiadas publicaciones»
se volvió a crear el gateway con su límite normal (5 por hora) en lugar del de los E2E (1000), pero seguía dejando
publicar. Bucket4j guarda la configuración junto a cada *bucket*: los que ya existían conservaban la capacidad de
1000 hasta caducar. Basta con borrar la clave `publish-plans:user:<id>` de Redis. Es un detalle a tener en cuenta si
el límite se cambia en producción.

**El entorno local, sin memoria.** En un Mac de 8 GB, con 12 contenedores (5 procesos Java) y Docker limitado a
3,8 GB, el sistema usaba 10 GB de *swap*. Keycloak se cerró por falta de memoria (código 137), y RabbitMQ no
respondía a tiempo a su comprobación de salud, que arranca una máquina virtual de Erlang cada 10 segundos, lo que
dejaba bloqueado el gateway. Los E2E solo pasaban de uno en uno. Mejoras propuestas para infra: limitar la memoria
de la JVM de cada servicio, dejar la observabilidad desactivada por defecto y espaciar las comprobaciones de salud.

## 5. Siguientes pasos

- **Release a producción (v0.1.0):** promoción `pre → main` en los cuatro repositorios, cuando la autora lo confirme.
- El despliegue real de `pre` y `pro` llega con infra#4 (Compose de producción con HTTPS) e infra#5 (AWS Lightsail).
