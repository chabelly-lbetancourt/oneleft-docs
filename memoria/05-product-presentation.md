# 5. Presentación del producto MVP

Este capítulo recorre la aplicación tal como la ve una persona usuaria. Las capturas se han generado con los scripts de
[`tools/`](../tools) contra el stack local real (salvo donde se indica que la API se responde en el navegador), con las
personas de demostración (Ana, Lucía y Admin) y en tamaño de móvil. La web y la app Android comparten el mismo código,
así que las pantallas son las mismas en las dos; las particularidades de Android se muestran al final.

## 5.1 Identidad visual

La identidad es **sobria y moderna**: una sola tipografía (Plus Jakarta Sans), bordes finos, sombras suaves, botones
principales en tinta con texto blanco para un contraste alto y el naranja de la marca reservado como acento. El elemento
propio de la marca es la **plaza libre**, un anillo discontinuo con «+1» que aparece en el logo, en los huecos de cada
plan y subrayando la palabra «uno» del titular ([entrada 17](../proceso/17-rediseno-y-paginas-de-acceso.md)). Todos los
colores son variables del sistema de diseño, con versión clara y oscura (HU-032).

![Pantallas con la identidad sobria](../capturas/app-web/71-identidad-sobria-pantallas.png)

*Figura 5.1. Entrar, inicio con sesión, planes cercanos y login de Keycloak con la identidad de OneLeft.*

![Icono y pantalla de arranque](../capturas/app-android/78-android-icono-arranque.png)

*Figura 5.2. Icono adaptativo y pantallas de arranque clara y oscura de la app Android.*

> **Pendiente:** ¿quieres aquí una tabla con la paleta (valores de los tokens `--ol-*` en claro y oscuro)? ¿Tienes el
> logotipo en alta resolución para la memoria impresa?

## 5.2 Autenticación

El acceso tiene páginas propias de OneLeft («Continuar con Google», «Continuar con email», crear cuenta), y la
contraseña solo se escribe en Keycloak, que lleva un tema con la misma identidad. Si se llega desde una página
protegida, tras iniciar sesión se vuelve a ella. El login de Keycloak sale en el idioma de la app.

![Páginas de acceso](../capturas/app-web/68-paginas-acceso.png)

*Figura 5.3. Entrar y crear cuenta, en español y en inglés.*

![Continuar con Google](../capturas/app-web/73-hu021-google.png)

*Figura 5.4. Continuar con Google, con Keycloak como intermediario (HU-021).*

| | | |
|---|---|---|
| ![Sin sesión](../capturas/app-web/38-hu001-1-sin-sesion.png) | ![Login](../capturas/app-web/38-hu001-3-login-keycloak.png) | ![Perfil](../capturas/app-web/38-hu001-5-perfil.png) |
| *Sin sesión* | *Login en Keycloak* | *Perfil cargado desde la API* |

*Figura 5.5. Recorrido de inicio de sesión de HU-001. Estas capturas son del Sprint 3 y se rehicieron con el diseño
actual ([entrada 17](../proceso/17-rediseno-y-paginas-de-acceso.md)).*

## 5.3 Publicación de un plan

### Con el formulario

El formulario pide actividad (29 actividades en cinco categorías, HU-068), título, punto de encuentro, hora con accesos
rápidos («en 30 min», «en 1 h»…), plazas y nivel. Al escribir el punto de encuentro se sugieren lugares cercanos
(HU-071). Opcionalmente, un mínimo de participantes con hora límite (HU-039), elegir quién acompaña (HU-069) y el público
del plan por género y edad (HU-070).

| | |
|---|---|
| ![Formulario relleno](../capturas/app-web/49-hu003-2-formulario-relleno.png) | ![Plan publicado](../capturas/app-web/49-hu003-3-detalle.png) |
| *Formulario de publicar* | *Plan publicado* |

*Figura 5.6. Publicar un plan (HU-003).*

![Categorías de actividad](../capturas/app-web/108-hu068-categorias-de-actividad.png)

*Figura 5.7. Selector agrupado por categoría, «Otra» con su nombre y filtro por categoría (HU-068). API respondida en el
navegador.*

![Sugerencias de sitios](../capturas/app-web/91-hu071-sugerencias-de-sitios.png)

*Figura 5.8. Al escribir «Polidep» aparecen los polideportivos cercanos con su distancia (HU-071).*

![Mínimo de participantes](../capturas/app-web/83-hu039-minimo-formulario-y-detalle.png)

*Figura 5.9. Un fútbol 7 que solo sale si se apuntan 6 personas una hora antes (HU-039).*

![Público del plan](../capturas/app-web/109-hu070-fecha-de-nacimiento-y-publico.png)

*Figura 5.10. Fecha de nacimiento en el perfil, público del plan y un plan que no encaja con el perfil (HU-070). API
respondida en el navegador.*

### Con una frase

![Crear un plan con una frase](../capturas/app-web/107-hu010-plan-con-una-frase.png)

*Figura 5.11. La frase, el formulario relleno y la revisión antes de publicar (HU-010). La respuesta del servicio está
simulada en el navegador porque no hay clave del proveedor en el entorno de desarrollo.*

## 5.4 Planes cercanos (mapa y lista)

La lista muestra la distancia de cada plan y el mapa el área de búsqueda; los filtros son distancia, actividad o
categoría y hora. Un plan nuevo publicado cerca aparece sin recargar la página.

![Lista, mapa y filtros](../capturas/app-web/55-hu004-lista-mapa-filtros.png)

*Figura 5.12. Lista, mapa con el área de búsqueda y filtros (HU-004).*

![Tiempo real](../capturas/app-web/56-hu004-tiempo-real.png)

*Figura 5.13. Aviso «Nuevo plan cerca» cuando otra persona publica a 600 m.*

![Previsión del tiempo](../capturas/app-web/85-hu026-prevision-tiempo.png)

*Figura 5.14. Previsión real de Open-Meteo en un plan al aire libre (HU-026).*

![Estoy libre ahora](../capturas/app-web/87-hu035-estoy-libre.png)

*Figura 5.15. «Estoy libre ahora»: quien organiza ve que hay una persona libre a 0,5 km sin saber quién es (HU-035).*

## 5.5 Unirse a un plan y chat

| | |
|---|---|
| ![Unirse y aviso](../capturas/app-web/57-hu005-unirse-y-aviso.png) | ![Lista de espera](../capturas/app-web/72-hu023-salir-y-lista-de-espera.png) |
| *Figura 5.16. Unirse y aviso a la organizadora (HU-005)* | *Figura 5.17. Salir y lista de espera (HU-023)* |

![Bandeja de solicitudes](../capturas/app-web/110-hu069-bandeja-de-solicitudes.png)

*Figura 5.18. Bandeja de solicitudes del organizador cuando elige quién le acompaña (HU-069). API respondida en el
navegador.*

![Chat del plan](../capturas/app-web/92-hu008-chat-del-plan.png)

*Figura 5.19. El chat del plan entre Ana y Lucía, en tiempo real a través del gateway (HU-008).*

| | |
|---|---|
| ![Voy de camino](../capturas/app-web/88-hu040-voy-de-camino.png) | ![Check-in](../capturas/app-web/93-hu025-check-in.png) |
| *Figura 5.20. «Llego tarde» y su aviso (HU-040)* | *Figura 5.21. Check-in en el punto de encuentro (HU-025)* |

| | |
|---|---|
| ![Añadir al calendario](../capturas/app-web/81-hu027-anadir-al-calendario.png) | ![Calendario de Apple](../capturas/app-web/82-hu027-calendario-apple.png) |
| *Figura 5.22. Añadir al calendario (HU-027)* | *Figura 5.23. El plan importado en Calendario de Apple* |

### Compartir

| | |
|---|---|
| ![Compartir un plan](../capturas/app-web/74-hu024-compartir-enlace.png) | ![Vista previa](../capturas/app-web/75-hu024-vista-previa.png) |
| *Figura 5.24. Compartir por enlace y abrirlo sin sesión (HU-024)* | *Figura 5.25. Vista previa Open Graph del enlace* |

![Tarjeta para Stories](../capturas/app-web/105-hu056-tarjeta-stories.png)

*Figura 5.26. Tarjeta para Stories de 1080 × 1920 con QR al plan (HU-056).*

## 5.6 Notificaciones

![Avisos de planes cercanos](../capturas/app-web/79-hu006-avisos-planes-cercanos.png)

*Figura 5.27. Preferencias de avisos, el aviso cuando Ana publica un pádel cerca y el plan que se abre al tocarlo (HU-006).*

| | |
|---|---|
| ![Recordatorio](../capturas/app-web/80-hu007-recordatorio-y-en-curso.png) | ![Cancelación](../capturas/app-web/84-hu039-cancelacion.png) |
| *Figura 5.28. Recordatorio 30 minutos antes y plan en curso (HU-007)* | *Figura 5.29. Cancelación por no llegar al mínimo (HU-039)* |

![Alertas guardadas](../capturas/app-web/86-hu036-alertas-guardadas.png)

*Figura 5.30. Una alerta guardada y su aviso cuando aparece un plan que encaja (HU-036).*

![Límite de peticiones](../capturas/app-web/60-limite-peticiones-web.png)

*Figura 5.31. Mensaje al superar el límite de publicaciones, en los dos idiomas.*

## 5.7 Perfil y reputación

| | | |
|---|---|---|
| ![Perfil inicial](../capturas/app-web/45-hu002-1-inicial.png) | ![Perfil editado](../capturas/app-web/45-hu002-2-editado.png) | ![Foto de perfil](../capturas/app-web/97-hu020-foto-de-perfil.png) |
| *Perfil (HU-002)* | *Zona y aficiones* | *Foto de perfil (HU-020)* |

*Figura 5.32. Perfil, aficiones con nivel y foto.*

| | |
|---|---|
| ![Reputación](../capturas/app-web/95-hu009-reputacion.png) | ![Insignias](../capturas/app-web/96-hu044-insignias.png) |
| *Figura 5.33. «Mi reputación» y la reputación junto al organizador (HU-009)* | *Figura 5.34. Insignias y aviso de una nueva (HU-044)* |

Desde el Sprint 19, «Mi reputación» muestra además el nivel (Nuevo, Habitual, Referente del barrio o Leyenda), la barra
hasta el siguiente, la racha semanal y por qué un apunte dio menos puntos (HU-062 y HU-066).

> **Pendiente:** faltan las capturas de HU-062 y HU-066, que las entradas 59 y 60 dejan anotadas. ¿Se puede levantar
> el stack local para generarlas con el script de capturas?

![Kudos](../capturas/app-web/102-hu060-kudos.png)

*Figura 5.35. Kudos entre quienes llegaron a un plan (HU-060).*

| | |
|---|---|
| ![Seguir a personas](../capturas/app-web/94-hu047-seguir-a-personas.png) | ![Perfil social](../capturas/app-web/98-hu048-perfil-social.png) |
| *Figura 5.36. Seguir a un perfil privado (HU-047)* | *Figura 5.37. Perfil social (HU-048)* |

| | |
|---|---|
| ![Feed](../capturas/app-web/99-hu051-feed-de-actividad.png) | ![Privacidad del feed](../capturas/app-web/100-hu059-privacidad-del-feed.png) |
| *Figura 5.38. Feed de actividad en tiempo real (HU-051)* | *Figura 5.39. Ocultar un plan y quién ve mi actividad (HU-059)* |

| | |
|---|---|
| ![Bloquear y reportar](../capturas/app-web/104-hu033-bloquear-y-reportar.png) | ![Mis datos](../capturas/app-web/106-hu045-mis-datos.png) |
| *Figura 5.40. Bloquear y reportar (HU-033)* | *Figura 5.41. Mis datos, borrado y privacidad (HU-045)* |

![Navegación](../capturas/app-web/101-hu072-hu073-navegacion.png)

*Figura 5.42. Cabecera con el menú del avatar en la web y menú inferior de la app Android (HU-072, HU-073).*

## 5.8 Panel de administración y moderación

El panel de administración y moderación (HU-013) y la moderación automática (HU-011) no están implementados. Lo único
disponible para el rol `admin` es el listado de reportes abiertos por la API y el recálculo de puntuaciones de
reputación. No hay capturas.

> **Pendiente:** ¿HU-013 y HU-011 entran en la entrega? Si no, ¿se quita este apartado o se deja como alcance no
> cubierto?

## 5.9 La app Android

| | |
|---|---|
| ![Pantallas a tamaño móvil](../capturas/app-android/76-android-pantallas-movil.png) | ![Recorrido de la sesión](../capturas/app-android/90-android-recorrido-sesion.png) |
| *Figura 5.43. Las pantallas a tamaño de móvil* | *Figura 5.44. Sesión en Custom Tabs y vuelta a la app* |

| | |
|---|---|
| ![Barras del sistema](../capturas/app-android/89-android-barras-del-sistema.png) | ![Validación en el emulador](../capturas/app-android/104-android-validacion-emulador.png) |
| *Figura 5.45. Barras del sistema en Android 15* | *Figura 5.46. Perfil social y avisos en el emulador* |

## 5.10 Resultados de observabilidad, calidad y pruebas de carga

| | |
|---|---|
| ![Dashboard de Grafana](../capturas/infraestructura/39-grafana-dashboard.png) | ![Prometheus](../capturas/infraestructura/40-prometheus-targets.png) |
| *Figura 5.47. Dashboard «OneLeft · Microservicios» con tráfico real* | *Figura 5.48. Destinos de Prometheus* |

![Panel del límite de peticiones](../capturas/infraestructura/59-limite-peticiones-grafana.png)

*Figura 5.49. Panel de rechazos del límite de peticiones en Grafana.*

![Documentación de la API](../capturas/api/42-swagger-5-respuesta-me.png)

*Figura 5.50. Swagger UI en el gateway, con un endpoint protegido probado tras iniciar sesión en Keycloak.*

| | |
|---|---|
| ![Lint y cobertura del frontend](../capturas/integracion-continua/35-frontend-lint-cobertura.png) | ![E2E en local](../capturas/pruebas/62-e2e-ejecucion-local.png) |
| *Figura 5.51. Lint, tests y cobertura del frontend (Sprint 2)* | *Figura 5.52. E2E en local* |

> **Pendiente:** faltan tres capturas que hoy no se pueden generar: SonarQube Cloud (no está activado, apartado 4.7),
> los resultados de las pruebas de carga (HU-015, sin hacer) y un dashboard de Grafana con todos los servicios. ¿Se
> puede levantar el stack con observabilidad para esta última?
