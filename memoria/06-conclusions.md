# 6. Conclusiones

> **Borrador:** este capítulo refleja el estado del proyecto a 24/11/2026. Debe revisarse cuando se cierren el
> despliegue en AWS (infra#5), las pruebas de carga (HU-015) y la moderación (HU-011).

## 6.1 Cumplimiento de los objetivos

*Tabla 6.1. Grado de cumplimiento de los objetivos específicos.*

| Id | Objetivo | Grado | Evidencia y lo que falta |
|---|---|---|---|
| OE1 | Gestión ágil con Scrum ligero, Kanban, MoSCoW y puntos | Cumplido | Tablero con 279 tarjetas, sprints semanales, tabla y análisis de velocidad (4.1). Falta el gráfico de velocidad y la explicación del cambio de calendario |
| OE2 | Microservicios con arquitectura hexagonal documentada en UML | Cumplido | Siete servicios Java hexagonales con ArchUnit, más el `ranker`; diagramas de componentes, clases, estados, secuencia (30), datos y despliegue |
| OE3 | Búsqueda geoespacial y asignación concurrente sin sobreocupación | Cumplido | PostGIS con índice de expresión comprobado con `EXPLAIN`; test con 6 hilos contra PostgreSQL real en el que entra exactamente uno |
| OE4 | Web Angular publicada como app Android con Capacitor | Cumplido en parte | APK generado por la CI y verificado en emulador, con geolocalización. Las notificaciones push con la app cerrada (frontend#55) no están hechas |
| OE5 | IA: lenguaje natural, moderación y ranking de notificaciones | Cumplido en parte | HU-012 con un modelo que, en simulación, completa los planes en la mitad de tiempo con un 28 % menos de avisos; HU-010 implementada. La moderación (HU-011) falta, y las métricas de HU-012 solo se han medido sobre datos sintéticos |
| OE6 | Despliegue en AWS Lightsail con HTTPS, copias y entornos pre y pro | No cumplido todavía | Compose de producción con Caddy, copias y límites de memoria probado en local; falta el despliegue (infra#5) y las pruebas de carga (HU-015) |
| OE7 | Observabilidad y calidad continua | Cumplido en parte | Prometheus, Loki y Grafana como código; cobertura ≥ 80 % obligatoria en la CI; E2E en cada promoción. SonarQube Cloud está configurado pero sin activar (falta el secreto `SONAR_TOKEN`), así que no hay *quality gate* |
| OE8 | Proceso documentado con capturas | Cumplido | 61 entradas de diario, más de 100 capturas generadas con scripts reproducibles y un ADR |

> **Pendiente:** ¿cómo valoras el cumplimiento del objetivo general? El estado final de OE4, OE5, OE6 y OE7 depende
> de lo que decidas sobre el push en Android, HU-011, el despliegue en AWS, las pruebas de carga y SonarQube.

## 6.2 Lecciones aprendidas

Más allá del producto, el proceso deja varias conclusiones que el diario documenta con casos concretos:

- **La integración continua y los E2E encuentran lo que no se ve en local.** Un `.gitignore` que ocultaba un paquete,
  el redondeo de microsegundos de PostgreSQL en Linux, un *pool* de conexiones de 5 que bloqueaba el gateway con cinco
  flujos abiertos o una exportación CommonJS que solo fallaba en la compilación de producción se detectaron en la CI o
  en la promoción a `pre`, no en el equipo de desarrollo.
- **Las capturas son también pruebas.** Generar las figuras con scripts que recorren la aplicación sacó a la luz
  defectos que los tests no cubrían (un plan cancelado que seguía en «Tus próximos planes», una lista de sugerencias que
  se salía de la pantalla, una etiqueta duplicada), que se corrigieron antes de fusionar.
- **Los valores por defecto de una dependencia forman parte del cambio.** Cambiar el cliente HTTP del proxy cambió
  también el tamaño de su *pool*.
- **Priorizar con MoSCoW protege el núcleo.** Cuando la planificación de los sprints 16 y 17 se desvió, lo que quedó
  fuera fueron historias *Should* y *Could*.
- **Diseñar para el fallo de lo accesorio.** Que el tiempo, los lugares, el chat, la reputación o el modelo de
  ordenación puedan fallar sin impedir publicar ni unirse (RNF-06) obligó a decidir, en cada integración, qué pasa
  cuando no responde.
- **El equipo es parte de la arquitectura.** Los 8 GB de memoria del equipo de desarrollo condicionaron cómo se
  probaba (integración en la CI, stacks mínimos) y llevaron a fijar límites de memoria por contenedor en producción.

> **Pendiente:** ¿qué te llevas tú de este trabajo? Falta tu valoración personal de lo aprendido.

## 6.3 Limitaciones del trabajo

- **Sin despliegue en la nube todavía.** El entorno `pre` existe como rama, imágenes `:pre` y stack de E2E en la CI,
  pero no como instancia en AWS. No hay datos de coste, latencia ni disponibilidad reales.
- **Sin pruebas de carga.** La capacidad de una instancia de 8 GB y el comportamiento de los flujos SSE y del chat con
  muchas conexiones no se han medido.
- **El modelo de ordenación está evaluado solo con datos sintéticos.** El simulador comparte el mecanismo con el que se
  generó el historial, por lo que no demuestra la ganancia con personas reales.
- **El borrador por lenguaje natural no se ha probado con el proveedor real.**
- **Sin patrón *outbox*.** Si un servicio cae entre el commit y la publicación de un evento, ese evento se pierde; está
  documentado y mitigado en el borrado de cuentas, que es repetible.
- **Notificaciones push en Android pendientes** y algunas funciones de la app (compartir la tarjeta para Stories, el
  enlace de «cómo llegar», dictado) sin probar o no disponibles en el WebView.
- **Accesibilidad sin auditoría formal.** Se han aplicado patrones accesibles, pero no hay un informe de conformidad con
  WCAG 2.2 AA.
- **Evaluación con usuarios reales.** El anteproyecto preveía un piloto en el Campus Sur de la UPM, que no se ha hecho.

## 6.4 Líneas de trabajo futuro

- Desplegar `pre` y `pro` en AWS Lightsail (infra#5) y ejecutar las pruebas de carga (HU-015).
- Moderación automática de planes y mensajes (HU-011) y panel de administración (HU-013), que ya tienen preparados los
  reportes de HU-033 y la regla de −50 puntos de reputación al confirmar un reporte.
- Notificaciones push en Android con Firebase (frontend#55).
- Reentrenar y evaluar el modelo de HU-012 con los avisos reales que ya se registran, comparándolo con la regla de
  distancia.
- Patrón *outbox* para la publicación de eventos.
- El agente «¿qué hago ahora?» (HU-014) y las historias de comunidad y confianza del backlog (comunidades, avales de
  nivel, ventajas por reputación, mensajes directos).
- Aplicación web instalable (PWA) y métricas de negocio en Grafana (HU-030, HU-029).
