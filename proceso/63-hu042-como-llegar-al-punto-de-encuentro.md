# 63 · HU-042: cómo llegar al punto de encuentro

**Fecha:** 24/11/2026 · **Sprint:** 19 (20/11–26/11/2026)

## 1. Planificación

| Issue | Tipo | MoSCoW | Puntos | Resultado |
|---|---|---|---|---|
| frontend#30 · HU-042 Cómo llegar al punto de encuentro | Historia | Could | 2 | PR #165 («Part of»); la historia sigue abierta |
| docs#149 · Documentación (esta entrada) | Documentación | | | esta entrada |

**Por qué:** quien se apunta a un plan para las próximas horas necesita saber si llega a tiempo. Hasta ahora la app enseñaba el punto de encuentro, pero no cuánto se tarda en llegar.

## 2. Qué hace

Quien participa en un plan que aún no ha empezado, y quien lo organiza, puede pulsar «Ver la ruta» en la página del plan:

- **Ruta a pie o en bici**, dibujada en un mapa de Leaflet con las teselas de OpenStreetMap (como el mapa de planes cercanos).
- **Tiempo de viaje, distancia y hora de llegada** si se sale ahora.
- **«Abrir en mapas»:** en la app Android, un enlace `geo:lat,lon?q=lat,lon(nombre)`, con el que Android ofrece todas las apps de mapas instaladas; en la web, `openstreetmap.org/directions` con el motor que corresponde (`fossgis_osrm_foot` o `fossgis_osrm_bike`).

Es solo frontend: no cambia la API ni los datos.

## 3. Decisiones

| Decisión | Motivo |
|---|---|
| **Rutas con OSRM en los servidores de FOSSGIS** (`routing.openstreetmap.de`, perfiles `routed-foot` y `routed-bike`), los que usa openstreetmap.org | El servidor de demostración de OSRM (`router.project-osrm.org`) solo tiene el perfil de coche. CORS abierto y sin clave de API |
| **Solo se llama cuando la persona lo pide**, y una vez por modo y página | FOSSGIS es un servicio gratuito y compartido, con política de uso razonable |
| **Tiempo de espera de 10 s y estado degradado claro:** un aviso, y el enlace «Abrir en mapas» sigue estando | Si el servicio de rutas no responde, la persona aún puede llegar |
| **La ubicación se lee y se envía solo al pulsar «Ver la ruta»** (al cambiar de modo se reutiliza la misma lectura) y **se redondea en el dispositivo a 3 decimales** (unos 110 m) | Privacidad por defecto: el tercero recibe una posición aproximada y solo cuando hace falta |
| **La petición se construye sobre `HttpBackend`** y se salta los interceptores | El token de acceso de OneLeft nunca viaja al servicio de rutas (hay un test) |
| **En la web, OpenStreetMap en vez de Google Maps** | Mismo mapa y mismas rutas que en la app, sin el rastreo de Google |
| **El nombre del punto de encuentro se pinta como texto**, nunca como HTML, en los *tooltips* de Leaflet | Es contenido escrito por los usuarios (hay un test) |
| **La política de privacidad lo cuenta** (`privacy.sections.sharing`, es/en): la ubicación aproximada va al servicio de rutas de OpenStreetMap (FOSSGIS) y a openstreetmap.org si se abre allí la ruta. **La versión de la política no cambia** | Es un tercero nuevo que recibe un dato personal |
| **Colores de la línea y de los extremos desde los tokens** (`objects/_map.scss`), en los dos temas | Ningún color suelto |

Piezas nuevas: `RoutingApi` (`core/api`), el componente `PlanRoute`, las utilidades de `shared/geo/directions.ts` y el modelo `TravelRoute`.

## 4. En la app

> **Pendiente: capturas** de la ruta a pie y en bici en la página del plan, y del estado degradado. No se generaron en este hito (no se levantó el stack local).

## 5. Pruebas

- **Web:** 60 tests en 5 ficheros (`plan-route`, `routing-api`, `directions`, `plan-detail` y `privacy`). Cobertura del código nuevo: `plan-route.ts` 75 de 75 líneas (35 de 37 ramas), `routing-api.ts` 17 de 17 y `directions.ts` 8 de 8. Lint y Prettier limpios.
- En los tests unitarios el HTTP está simulado: no hay llamadas reales a OSRM. Un `curl` manual con coordenadas sintéticas de Madrid confirmó el formato de la URL, los perfiles `foot` y `bike` y la cabecera CORS.
- **E2E:** la PR no añade ninguno y no se ejecutaron en local; en la CI de la PR el job de E2E se omitió (solo corre en las PR con la etiqueta `e2e`). El resto de la CI, incluido el APK de Android, pasó en verde.

## 6. Pendiente

- **La historia sigue abierta por una casilla:** «Enlace para abrir la navegación en la app de mapas del dispositivo». El enlace `geo:` está implementado, pero **no se ha comprobado en un Android real**: depende de que Capacitor abra las URL que no son de la app con un *intent* `ACTION_VIEW`. El emulador no es usable en el equipo de desarrollo ([entrada 61](61-e2e-padel-surf.md)); hace falta un dispositivo físico u otro equipo.
- **Por confirmar:** que la versión de la política de privacidad no cambie aunque el texto nombre a un tercero nuevo.
- FOSSGIS es un servicio gratuito y compartido: si está caído, se ve el estado degradado y el enlace a mapas sigue funcionando.
- Capturas (apartado 4).
