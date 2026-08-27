# Rediseño de Entrenar — diseño

**Fecha:** 2026-08-26
**Alcance:** arquitectónico (toca varios archivos que se relacionan entre sí: `Entrenar.jsx`, `BodyDiagram`/`bodyRegions`, `routineGenerator`, `Configuracion`, schema de Supabase).

## Contexto y motivación

Con la ampliación del catálogo a 312 ejercicios (`src/data/exercises.js`, ver commit previo) más los frames SVG animados (`getExerciseFrames` en `src/data/exerciseDemos.js`), la pantalla Entrenar actual se quedó chica. Se armó un harness de testing descartable (mock de datos, sin login, borrado al terminar) para navegar el flujo real y confirmar el problema en vez de asumirlo:

- El `<select>` nativo para "cambiar ejercicio" lista **40+ opciones sin buscar, ordenar ni agrupar**, repetido 5 veces por día (~200 nodos `<option>` en el DOM de una sola pantalla). Inusable en mobile.
- El pool de sustitutos **mezcla fuerza real con movilidad/estiramiento/cardio** (ej. "Postura del niño" o "Saltos de tijera foca" aparecían como reemplazo válido de un press de banca), porque el filtro de músculo amplio no distingue `exerciseType`.
- El resto del flujo (diagrama corporal, sesión activa, timer de descanso, fotos, técnica) funciona sin errores — el problema está acotado a selección/exploración de ejercicios, no al mecanismo de entrenar en sí.

**Usuario objetivo:** el dueño del proyecto y su pareja, ~28 años, entrenan con regularidad (3+ veces/semana), **mayormente en casa con poco equipo**. La app se piensa a futuro como APK — mobile-first, uso con una mano, en movimiento, poca paciencia para inputs chicos.

**Principio rector (explícito del usuario):** la rutina *nunca* está fija por texto — se arma en vivo según el equipamiento real que el usuario activó en Configuración. Esto ya es así hoy (`routineGenerator.usableExercisesForMuscles` filtra todo por `equipment_config`); el rediseño debe preservar y reforzar ese principio, no crear un camino paralelo con contenido fijo.

## Objetivos

1. Reemplazar el `<select>` nativo por un picker de ejercicios con búsqueda y filtro utilizable con 300+ ejercicios.
2. Excluir estiramientos/movilidad/cardio del pool de sustitución y de la generación automática por defecto (bug de datos, no solo de UI).
3. Aprovechar los frames SVG animados (reemplazan las 2 fotos JPG) con fallback prolijo para los ejercicios sin match.
4. Dar acceso a un detalle de ejercicio completo (músculo fino resaltado en el diagrama corporal, técnica, equipo) reusable desde cualquier punto de la app.
5. Exponer en Configuración los tags de equipamiento nuevos que trajo la librería (`wall`, `towel`, `doorway`, `chair`, `stability_ball`, `plate`, `machine`, `cardio`) para que ejercicios de casa (toalla, silla, pared, marco de puerta) y de gimnasio (máquinas) sean alcanzables — el usuario pidió expresamente dejar *todo* disponible, casa y gimnasio ocasional.
6. Retoque visual liviano en los tiles de día (ícono por tipo de split) — no un rediseño de layout de esa parte.

## No objetivos (fuera de este alcance)

- Modo "explorador de ejercicios" independiente de armar rutina (era la opción C, queda para otra spec si se quiere más adelante).
- Empaquetado como APK / Capacitor — mencionado como contexto de producto, no se toca en este trabajo.
- Suite de tests automatizados — el repo no tiene test runner configurado hoy; se mantiene así (YAGNI). Verificación queda manual (harness mock descartable + click-through real en navegador).
- Rediseño de la mecánica de series/descanso/PR — ya funciona bien, confirmado en la prueba.

## Arquitectura y componentes nuevos

`Entrenar.jsx` conserva sus dos fases (`select` / `active`) y su manejo de estado — no se reescribe el flujo de alto nivel. Se agregan 3 componentes nuevos, reusados entre pantallas, más una extensión de uno existente:

- **`ExercisePicker`** (`src/components/ExercisePicker.jsx`, nuevo) — hoja inferior que reemplaza el `<select>`. Buscador (autofocus) + lista de resultados (miniatura = frame 1 del SVG, nombre, tag de equipo, botón "i" de previsualización). El pool que muestra es el mismo que ya calcula `usableExercisesForMuscles` (mismo scope de músculo+equipo que hoy), solo que ahora buscable/filtrable en vez de un `<select>` plano. Selección → mismo `handleSwap` que ya existe.
- **`ExerciseDemo`** (`src/components/ExerciseDemo.jsx`, nuevo) — reemplaza el bloque `demo-wrap` de 2 fotos. Si el ejercicio tiene `demoSlug`, anima los 3 frames SVG (`getExerciseFrames`) en loop ping-pong (1→2→3→2→1, ~700ms/frame, crossfade), pausado si la pestaña no está visible (`visibilitychange`). Si no tiene `demoSlug`, cae al `getExerciseDemo` (2 JPG) existente sin cambios. Crédito discreto ("Ilustraciones: Workout Guide, CC BY-SA 4.0") solo cuando se muestran frames — la licencia lo exige.
- **`ExerciseDetailSheet`** (`src/components/ExerciseDetailSheet.jsx`, nuevo) — hoja de pantalla completa: `ExerciseDemo` grande, nombre, chips de músculo fino + secundarios, equipo, técnica (siempre expandida acá, a diferencia del toggle compacto en sesión activa). Se abre tocando el nombre del ejercicio desde: la lista del día, la sesión activa, o el botón "i" del picker — un solo componente, tres puntos de entrada.
- **`BodyDiagram`** (extensión, no reescritura) — nuevo prop opcional `primaryDetail`/`secondaryDetails` (slugs finos) para que `ExerciseDetailSheet` resalte el músculo específico de un ejercicio, además del set amplio que ya recibe hoy vía `activeMuscles`.

Día tiles: se agrega un ícono simple por `split_type` (empuje/tracción/pierna/torso/full/brazos) en `src/components/Icons.jsx` — no un mini-diagrama.

## Cambios de datos y lógica

**`routineGenerator.js`** — `isUsable()`/`usableExercisesForMuscle(s)` suman un filtro implícito: solo `exerciseType` en `weight_reps | bodyweight_reps | assisted_bodyweight` y `!isStretch`. Se aplica en el pool base, así lo hereda tanto la generación automática de rutina como el picker — un solo arreglo para el bug encontrado en la prueba.

**`bodyRegions.js`** — recuperar la etiqueta de músculo fina por polígono desde la fuente original (`react-body-highlighter`), que ya distingue 19 músculos (cuádriceps, isquiotibiales, glúteos, gemelos, aductores, trapecio, espalda alta, espalda baja, deltoide frontal, deltoide posterior, antebrazo, etc.) en vez de los 7 grupos amplios a los que los reducimos. Es remapeo de datos existentes, no una ilustración nueva. Cubre prácticamente toda la taxonomía fina que ya guardamos en `muscleDetail`/`secondaryMuscles` (`src/data/exercises.js`).

**Equipamiento** — nuevas columnas boolean en `equipment_config` (migración `supabase/migration_004_equipment_expansion.sql`, mismo patrón que `bench`/`pullup_bar`/`bands`): `wall`, `towel`, `doorway`, `chair`, `stability_ball`, `plate`, `machine`, `cardio`. `DEFAULT_CONFIG` (`src/lib/equipmentConfig.js`) las suma en `false`. `GYM_EQUIPMENT_DEFAULTS` (`src/lib/profile.js`) prende `machine`/`cardio`/`stability_ball`/`plate` (equipamiento típico de un gimnasio comercial). `routineGenerator.availableEquipmentTags` mapea las columnas nuevas a tags, igual que las existentes. **Configuración** (`EquipmentSection` en `Configuracion.jsx`) suma esos 8 chips a "Otros implementos" — casa (pared, toalla, marco de puerta, silla, pelota de estabilidad, disco suelto) y gimnasio ocasional (máquina, cardio) conviven en la misma lista, todo queda disponible como pidió el usuario.

## Flujo de acción completo

1. **Elegir día** — igual que hoy + ícono por split. Cada fila de ejercicio separa "tocar nombre" (→ `ExerciseDetailSheet`) de "tocar ícono de cambio" (→ `ExercisePicker`).
2. **Picker** — buscar/filtrar dentro del pool ya equipamiento-consciente; opción "i" previsualiza sin comprometerse; elegir cierra la hoja y aplica el swap.
3. **Sesión activa** — `ExerciseDemo` animado reemplaza las fotos; nombre tocable abre el detalle; el resto (series, descanso, PR, próximo ejercicio) queda intacto.
4. **Configuración** — el usuario marca lo que tiene (casa y/o gimnasio); todo lo demás (picker, generación automática, rutina del día) se recalcula solo a partir de eso — nunca hay contenido fijo por estilo de rutina.

## Manejo de errores / casos borde

- Picker sin resultados (búsqueda+filtro) → mensaje vacío, no crash.
- Ejercicio sin `demoSlug` → fallback a JPG existente; si tampoco hay JPG → no se renderiza sección de demo (como hoy).
- Frame SVG que falla al cargar → placeholder mudo con inicial del nombre, no ícono de imagen rota.
- Pool de swap con una sola opción o vacío → el picker igual abre y lo indica (mismo patrón que ya usa `canAdd`/`options` hoy), no se oculta la acción.

## Verificación

Sin test runner en el repo (no se agrega uno solo para esto). Verificación manual: harness mock descartable (como el usado para diagnosticar el problema, se borra al terminar) + click-through real en el navegador cubriendo: búsqueda/filtro del picker, swap, apertura/cierre del detalle, loop y pausa de los frames animados, fallback a JPG, y los toggles nuevos de equipamiento reflejándose en el pool.
