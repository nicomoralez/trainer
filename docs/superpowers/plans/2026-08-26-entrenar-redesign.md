# Rediseño de Entrenar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el `<select>` de "cambiar ejercicio" por un picker buscable, mostrar los frames SVG animados en vez de las 2 fotos JPG, dar acceso a un detalle de ejercicio con músculo fino resaltado en el diagrama corporal, y exponer en Configuración el equipamiento nuevo (casa + gimnasio) para que la generación de rutina y el picker lo aprovechen.

**Architecture:** Cuatro componentes nuevos y reusables (`ExercisePicker`, `ExerciseDemo`, `ExerciseDetailSheet`, extensión de `BodyDiagram`) se insertan en el `Entrenar.jsx` existente sin tocar su estructura de fases (`select`/`active`). `bodyRegions.js` recupera etiquetas de músculo fino por polígono (dato ya existente en la librería original, no ilustración nueva). `routineGenerator.js` gana un filtro de `exerciseType`. `equipment_config` suma columnas nuevas vía migración SQL, reflejadas en `Configuracion.jsx`.

**Tech Stack:** React 19 + Vite, sin TypeScript, sin test runner (decisión explícita de la spec — no se agrega uno). CSS plano en `src/index.css` (sin CSS modules ni styled-components). Supabase (Postgres + RLS) para persistencia.

**Spec:** [docs/superpowers/specs/2026-08-26-entrenar-redesign-design.md](../specs/2026-08-26-entrenar-redesign-design.md)

## Global Constraints

- Sin test runner en el repo — no se instala Vitest/Jest solo para esto. Verificación: `npm run build`, `npm run lint`, scripts Node descartables (`node -e "..."` o un archivo temporal borrado al final de la task) para lógica pura, y click-through real en el navegador (Browser pane) para UI.
- Estilo de código existente: sin punto y coma, comillas simples, 2 espacios de indentación, funciones sin tipos (JS puro). Seguir el patrón de cada archivo que se edita.
- El swap de ejercicio sigue acotado al mismo pool que ya calcula `usableExercisesForMuscles` (músculo del día + equipo del usuario) — el picker es una mejora de UI sobre ese pool, no una expansión de alcance.
- Ningún ejercicio de tipo `duration` / `distance_duration` / `isStretch: true` puede aparecer como sugerencia de generación automática ni de swap, salvo que se pida expresamente lo contrario en el futuro.
- Toda columna nueva de `equipment_config` sigue el patrón existente: `boolean not null default false`.
- Colores/tipografías: usar los tokens ya definidos en `:root` de `src/index.css` (`--accent`, `--accent-2`, `--text-dim`, `--text-faint`, `--line`, `--bg-elev`, `--bg-soft`, `--font-mono`, `--font-display`) — no introducir valores hardcodeados nuevos.

---

## Task 1: Ampliar `equipment_config` (migración + defaults + mapeo de tags)

**Files:**
- Create: `supabase/migration_004_equipment_expansion.sql`
- Modify: `src/lib/equipmentConfig.js` (DEFAULT_CONFIG)
- Modify: `src/lib/profile.js` (GYM_EQUIPMENT_DEFAULTS)
- Modify: `src/lib/routineGenerator.js:5-15` (availableEquipmentTags)

**Interfaces:**
- Produces: `DEFAULT_CONFIG` y `GYM_EQUIPMENT_DEFAULTS` con 8 campos boolean nuevos: `wall`, `towel`, `doorway`, `chair`, `stability_ball`, `plate`, `machine`, `cardio`. `availableEquipmentTags(config)` devuelve un `Set` que incluye esos tags cuando el campo correspondiente es `true`. Tasks posteriores (3, 9) consumen estos mismos nombres de campo/tag — no cambiarlos.

- [ ] **Step 1: Escribir la migración SQL**

Crear `supabase/migration_004_equipment_expansion.sql`:

```sql
-- Migración 004 — equipamiento de casa (poco material) + gimnasio ocasional
-- Correr en el SQL Editor de Supabase. Independiente de las migraciones
-- anteriores, es seguro correrla sobre una base que ya está en uso.

alter table equipment_config add column if not exists wall boolean not null default false;
alter table equipment_config add column if not exists towel boolean not null default false;
alter table equipment_config add column if not exists doorway boolean not null default false;
alter table equipment_config add column if not exists chair boolean not null default false;
alter table equipment_config add column if not exists stability_ball boolean not null default false;
alter table equipment_config add column if not exists plate boolean not null default false;
alter table equipment_config add column if not exists machine boolean not null default false;
alter table equipment_config add column if not exists cardio boolean not null default false;
```

- [ ] **Step 2: Actualizar `DEFAULT_CONFIG`**

En `src/lib/equipmentConfig.js`, dentro del objeto `DEFAULT_CONFIG` (líneas 3-17), agregar después de `cable: false,`:

```js
  wall: false,
  towel: false,
  doorway: false,
  chair: false,
  stability_ball: false,
  plate: false,
  machine: false,
  cardio: false,
```

- [ ] **Step 3: Actualizar `GYM_EQUIPMENT_DEFAULTS`**

En `src/lib/profile.js`, dentro de `GYM_EQUIPMENT_DEFAULTS` (líneas 12-30), agregar después de `cable: true,`:

```js
  machine: true,
  cardio: true,
  stability_ball: true,
  plate: true,
```

(`wall`/`towel`/`doorway`/`chair` quedan en `false` bajo el preset de gimnasio — son trucos de casa sin equipo real, no algo que alguien elija a propósito estando en un gimnasio.)

- [ ] **Step 4: Mapear los tags nuevos en `availableEquipmentTags`**

En `src/lib/routineGenerator.js`, dentro de `availableEquipmentTags` (líneas 5-15), agregar después de `if (config.cable) tags.add('cable')`:

```js
  if (config.wall) tags.add('wall')
  if (config.towel) tags.add('towel')
  if (config.doorway) tags.add('doorway')
  if (config.chair) tags.add('chair')
  if (config.stability_ball) tags.add('stability_ball')
  if (config.plate) tags.add('plate')
  if (config.machine) tags.add('machine')
  if (config.cardio) tags.add('cardio')
```

- [ ] **Step 5: Verificar con un script Node descartable**

Crear temporalmente `scratch_verify_task1.mjs` en la raíz del repo:

```js
import { availableEquipmentTags } from './src/lib/routineGenerator.js'
import { DEFAULT_CONFIG } from './src/lib/equipmentConfig.js'
import { GYM_EQUIPMENT_DEFAULTS } from './src/lib/profile.js'

const empty = availableEquipmentTags(DEFAULT_CONFIG)
console.assert(empty.size === 0, 'DEFAULT_CONFIG no debería habilitar ningún tag')

const gymConfig = { ...DEFAULT_CONFIG, ...GYM_EQUIPMENT_DEFAULTS }
const gymTags = availableEquipmentTags(gymConfig)
for (const t of ['machine', 'cardio', 'stability_ball', 'plate', 'barbell', 'dumbbells', 'kettlebell', 'bench', 'pullup_bar', 'bands', 'cable']) {
  console.assert(gymTags.has(t), `falta el tag ${t} en el preset de gimnasio`)
}
console.assert(!gymTags.has('wall'), 'wall no debería estar en el preset de gimnasio')

const homeConfig = { ...DEFAULT_CONFIG, wall: true, towel: true, doorway: true, chair: true }
const homeTags = availableEquipmentTags(homeConfig)
for (const t of ['wall', 'towel', 'doorway', 'chair']) {
  console.assert(homeTags.has(t), `falta el tag ${t} en config de casa`)
}

console.log('Task 1 OK')
```

Run: `node scratch_verify_task1.mjs`
Expected: imprime `Task 1 OK` sin ningún mensaje de `Assertion failed`.

- [ ] **Step 6: Borrar el script descartable**

```bash
rm scratch_verify_task1.mjs
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migration_004_equipment_expansion.sql src/lib/equipmentConfig.js src/lib/profile.js src/lib/routineGenerator.js
git commit -m "Suma equipamiento de casa y gimnasio ocasional a equipment_config"
```

**Nota para el usuario (no es parte de este task):** la migración SQL hay que correrla a mano en el SQL Editor de Supabase — el repo no tiene CLI de Supabase configurado, mismo patrón que `migration_002`/`migration_003`.

---

## Task 2: Filtrar `exerciseType`/`isStretch` en `routineGenerator`

**Files:**
- Modify: `src/lib/routineGenerator.js:17-19` (`isUsable`)

**Interfaces:**
- Consumes: `exercise.exerciseType` y `exercise.isStretch` de `src/data/exercises.js` (ya existen en los 312 ejercicios, ver commit previo).
- Produces: `isUsable(exercise, availableTags)` ahora también exige `exerciseType` en el set permitido y `!exercise.isStretch`. `usableExercisesForMuscle(s)` y `pickRoundRobin` (que llaman a `isUsable` internamente) heredan el filtro sin cambios propios.

- [ ] **Step 1: Escribir el filtro**

En `src/lib/routineGenerator.js`, reemplazar:

```js
function isUsable(exercise, availableTags) {
  return exercise.equipment.every((tag) => availableTags.has(tag))
}
```

por:

```js
const ROUTINE_EXERCISE_TYPES = new Set(['weight_reps', 'bodyweight_reps', 'assisted_bodyweight'])

// Excluye estiramientos, movilidad y cardio por duración/distancia del pool
// de rutina — no encajan con el modelo de series×reps y no deben aparecer
// como sustituto de un ejercicio de fuerza (ver spec de rediseño de Entrenar).
function isUsable(exercise, availableTags) {
  if (!ROUTINE_EXERCISE_TYPES.has(exercise.exerciseType)) return false
  if (exercise.isStretch) return false
  return exercise.equipment.every((tag) => availableTags.has(tag))
}
```

- [ ] **Step 2: Verificar con un script Node descartable**

Crear temporalmente `scratch_verify_task2.mjs`:

```js
import { usableExercisesForMuscles, availableEquipmentTags } from './src/lib/routineGenerator.js'
import { DEFAULT_CONFIG } from './src/lib/equipmentConfig.js'

const config = { ...DEFAULT_CONFIG, dumbbells_enabled: true, bench: true, pullup_bar: true, barbell_enabled: true }
const back = usableExercisesForMuscles(config, ['back'])

console.assert(back.some((e) => e.id === 'dominadas'), 'dominadas debería seguir apareciendo')
console.assert(!back.some((e) => e.id === 'postura-del-nino'), 'un estiramiento no debería aparecer como ejercicio de espalda')
console.assert(!back.some((e) => e.exerciseType === 'duration'), 'ningún ejercicio de duración debería colarse')
console.assert(!back.some((e) => e.isStretch), 'ningún estiramiento debería colarse')

console.log(`Task 2 OK — ${back.length} ejercicios de espalda usables, todos weight_reps/bodyweight_reps/assisted_bodyweight`)
```

Run: `node scratch_verify_task2.mjs`
Expected: imprime `Task 2 OK — N ejercicios...` sin `Assertion failed`.

- [ ] **Step 3: Borrar el script y commitear**

```bash
rm scratch_verify_task2.mjs
git add src/lib/routineGenerator.js
git commit -m "Excluye estiramientos, movilidad y cardio del pool de rutina/swap"
```

---

## Task 3: Etiquetas de músculo fino en `bodyRegions.js`

**Files:**
- Modify: `src/lib/bodyRegions.js:30-92` (helpers `region`/`regionAuto` + arrays `ANTERIOR`/`POSTERIOR`)

**Interfaces:**
- Produces: cada objeto de `ANTERIOR`/`POSTERIOR` gana un campo `detail` (string fino, ej. `'quads'`, `'glutes'`, `'lats'`... o `null` si es neutro) además de los existentes `muscle`/`part`/`d`. `muscle`/`part`/`d` **no cambian** — el diagrama de día (broad, `activeMuscles`) sigue funcionando exactamente igual. Task 4 (`BodyDiagram`) consume este `detail` nuevo.
- Los valores de `detail` deben ser exactamente los slugs de `MUSCLE_DETAIL_LABEL` en `src/data/exercises.js`: `chest`, `shoulders`, `rear-delts`, `upper-back`, `back`, `lats`, `lower-back`, `posterior-chain`, `biceps`, `triceps`, `forearms`, `quads`, `hamstrings`, `glutes`, `calves`, `adductors`, `hips`, `legs`, `core`, `mobility`.

**IMPORTANTE — no retipear coordenadas:** este task NO reescribe ningún string de coordenadas SVG. Usa `Read` para traer el contenido actual y exacto de `src/lib/bodyRegions.js`, y `Edit` con `old_string`/`new_string` copiados textualmente de esa lectura (nunca reescritos de memoria). Un solo dígito mal tipeado corrompería un polígono en silencio.

- [ ] **Step 1: Extender los helpers `region`/`regionAuto`**

Leer `src/lib/bodyRegions.js` y reemplazar (usando el texto exacto leído como `old_string`):

```js
function region(muscle, part, points) {
  return points.map((d) => ({ muscle, part, d }))
}

function regionAuto(muscle, partBase, points) {
  return points.map((d) => ({ muscle, part: `${partBase}${sideOf(d)}`, d }))
}
```

por:

```js
// `details` es un array paralelo y posicional a `points` (mismo índice =
// mismo polígono) con el músculo fino de ese polígono específico — viene de
// separar de nuevo lo que la fuente original (react-body-highlighter, ver
// ATTRIBUTION) ya distinguía y que acá habíamos fusionado en 7 grupos
// amplios. Si no se pasa, cada polígono hereda `muscle` como su detail (ej.
// pecho, bíceps, tríceps: el grupo amplio y el fino son el mismo).
function region(muscle, part, points, details) {
  return points.map((d, i) => ({ muscle, part, detail: details ? details[i] : muscle, d }))
}

function regionAuto(muscle, partBase, points, details) {
  return points.map((d, i) => ({ muscle, part: `${partBase}${sideOf(d)}`, detail: details ? details[i] : muscle, d }))
}
```

- [ ] **Step 2: Agregar el 4to argumento en cada call site que lo necesita**

Para cada entrada de la tabla, ubicar el call site en `ANTERIOR` o `POSTERIOR` por su combinación única de función+muscle+part (cada una aparece una sola vez en su mitad del archivo) y usar `Edit` para insertar el array de `details` como argumento final, justo antes del `)` que cierra el call — el `old_string` debe incluir el `])` (o `],\n  ),` según el formato exacto leído) que ya está en el archivo, copiado tal cual de la lectura, y el `new_string` es lo mismo más `, [ ... ])`.

| Mitad | Call (función, muscle, part) | `details` a agregar |
|---|---|---|
| ANTERIOR | `region('abs', 'torso', [...4 strings])` | `['core', 'core', 'core', 'core']` |
| ANTERIOR | `region('legs', 'pelvis', [...2 strings])` | `['hips', 'hips']` |
| ANTERIOR | `regionAuto('legs', 'thigh', [...6 strings])` | `['quads', 'quads', 'quads', 'quads', 'quads', 'quads']` |
| ANTERIOR | `regionAuto('legs', 'shin', [...6 strings])` | `[null, null, 'calves', 'calves', 'calves', 'calves']` |
| ANTERIOR | `regionAuto(null, 'forearm', [...4 strings])` | `['forearms', 'forearms', 'forearms', 'forearms']` |
| POSTERIOR | `region('back', 'torso', [...6 strings])` | `['upper-back', 'upper-back', 'upper-back', 'upper-back', 'lower-back', 'lower-back']` |
| POSTERIOR | `regionAuto('shoulders', 'upperArm', [...2 strings])` | `['rear-delts', 'rear-delts']` |
| POSTERIOR | `regionAuto(null, 'forearm', [...4 strings])` | `['forearms', 'forearms', 'forearms', 'forearms']` |
| POSTERIOR | `region('legs', 'pelvis', [...2 strings])` | `['glutes', 'glutes']` |
| POSTERIOR | `regionAuto('legs', 'thigh', [...4 strings])` | `['adductors', 'adductors', 'hamstrings', 'hamstrings']` |
| POSTERIOR | `regionAuto('legs', 'shin', [...8 strings])` | `[null, null, 'calves', 'calves', 'calves', 'calves', 'calves', 'calves']` |

Los siguientes call sites **no se tocan** (el default `detail = muscle` ya es correcto): `region('chest', 'torso', ...)`, `regionAuto('biceps', 'upperArm', ...)`, `regionAuto('triceps', 'upperArm', ...)` (ambas mitades), `region(null, 'torso', ...)` (cuello y cabeza, ambas mitades), `regionAuto('shoulders', 'upperArm', ...)` en ANTERIOR (deltoides frontal = `'shoulders'` genérico, correcto).

El orden dentro de cada array de `details` es el mismo orden en que aparecen los strings de coordenadas en el `points` original (de arriba hacia abajo tal como están escritos hoy) — no reordenar nada, solo anexar.

- [ ] **Step 3: Verificar con un script Node descartable**

Crear temporalmente `scratch_verify_task3.mjs`:

```js
import { ANTERIOR, POSTERIOR } from './src/lib/bodyRegions.js'

const counts = {}
for (const r of [...ANTERIOR, ...POSTERIOR]) {
  const k = r.detail ?? 'null'
  counts[k] = (counts[k] ?? 0) + 1
}
console.log(counts)

const expect = {
  chest: 2, biceps: 4, triceps: 6, shoulders: 2, core: 4,
  hips: 2, quads: 6, calves: 10, forearms: 8,
  'upper-back': 4, 'lower-back': 2, 'rear-delts': 2,
  glutes: 2, adductors: 2, hamstrings: 2,
}
for (const [k, v] of Object.entries(expect)) {
  console.assert(counts[k] === v, `detail "${k}" esperaba ${v}, encontró ${counts[k]}`)
}
console.assert((ANTERIOR.length + POSTERIOR.length) === Object.values(counts).reduce((a, b) => a + b, 0), 'todos los polígonos deben tener detail (aunque sea null)')

console.log('Task 3 OK')
```

Run: `node scratch_verify_task3.mjs`
Expected: imprime el objeto de conteos, luego `Task 3 OK`, sin `Assertion failed`. Si algún conteo no matchea, releer la tabla del Step 2 — es señal de que se saltó o duplicó un call site.

- [ ] **Step 4: Borrar el script y commitear**

```bash
rm scratch_verify_task3.mjs
git add src/lib/bodyRegions.js
git commit -m "Recupera musculo fino por poligono en bodyRegions (quads, glutes, lats, etc.)"
```

---

## Task 4: `BodyDiagram` acepta músculo fino a resaltar

**Files:**
- Modify: `src/components/BodyDiagram.jsx` (todo el archivo, es corto)
- Modify: `src/index.css` (agregar después de la regla `.bd-region.bd-active`, buscar con Grep `\.bd-region\.bd-active`)

**Interfaces:**
- Consumes: `r.detail` de cada polígono (Task 3).
- Produces: `BodyDiagram({ gender, activeMuscles, primaryDetail, secondaryDetails })` — `primaryDetail` (string u `null`, opcional) y `secondaryDetails` (array de strings, opcional) son nuevos, **no rompen** el uso actual en `Entrenar.jsx` (que no los pasa). Task 8 (`ExerciseDetailSheet`) los consume.

- [ ] **Step 1: Reescribir `BodyDiagram.jsx`**

```jsx
import { useId } from 'react'
import { ANTERIOR, POSTERIOR, reshape } from '../lib/bodyRegions'

// Silueta humana con anatomía real (ver src/lib/bodyRegions.js), frente y
// espalda, coloreando en "calor" los grupos musculares que se van a
// entrenar. `gender` reproporciona la misma silueta (ver `reshape`), no hay
// segundo set de arte. `primaryDetail`/`secondaryDetails` suman un resalte
// extra (borde brillante) sobre el músculo fino de un ejercicio puntual,
// encima del calor amplio de `activeMuscles` — no lo reemplazan.

function Figure({ gender, view, activeMuscles, primaryDetail, secondaryDetails, gradientId }) {
  const regions = view === 'front' ? ANTERIOR : POSTERIOR
  return (
    <svg viewBox="0 0 100 220" className="bd-figure" role="img" aria-label={`Cuerpo humano, vista ${view === 'front' ? 'frontal' : 'trasera'}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--heat-hi)" />
          <stop offset="100%" stopColor="var(--heat-lo)" />
        </linearGradient>
      </defs>
      {regions.map((r, i) => {
        const active = r.muscle != null && activeMuscles.has(r.muscle)
        const isPrimary = primaryDetail != null && r.detail === primaryDetail
        const isSecondary = !isPrimary && secondaryDetails?.includes(r.detail)
        const fill = active ? `url(#${gradientId})` : 'var(--bd-off)'
        const cls = `bd-region ${active ? 'bd-active' : ''} ${isPrimary ? 'bd-region-primary' : ''} ${isSecondary ? 'bd-region-secondary' : ''}`.trim()
        return <polygon key={i} points={reshape(r.d, gender)} className={cls} fill={fill} />
      })}
    </svg>
  )
}

export default function BodyDiagram({ gender = 'male', activeMuscles, primaryDetail, secondaryDetails }) {
  const uid = useId()
  const muscles = activeMuscles instanceof Set ? activeMuscles : new Set(activeMuscles ?? [])

  return (
    <div className="body-diagram">
      <div className="bd-col">
        <Figure gender={gender} view="front" activeMuscles={muscles} primaryDetail={primaryDetail} secondaryDetails={secondaryDetails} gradientId={`bd-grad-f-${uid}`} />
        <span className="bd-view-label">Frente</span>
      </div>
      <div className="bd-col">
        <Figure gender={gender} view="back" activeMuscles={muscles} primaryDetail={primaryDetail} secondaryDetails={secondaryDetails} gradientId={`bd-grad-b-${uid}`} />
        <span className="bd-view-label">Espalda</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Agregar el CSS del resalte fino**

En `src/index.css`, después del bloque `.bd-region.bd-active { ... }` y su `@keyframes bd-pulse`, agregar:

```css
.bd-region.bd-region-primary {
  stroke: var(--accent-2);
  stroke-width: 1.6;
  filter: drop-shadow(0 0 3px var(--accent-2));
}
.bd-region.bd-region-secondary {
  stroke: var(--accent-2);
  stroke-width: 0.8;
  stroke-opacity: 0.55;
}
```

- [ ] **Step 3: Verificación visual con ruta descartable**

Crear temporalmente `src/pages/__preview.jsx`:

```jsx
import BodyDiagram from '../components/BodyDiagram'

export default function Preview() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Sin detail</h2>
      <BodyDiagram gender="male" activeMuscles={['legs']} />
      <h2>Con primaryDetail=quads, secondaryDetails=[glutes]</h2>
      <BodyDiagram gender="male" activeMuscles={['legs']} primaryDetail="quads" secondaryDetails={['glutes']} />
    </div>
  )
}
```

En `src/App.jsx`, agregar temporalmente (antes de `export default function App()`, y modificar el `return` de `App`):

```jsx
import Preview from './pages/__preview'
```

y dentro de `export default function App() {`, como primera línea del cuerpo:

```jsx
  if (typeof window !== 'undefined' && window.location.pathname === '/__preview') return <Preview />
```

- Levantar el dev server (`preview_start` con el nombre configurado en `.claude/launch.json`, o `npm run dev`).
- Navegar a `/__preview` en el Browser pane.
- Confirmar con `read_console_messages` que no hay errores.
- Confirmar con `read_page` (filter `all`) que el segundo diagrama tiene polígonos con un `stroke`/`filter` distinto al primero (o revisar visualmente con `computer` screenshot si el pane está visible).

- [ ] **Step 4: Revertir el harness descartable**

```bash
rm src/pages/__preview.jsx
git checkout -- src/App.jsx
```

(Si `git checkout` fallara porque `App.jsx` tiene otros cambios sin commitear de un task anterior, revertir a mano el import y la línea agregada.)

- [ ] **Step 5: Commit**

```bash
git add src/components/BodyDiagram.jsx src/index.css
git commit -m "BodyDiagram acepta musculo fino (primaryDetail/secondaryDetails) ademas del calor amplio"
```

---

## Task 5: Íconos de tipo de día

**Files:**
- Modify: `src/components/Icons.jsx` (agregar al final del archivo)

**Interfaces:**
- Produces: `IconDayPush`, `IconDayPull`, `IconDayLegs`, `IconDayArms` — mismo patrón que los íconos existentes (`props` spread, `viewBox="0 0 24 24"`). Task 10 los consume para los tiles de día.

- [ ] **Step 1: Agregar los íconos**

Al final de `src/components/Icons.jsx`, agregar:

```jsx
export function IconDayPush(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" {...props}>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M8.5 12h7" />
    </svg>
  )
}

export function IconDayPull(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" {...props}>
      <path d="M4 8h16M4 8l3-3M4 8l3 3M20 8l-3-3M20 8l-3 3M12 8v13" />
    </svg>
  )
}

export function IconDayLegs(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" {...props}>
      <path d="M9 3v7l-3 11h3l2-8 2 8h3l-3-11V3" />
    </svg>
  )
}

export function IconDayArms(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" {...props}>
      <path d="M4 16c2-6 6-9 8-9s6 3 8 9M8 15l2-2M16 15l-2-2" />
    </svg>
  )
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run build`
Expected: build exitoso, sin errores de sintaxis JSX.

- [ ] **Step 3: Commit**

```bash
git add src/components/Icons.jsx
git commit -m "Suma iconos de tipo de dia (push/pull/legs/arms)"
```

---

## Task 6: Componente `ExerciseDemo`

**Files:**
- Create: `src/components/ExerciseDemo.jsx`
- Modify: `src/index.css` (agregar después de las reglas `.demo-shot .demo-label`, buscar con Grep `\.demo-shot \.demo-label`)

**Interfaces:**
- Consumes: `getExerciseFrames(demoSlug)` y `getExerciseDemo(exerciseId)` de `src/data/exerciseDemos.js` (ya existen).
- Produces: `ExerciseDemo({ exercise })` donde `exercise` es un objeto completo de `EXERCISES_BY_ID` (con `id`, `name`, `demoSlug` opcional). Devuelve `null` si no hay nada que mostrar (frames ni JPG) — el caller no necesita un guard externo. Consumida por Task 8 y Task 10.

- [ ] **Step 1: Crear el componente**

```jsx
import { useEffect, useRef, useState } from 'react'
import { getExerciseDemo, getExerciseFrames } from '../data/exerciseDemos'

const FRAME_INTERVAL_MS = 700

// Rebota entre el primer y último frame (0,1,2,1,0,1,2,1...) en vez de
// cortar de golpe del último al primero — se lee más como una repetición
// real (ida y vuelta) que como un slideshow.
function pingPongNext(i, length, dir) {
  let next = i + dir
  let nextDir = dir
  if (next >= length) {
    next = length - 2
    nextDir = -1
  } else if (next < 0) {
    next = 1
    nextDir = 1
  }
  return { next, nextDir }
}

export default function ExerciseDemo({ exercise }) {
  const frames = exercise?.demoSlug ? getExerciseFrames(exercise.demoSlug) : null
  const [frameIndex, setFrameIndex] = useState(0)
  const [frameError, setFrameError] = useState(false)
  const dirRef = useRef(1)

  useEffect(() => {
    setFrameIndex(0)
    setFrameError(false)
    dirRef.current = 1
  }, [exercise?.id])

  useEffect(() => {
    if (!frames || frames.length < 2) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setFrameIndex((i) => {
        const { next, nextDir } = pingPongNext(i, frames.length, dirRef.current)
        dirRef.current = nextDir
        return next
      })
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(id)
  }, [frames])

  if (!exercise) return null

  if (frames && !frameError) {
    return (
      <div className="demo-frames">
        <img
          key={frameIndex}
          src={frames[frameIndex]}
          alt={`${exercise.name} — animación`}
          className="demo-frame-img"
          loading="lazy"
          onError={() => setFrameError(true)}
        />
        <span className="demo-credit">
          Ilustraciones:{' '}
          <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noreferrer">
            Workout Guide
          </a>{' '}
          (CC BY-SA 4.0)
        </span>
      </div>
    )
  }

  if (frames && frameError) {
    return <div className="demo-frames demo-frame-fallback">{exercise.name?.[0] ?? '?'}</div>
  }

  const legacy = getExerciseDemo(exercise.id)
  if (!legacy) return null

  return (
    <div className="demo-wrap">
      <div className="demo-shot">
        <img src={legacy.start} alt={`${exercise.name} — posición inicial`} loading="lazy" />
        <span className="demo-label">Inicio</span>
      </div>
      <div className="demo-shot">
        <img src={legacy.end} alt={`${exercise.name} — posición final`} loading="lazy" />
        <span className="demo-label">Fin</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CSS**

En `src/index.css`, después de `.demo-shot .demo-label { ... }`, agregar:

```css
.demo-frames {
  position: relative;
  margin: 10px 0 4px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--bg-soft);
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
}
.demo-frame-img {
  width: 68%;
  height: 68%;
  object-fit: contain;
  animation: frame-fade-in 0.25s ease-out both;
}
@keyframes frame-fade-in {
  from {
    opacity: 0.35;
  }
  to {
    opacity: 1;
  }
}
.demo-credit {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.56rem;
  color: var(--text-faint);
  font-family: var(--font-mono);
}
.demo-credit a {
  color: var(--text-faint);
}
.demo-frame-fallback {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-faint);
}
```

- [ ] **Step 3: Verificación visual con ruta descartable**

Crear temporalmente `src/pages/__preview.jsx`:

```jsx
import { EXERCISES_BY_ID } from '../data/exercises'
import ExerciseDemo from '../components/ExerciseDemo'

export default function Preview() {
  return (
    <div style={{ padding: 20, maxWidth: 360 }}>
      <h2>Con frames (bench-press)</h2>
      <ExerciseDemo exercise={EXERCISES_BY_ID['press-banca-barra']} />
      <h2>Fallback JPG (sin demoSlug)</h2>
      <ExerciseDemo exercise={EXERCISES_BY_ID['remo-kettlebell']} />
      <h2>Sin nada (id inventado)</h2>
      <ExerciseDemo exercise={{ id: 'no-existe', name: 'Nada' }} />
    </div>
  )
}
```

Agregar la misma ruta temporal `/__preview` en `App.jsx` que en Task 4, Step 3 (mismo import, mismo `if`).

- Levantar el dev server, navegar a `/__preview`.
- Confirmar con `get_page_text` o `read_console_messages` que no hay errores.
- Esperar ~3 segundos y volver a leer — el primer bloque debería mostrar una imagen que cambió (frame distinto) si se compara el `src` del `<img>` antes y después (usar `read_page` para ver el atributo `src`, o `javascript_tool` para leer `document.querySelector('.demo-frame-img').src`).
- Confirmar que el segundo bloque muestra las 2 fotos JPG (`.demo-shot`) y el tercero no renderiza nada.

- [ ] **Step 4: Revertir el harness**

```bash
rm src/pages/__preview.jsx
git checkout -- src/App.jsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ExerciseDemo.jsx src/index.css
git commit -m "Agrega ExerciseDemo: frames SVG animados con fallback a fotos JPG"
```

---

## Task 7: Componente `ExercisePicker`

**Files:**
- Create: `src/components/ExercisePicker.jsx`
- Modify: `src/index.css` (agregar después de `.modal-close { ... }`)

**Interfaces:**
- Consumes: `getExerciseFrames(demoSlug)` de `src/data/exerciseDemos.js`.
- Produces: `ExercisePicker({ pool, currentExerciseId, onSelect, onPreview, onClose })`. `pool`: array de objetos ejercicio (mismo shape que `EXERCISES`). `onSelect(exerciseId)`, `onPreview(exercise)`, `onClose()`. No maneja su propio estado de apertura — el caller decide cuándo montarlo/desmontarlo. Consumido por Task 10.

- [ ] **Step 1: Crear el componente**

```jsx
import { useMemo, useState } from 'react'
import { getExerciseFrames } from '../data/exerciseDemos'

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Hoja de búsqueda que reemplaza al <select> nativo para "cambiar
// ejercicio". `pool` ya viene filtrado por músculo del día + equipo
// disponible (ver usableExercisesForMuscles) — acá solo se busca/filtra por
// texto dentro de ese mismo pool, no se amplía el alcance.
export default function ExercisePicker({ pool, currentExerciseId, onSelect, onPreview, onClose }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return pool
    return pool.filter((e) => normalize(e.name).includes(q))
  }, [pool, query])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="panel-title" style={{ marginBottom: 0 }}>
            Cambiar ejercicio
          </span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <input
          type="text"
          className="picker-search"
          placeholder="Buscar ejercicio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="picker-list">
          {results.map((e) => {
            const frame = getExerciseFrames(e.demoSlug)?.[0]
            return (
              <div key={e.id} className={`picker-row ${e.id === currentExerciseId ? 'current' : ''}`}>
                <button type="button" className="picker-row-main" onClick={() => onSelect(e.id)}>
                  <span className="picker-row-thumb">{frame && <img src={frame} alt="" loading="lazy" />}</span>
                  <span className="picker-row-info">
                    <span className="n">{e.name}</span>
                    <span className="s">{e.equipment.length === 0 ? 'Peso corporal' : e.equipment.join(', ')}</span>
                  </span>
                </button>
                <button type="button" className="picker-row-preview" onClick={() => onPreview(e)} aria-label={`Ver detalle de ${e.name}`}>
                  i
                </button>
              </div>
            )
          })}
          {results.length === 0 && <p className="empty-hint">No encontramos ejercicios con ese filtro.</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CSS**

En `src/index.css`, después de `.modal-close { ... }`, agregar:

```css
.picker-sheet {
  display: flex;
  flex-direction: column;
  max-height: 78vh;
}
.picker-search {
  width: 100%;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-size: 0.9rem;
  padding: 10px 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.picker-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.picker-row {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #ffffff12;
}
.picker-row.current {
  background: var(--accent-soft);
}
.picker-row-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 9px 4px;
  background: none;
  border: none;
  text-align: left;
}
.picker-row-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-row-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.picker-row-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.picker-row-info .n {
  font-size: 0.83rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.picker-row-info .s {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-family: var(--font-mono);
  text-transform: capitalize;
}
.picker-row-preview {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: none;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-style: italic;
  font-size: 0.78rem;
}
```

- [ ] **Step 3: Verificación con ruta descartable**

Crear temporalmente `src/pages/__preview.jsx`:

```jsx
import { useState } from 'react'
import { EXERCISES } from '../data/exercises'
import ExercisePicker from '../components/ExercisePicker'

export default function Preview() {
  const [open, setOpen] = useState(true)
  const [log, setLog] = useState('')
  const pool = EXERCISES.filter((e) => e.muscle === 'back').slice(0, 30)

  if (!open) return <div style={{ padding: 20 }}>Cerrado. Log: {log}</div>

  return (
    <ExercisePicker
      pool={pool}
      currentExerciseId="dominadas"
      onSelect={(id) => {
        setLog(`selected:${id}`)
        setOpen(false)
      }}
      onPreview={(e) => setLog(`preview:${e.id}`)}
      onClose={() => {
        setLog('closed')
        setOpen(false)
      }}
    />
  )
}
```

Agregar la misma ruta temporal `/__preview` en `App.jsx` que en tasks anteriores.

- Levantar el dev server, navegar a `/__preview`.
- Escribir "remo" en el buscador (`computer` type) y confirmar con `get_page_text` que la lista se reduce a resultados que contienen "remo".
- Click en una fila (no en el botón "i") y confirmar que la página muestra `Cerrado. Log: selected:<id>`.
- Repetir navegando de nuevo a `/__preview`, esta vez click en el botón "i" de una fila y confirmar `preview:<id>` sin cerrar el picker.
- Confirmar con `read_console_messages` que no hay errores en ningún paso.

- [ ] **Step 4: Revertir el harness**

```bash
rm src/pages/__preview.jsx
git checkout -- src/App.jsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ExercisePicker.jsx src/index.css
git commit -m "Agrega ExercisePicker: buscador para reemplazar el select de cambiar ejercicio"
```

---

## Task 8: Componente `ExerciseDetailSheet`

**Files:**
- Create: `src/components/ExerciseDetailSheet.jsx`
- Modify: `src/index.css` (agregar después de `.cue-list li { ... }`)

**Interfaces:**
- Consumes: `ExerciseDemo` (Task 6), `BodyDiagram` con `primaryDetail`/`secondaryDetails` (Task 4), `MUSCLE_LABEL`/`MUSCLE_DETAIL_LABEL` de `src/data/exercises.js`.
- Produces: `ExerciseDetailSheet({ exercise, gender, onClose })`. Consumido por Task 10 desde 3 puntos: lista del día, sesión activa, botón "i" del picker.

- [ ] **Step 1: Crear el componente**

```jsx
import ExerciseDemo from './ExerciseDemo'
import BodyDiagram from './BodyDiagram'
import { MUSCLE_DETAIL_LABEL, MUSCLE_LABEL } from '../data/exercises'

export default function ExerciseDetailSheet({ exercise, gender, onClose }) {
  if (!exercise) return null

  const tags = [
    MUSCLE_DETAIL_LABEL[exercise.muscleDetail] ?? MUSCLE_LABEL[exercise.muscle],
    ...(exercise.secondaryMuscles ?? []).map((d) => MUSCLE_DETAIL_LABEL[d]).filter(Boolean),
  ].filter(Boolean)
  const equipmentLabel = exercise.equipment.length === 0 ? 'Peso corporal' : exercise.equipment.join(', ')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="panel-title" style={{ marginBottom: 0 }}>
            {exercise.name}
          </span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <ExerciseDemo exercise={exercise} />
        <BodyDiagram gender={gender} activeMuscles={[exercise.muscle]} primaryDetail={exercise.muscleDetail} secondaryDetails={exercise.secondaryMuscles} />
        <div className="detail-tags">
          {tags.map((t) => (
            <span className="detail-tag" key={t}>
              {t}
            </span>
          ))}
          <span className="detail-tag equip">{equipmentLabel}</span>
        </div>
        {exercise.cues && (
          <ul className="cue-list">
            {exercise.cues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CSS**

En `src/index.css`, después de `.cue-list li { ... }`, agregar:

```css
.detail-sheet {
  max-height: 88vh;
  overflow-y: auto;
}
.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}
.detail-tag {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-dim);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 10px;
  text-transform: capitalize;
}
.detail-tag.equip {
  color: var(--accent-2);
  border-color: var(--accent-2);
}
```

- [ ] **Step 3: Verificación con ruta descartable**

Crear temporalmente `src/pages/__preview.jsx`:

```jsx
import { EXERCISES_BY_ID } from '../data/exercises'
import ExerciseDetailSheet from '../components/ExerciseDetailSheet'

export default function Preview() {
  return (
    <ExerciseDetailSheet
      exercise={EXERCISES_BY_ID['sentadilla-barra']}
      gender="male"
      onClose={() => console.log('closed')}
    />
  )
}
```

Agregar la misma ruta temporal `/__preview` en `App.jsx`.

- Levantar el dev server, navegar a `/__preview`.
- Confirmar con `get_page_text` que aparecen: el nombre del ejercicio, las 3 técnicas (cues) de `sentadilla-barra`, y tags de músculo/equipo.
- Confirmar con `read_console_messages` que no hay errores (en particular, que `BodyDiagram` no explota con `primaryDetail="quads"`).
- Confirmar que `sentadilla-barra` tiene `muscleDetail: 'quads'` (ya lo tiene, viene del merge con la librería) y que el diagrama muestra el resalte fino (via `read_page` buscando la clase `bd-region-primary` en el árbol, o revisar visualmente si el pane está visible).

- [ ] **Step 4: Revertir el harness**

```bash
rm src/pages/__preview.jsx
git checkout -- src/App.jsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ExerciseDetailSheet.jsx src/index.css
git commit -m "Agrega ExerciseDetailSheet: detalle de ejercicio con musculo fino resaltado"
```

---

## Task 9: Wiring en `Configuracion.jsx`

**Files:**
- Modify: `src/pages/Configuracion.jsx:377-401` (bloque "Otros implementos")

**Interfaces:**
- Consumes: los 8 campos nuevos de `equipment_config` (Task 1).
- Produces: ningún componente/función nuevo — solo UI. `config.wall`/`config.towel`/etc. quedan disponibles para `routineGenerator` (ya lo están desde Task 1).

- [ ] **Step 1: Agregar los chips nuevos**

En `src/pages/Configuracion.jsx`, dentro del `chip-grid` de "Otros implementos" (líneas 380-401), reemplazar el bloque completo:

```jsx
      <div className="chip-grid">
        <button type="button" className={`chip ${config.bench ? 'selected' : ''}`} onClick={() => toggle('bench')}>
          <span className="dot" />
          Banco
        </button>
        <button type="button" className={`chip ${config.pullup_bar ? 'selected' : ''}`} onClick={() => toggle('pullup_bar')}>
          <span className="dot" />
          Barra dominadas
        </button>
        <button type="button" className={`chip ${config.bands ? 'selected' : ''}`} onClick={() => toggle('bands')}>
          <span className="dot" />
          Bandas elásticas
        </button>
        <button type="button" className={`chip ${config.cable ? 'selected' : ''}`} onClick={() => toggle('cable')}>
          <span className="dot" />
          Polea / cable
        </button>
        <button type="button" className="chip selected locked" disabled>
          <span className="dot" />
          Peso corporal
        </button>
      </div>
```

por:

```jsx
      <div className="chip-grid">
        <button type="button" className={`chip ${config.bench ? 'selected' : ''}`} onClick={() => toggle('bench')}>
          <span className="dot" />
          Banco
        </button>
        <button type="button" className={`chip ${config.pullup_bar ? 'selected' : ''}`} onClick={() => toggle('pullup_bar')}>
          <span className="dot" />
          Barra dominadas
        </button>
        <button type="button" className={`chip ${config.bands ? 'selected' : ''}`} onClick={() => toggle('bands')}>
          <span className="dot" />
          Bandas elásticas
        </button>
        <button type="button" className={`chip ${config.cable ? 'selected' : ''}`} onClick={() => toggle('cable')}>
          <span className="dot" />
          Polea / cable
        </button>
        <button type="button" className={`chip ${config.wall ? 'selected' : ''}`} onClick={() => toggle('wall')}>
          <span className="dot" />
          Pared
        </button>
        <button type="button" className={`chip ${config.towel ? 'selected' : ''}`} onClick={() => toggle('towel')}>
          <span className="dot" />
          Toalla
        </button>
        <button type="button" className={`chip ${config.doorway ? 'selected' : ''}`} onClick={() => toggle('doorway')}>
          <span className="dot" />
          Marco de puerta
        </button>
        <button type="button" className={`chip ${config.chair ? 'selected' : ''}`} onClick={() => toggle('chair')}>
          <span className="dot" />
          Silla
        </button>
        <button type="button" className={`chip ${config.stability_ball ? 'selected' : ''}`} onClick={() => toggle('stability_ball')}>
          <span className="dot" />
          Pelota de estabilidad
        </button>
        <button type="button" className={`chip ${config.plate ? 'selected' : ''}`} onClick={() => toggle('plate')}>
          <span className="dot" />
          Disco suelto
        </button>
        <button type="button" className={`chip ${config.machine ? 'selected' : ''}`} onClick={() => toggle('machine')}>
          <span className="dot" />
          Máquina de gimnasio
        </button>
        <button type="button" className={`chip ${config.cardio ? 'selected' : ''}`} onClick={() => toggle('cardio')}>
          <span className="dot" />
          Cardio (cinta, bici)
        </button>
        <button type="button" className="chip selected locked" disabled>
          <span className="dot" />
          Peso corporal
        </button>
      </div>
```

- [ ] **Step 2: Verificación con harness de auth simulada**

Este es el primer task que necesita ejercitar una pantalla real detrás del login. Se arma un harness descartable que renderiza `Configuracion` fuera del árbol de auth, con datos fijos en vez de llamadas a Supabase — igual técnica ya usada (y luego borrada) durante el brainstorming de esta spec.

Crear temporalmente `src/pages/__ConfigPreview.jsx`:

```jsx
// TEMPORAL — se borra al final de este task.
import { useState } from 'react'
import { GYM_EQUIPMENT_DEFAULTS } from '../lib/profile'
import { TRAINING_STYLE_LIST } from '../data/trainingStyles'

const FIXTURE_CONFIG = {
  barbell_enabled: false,
  barbell_weight: 20,
  plates: [],
  dumbbells_enabled: false,
  dumbbell_weights: [],
  kettlebell_enabled: false,
  kettlebell_weights: [],
  bench: false,
  pullup_bar: false,
  bands: false,
  cable: false,
  wall: false,
  towel: false,
  doorway: false,
  chair: false,
  stability_ball: false,
  plate: false,
  machine: false,
  cardio: false,
  training_style: 'ppl',
  days_per_week: 3,
}

// Reimplementación mínima de EquipmentSection (Configuracion.jsx) con
// estado local en vez de fetch/save contra Supabase — misma UI real, solo
// se reemplaza el borde de datos.
export default function ConfigPreview() {
  const [config, setConfig] = useState(FIXTURE_CONFIG)
  function toggle(field) {
    setConfig((c) => ({ ...c, [field]: !c[field] }))
  }
  function applyGymDefaults() {
    setConfig((c) => ({ ...c, ...GYM_EQUIPMENT_DEFAULTS }))
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <button type="button" className="btn-link" style={{ marginBottom: 16 }} onClick={applyGymDefaults}>
        Usar equipamiento típico de gimnasio
      </button>
      <div className="field-label" style={{ marginTop: 6 }}>
        Otros implementos
      </div>
      <div className="chip-grid">
        {['bench', 'pullup_bar', 'bands', 'cable', 'wall', 'towel', 'doorway', 'chair', 'stability_ball', 'plate', 'machine', 'cardio'].map((field) => (
          <button type="button" key={field} className={`chip ${config[field] ? 'selected' : ''}`} onClick={() => toggle(field)}>
            <span className="dot" />
            {field}
          </button>
        ))}
      </div>
      <pre style={{ fontSize: 11, color: '#8a97a6' }}>{JSON.stringify(config, null, 2)}</pre>
      <div style={{ display: 'none' }}>{TRAINING_STYLE_LIST.length}</div>
    </div>
  )
}
```

Agregar la ruta temporal `/__preview` en `App.jsx` apuntando a `ConfigPreview` (mismo patrón `if (window.location.pathname === '/__preview') return <ConfigPreview />` antes del `return` normal de `App`).

- Levantar el dev server, navegar a `/__preview`.
- Click en el chip "wall" y confirmar con `get_page_text` que el JSON de abajo ahora tiene `"wall": true`.
- Click en "Usar equipamiento típico de gimnasio" y confirmar que `machine`, `cardio`, `stability_ball`, `plate` pasan a `true` y `wall`/`towel`/`doorway`/`chair` siguen en `false`.
- Confirmar con `read_console_messages` que no hay errores.

Esto verifica la LÓGICA de toggle/defaults (ya cubierta en detalle por Task 1's script Node) más que el layout exacto de `Configuracion.jsx`; el layout real de los chips ya se revisa visualmente al mirar el diff del Step 1 — no hace falta re-verificar el archivo real completo detrás de login para este cambio puramente aditivo y mecánico (mismo patrón exacto que los chips existentes).

- [ ] **Step 3: Revertir el harness**

```bash
rm src/pages/__ConfigPreview.jsx
git checkout -- src/App.jsx
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Configuracion.jsx
git commit -m "Suma chips de equipamiento de casa y gimnasio a Configuracion"
```

---

## Task 10: Wiring en `Entrenar.jsx` + limpieza final

**Files:**
- Modify: `src/pages/Entrenar.jsx` (imports, día-grid, fila de ejercicio, sesión activa)
- Modify: `src/index.css` (agregar clase para el botón de nombre tocable y el ícono de día)

**Interfaces:**
- Consumes: `ExercisePicker` (Task 7), `ExerciseDemo` (Task 6), `ExerciseDetailSheet` (Task 8), `IconDayPush`/`IconDayPull`/`IconDayLegs`/`IconDayArms` (Task 5), `IconSwap` (ya existe en `Icons.jsx`, sin usar hasta ahora).

- [ ] **Step 1: Imports nuevos**

En `src/pages/Entrenar.jsx`, reemplazar el bloque de imports (líneas 1-16):

```jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getNextWorkoutDay } from '../lib/nextWorkoutDay'
import { fetchLastSession, fetchMaxWeightForExercise, logSet } from '../lib/workoutLogs'
import { fetchEquipmentConfig } from '../lib/equipmentConfig'
import { generateRoutine, usableExercisesForMuscles } from '../lib/routineGenerator'
import { addRoutineExercise, removeRoutineExercise, swapExercisePositions, swapRoutineExercise } from '../lib/routines'
import { EXERCISES_BY_ID, MUSCLE_LABEL } from '../data/exercises'
import { TRAINING_STYLE_LIST } from '../data/trainingStyles'
import { getExerciseDemo } from '../data/exerciseDemos'
import { IconCheck, IconChevronLeft, IconClock, IconRemove } from '../components/Icons'
import { feedbackPR, feedbackSetDone, feedbackWorkoutDone } from '../lib/feedback'
import { getGenderPref, setGenderPref } from '../lib/genderPref'
import BodyDiagram from '../components/BodyDiagram'
```

por:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getNextWorkoutDay } from '../lib/nextWorkoutDay'
import { fetchLastSession, fetchMaxWeightForExercise, logSet } from '../lib/workoutLogs'
import { fetchEquipmentConfig } from '../lib/equipmentConfig'
import { generateRoutine, usableExercisesForMuscles } from '../lib/routineGenerator'
import { addRoutineExercise, removeRoutineExercise, swapExercisePositions, swapRoutineExercise } from '../lib/routines'
import { EXERCISES_BY_ID, MUSCLE_LABEL } from '../data/exercises'
import { TRAINING_STYLE_LIST } from '../data/trainingStyles'
import { IconChevronLeft, IconClock, IconDayArms, IconDayLegs, IconDayPull, IconDayPush, IconRemove, IconSwap } from '../components/Icons'
import { feedbackPR, feedbackSetDone, feedbackWorkoutDone } from '../lib/feedback'
import { getGenderPref, setGenderPref } from '../lib/genderPref'
import BodyDiagram from '../components/BodyDiagram'
import ExerciseDemo from '../components/ExerciseDemo'
import ExercisePicker from '../components/ExercisePicker'
import ExerciseDetailSheet from '../components/ExerciseDetailSheet'
```

Nota: `IconCheck` sigue haciendo falta más abajo en la tabla de series — sacarlo de este import rompería esa parte. Mantenerlo: la lista final de nombres importados de `Icons.jsx` es `IconChevronLeft, IconClock, IconDayArms, IconDayLegs, IconDayPull, IconDayPush, IconRemove, IconSwap, IconCheck`. `getExerciseDemo` ya no se usa directo en este archivo (ahora vive dentro de `ExerciseDemo.jsx`) — se elimina ese import.

- [ ] **Step 2: Helper de ícono por tipo de día + estado de picker/detalle**

Justo antes de `function EntrenarSkeleton()`, agregar:

```jsx
function dayIcon(splitType) {
  const muscles = splitType.split(',')
  if (muscles.includes('legs')) return IconDayLegs
  if (muscles.includes('back')) return IconDayPull
  if (muscles.includes('chest') || muscles.includes('shoulders')) return IconDayPush
  return IconDayArms
}
```

Dentro de `export default function Entrenar()`, junto a los demás `useState` de la sección "sesión de selección" (después de `const [error, setError] = useState('')`), agregar:

```jsx
  const [pickerTarget, setPickerTarget] = useState(null) // { day, exercise } | null
  const [detailExercise, setDetailExercise] = useState(null)
```

- [ ] **Step 3: Reemplazar el `<select>` de la lista del día por el trigger del picker**

Dentro de la fase `select`, reemplazar (nota que también se elimina la línea `const options = ...`, que quedaría sin uso — el filtro equivalente se recalcula en el picker mismo, Step 5):

```jsx
                const options = pool.filter((e) => e.id === ex.exercise_id || !used.has(e.id))
                return (
                  <div className="ex-row" key={ex.id}>
                    <span className="arrows">
                      <button type="button" onClick={() => handleMove(selectedDay, ex, -1)} disabled={i === 0} aria-label="Mover arriba">
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(selectedDay, ex, 1)}
                        disabled={i === sortedExercises.length - 1}
                        aria-label="Mover abajo"
                      >
                        ↓
                      </button>
                    </span>
                    <span className="info">
                      <select value={ex.exercise_id} onChange={(e) => handleSwap(selectedDay, ex, e.target.value)}>
                        {options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
```

por:

```jsx
                return (
                  <div className="ex-row" key={ex.id}>
                    <span className="arrows">
                      <button type="button" onClick={() => handleMove(selectedDay, ex, -1)} disabled={i === 0} aria-label="Mover arriba">
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(selectedDay, ex, 1)}
                        disabled={i === sortedExercises.length - 1}
                        aria-label="Mover abajo"
                      >
                        ↓
                      </button>
                    </span>
                    <span className="info">
                      <button type="button" className="ex-name-btn" onClick={() => setDetailExercise(EXERCISES_BY_ID[ex.exercise_id])}>
                        {EXERCISES_BY_ID[ex.exercise_id]?.name ?? ex.exercise_id}
                      </button>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
                    <button type="button" className="icon-btn" onClick={() => setPickerTarget({ day: selectedDay, exercise: ex })} aria-label="Cambiar ejercicio">
                      <IconSwap style={{ width: 16, height: 16 }} />
                    </button>
```

El resto del bloque (`<button className="icon-btn" onClick={() => handleRemove(...)}><IconRemove .../></button></div>)` que cierra el `.map`) no cambia — se deja tal cual está hoy, justo después de este fragmento.

- [ ] **Step 4: Detalle también tocable en el modo "probar hoy" (sesión efímera, sin editar)**

En el mismo archivo, más abajo, dentro del bloque `: sortedExercises.map((ex) => { const meta = EXERCISES_BY_ID[ex.exercise_id]; ...})` (rama `else` del ternario `isPersistedStyle ? ... : ...`), reemplazar:

```jsx
                    <span className="info">
                      <div className="n">{meta?.name ?? ex.exercise_id}</div>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
```

por:

```jsx
                    <span className="info">
                      <button type="button" className="ex-name-btn" onClick={() => setDetailExercise(meta)}>
                        {meta?.name ?? ex.exercise_id}
                      </button>
                      <div className="s">
                        {ex.sets} × {ex.reps_min}-{ex.reps_max}
                      </div>
                    </span>
```

- [ ] **Step 5: Renderizar el picker y el detalle, e ícono en los tiles de día**

Reemplazar el `<div className="day-grid">...</div>` completo:

```jsx
        <div className="day-grid">
          {daysForStyle.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className={`day-tile enter ${selectedDay.id === d.id ? 'selected' : ''}`}
              style={{ '--d': `${i * 50}ms` }}
              onClick={() => setSelectedDayId(d.id)}
            >
              {isPersistedStyle && d.id === recommendedDayId && <span className="badge-rec">Recomendado</span>}
              <span className={`tone-dot ${TONE_CLASSES[i % 3]}`} />
              <div className="name">{d.label}</div>
              <div className="count">{d.exercises.length} ejercicios</div>
            </button>
          ))}
        </div>
```

por:

```jsx
        <div className="day-grid">
          {daysForStyle.map((d, i) => {
            const DayIcon = dayIcon(d.split_type)
            return (
              <button
                key={d.id}
                type="button"
                className={`day-tile enter ${selectedDay.id === d.id ? 'selected' : ''}`}
                style={{ '--d': `${i * 50}ms` }}
                onClick={() => setSelectedDayId(d.id)}
              >
                {isPersistedStyle && d.id === recommendedDayId && <span className="badge-rec">Recomendado</span>}
                <DayIcon className="day-tile-icon" />
                <div className="name">{d.label}</div>
                <div className="count">{d.exercises.length} ejercicios</div>
              </button>
            )
          })}
        </div>
```

(`tone-dot`/`TONE_CLASSES` se reemplaza por el ícono real de tipo de día — ya no hace falta el punto de color genérico. `TONE_CLASSES` queda declarado arriba del componente sin uso; borrar esa línea (`const TONE_CLASSES = ['a', 'b', 'c']`) para que el lint no marque una constante muerta.)

Justo antes del `return (` final de la fase `select` (el `return` que envuelve el `<div>` con `screen-eyebrow`), no hace falta tocar nada — el picker/detalle se agregan como hermanos dentro de ese mismo `<div>` raíz. Buscar el cierre `</div>` que termina la fase `select` (el que sigue inmediatamente después del `</div>` de `.day-detail-card`) y, justo antes de ese `</div>` de cierre, agregar:

```jsx
        {pickerTarget && (
          <ExercisePicker
            pool={pool.filter((e) => e.id === pickerTarget.exercise.exercise_id || !used.has(e.id))}
            currentExerciseId={pickerTarget.exercise.exercise_id}
            onSelect={(newId) => {
              handleSwap(pickerTarget.day, pickerTarget.exercise, newId)
              setPickerTarget(null)
            }}
            onPreview={(e) => setDetailExercise(e)}
            onClose={() => setPickerTarget(null)}
          />
        )}
        {detailExercise && <ExerciseDetailSheet exercise={detailExercise} gender={gender} onClose={() => setDetailExercise(null)} />}
```

- [ ] **Step 6: Reemplazar el demo de 2 fotos en la sesión activa por `ExerciseDemo`, y el nombre por un botón tocable**

Reemplazar:

```jsx
      <div className="ex-current enter" key={currentExercise.id}>
        <div className="n">{exerciseMeta?.name ?? currentExercise.exercise_id}</div>
        <div className="target">
          Objetivo · {currentExercise.sets} series × {currentExercise.reps_min}–{currentExercise.reps_max} reps
        </div>
        {exerciseDemo && (
          <div className="demo-wrap">
            <div className="demo-shot">
              <img src={exerciseDemo.start} alt={`${exerciseMeta.name} — posición inicial`} loading="lazy" />
              <span className="demo-label">Inicio</span>
            </div>
            <div className="demo-shot">
              <img src={exerciseDemo.end} alt={`${exerciseMeta.name} — posición final`} loading="lazy" />
              <span className="demo-label">Fin</span>
            </div>
          </div>
        )}
```

por:

```jsx
      <div className="ex-current enter" key={currentExercise.id}>
        <button type="button" className="ex-name-btn n" onClick={() => setDetailExercise(exerciseMeta)}>
          {exerciseMeta?.name ?? currentExercise.exercise_id}
        </button>
        <div className="target">
          Objetivo · {currentExercise.sets} series × {currentExercise.reps_min}–{currentExercise.reps_max} reps
        </div>
        <ExerciseDemo exercise={exerciseMeta} />
```

Y borrar la línea (ya no se usa, `ExerciseDemo` calcula esto internamente): `const exerciseDemo = getExerciseDemo(currentExercise.exercise_id)`.

Al final de la fase "activa" (justo antes del `</div>` que cierra el `return` de esa fase, después del `<button className="btn-primary" ...>`), agregar el mismo detalle (para que también sea consumible desde acá si `detailExercise` está seteado — ya se comparte el mismo estado del componente):

```jsx
      {detailExercise && <ExerciseDetailSheet exercise={detailExercise} gender={gender} onClose={() => setDetailExercise(null)} />}
```

- [ ] **Step 7: CSS del botón de nombre tocable y del ícono de día**

En `src/index.css`, buscar `.ex-row .info .n` y agregar justo después:

```css
.ex-name-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--text);
  text-align: left;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s ease;
}
.ex-name-btn:active {
  text-decoration-color: var(--text-faint);
}
```

Buscar `.day-tile .count` y agregar justo después:

```css
.day-tile-icon {
  width: 18px;
  height: 18px;
  color: var(--text-dim);
}
.day-tile.selected .day-tile-icon {
  color: var(--accent);
}
```

- [ ] **Step 8: Build y lint**

Run: `npm run build`
Expected: build exitoso.

Run: `npm run lint`
Expected: solo los 2 warnings preexistentes de `AuthContext.jsx`/`ProfileContext.jsx` (`react(only-export-components)`), ningún error nuevo, ninguna variable sin usar (`TONE_CLASSES`, `getExerciseDemo`, `IconCheck` importado y usado — revisar que efectivamente se sigue usando en la tabla de series, si no, sacarlo).

- [ ] **Step 9: Verificación end-to-end con harness de auth simulada**

Crear temporalmente `src/pages/__EntrenarPreview.jsx` — copia estructural de `Entrenar.jsx` real (mismo JSX, mismos imports de componentes nuevos) pero con el fetching a Supabase reemplazado por fixtures fijas y los handlers de red por no-ops locales. Usar exactamente el mismo patrón (fixtures de `routineData`/`config`, mocks de `fetchLastSession`/`fetchMaxWeightForExercise`/`logSet`/`addRoutineExercise`/etc.) que ya se escribió y verificó funcionando durante el brainstorming de esta spec — mismas 4 días fixture (Push A/Pull A/Legs A/Push B), mismo `FIXTURE_CONFIG` con `barbell_enabled`/`dumbbells_enabled`/`bench`/`pullup_bar` en `true`. La diferencia con esa versión anterior: como acá `Entrenar.jsx` YA tiene el picker/demo/detalle integrados de verdad, no hace falta reimplementar esas partes en la copia — el JSX de la copia debe reflejar el `Entrenar.jsx` real tal como quedó después del Step 1-7 (imports, `dayIcon`, estado `pickerTarget`/`detailExercise`, y los 3 bloques JSX modificados), no la versión vieja con `<select>`.

Agregar la ruta temporal `/__preview` en `App.jsx` apuntando a este componente, dentro de un `app-shell`/`app-main` mínimo (sin `AuthProvider`), igual que se hizo antes.

- Levantar el dev server, navegar a `/__preview`.
- Confirmar que los tiles de día ahora muestran un ícono (no el punto de color viejo).
- Click en el ícono de swap (`IconSwap`) de una fila → confirmar que abre `ExercisePicker` con un buscador, no un `<select>`.
- Escribir texto en el buscador → confirmar que la lista se filtra.
- Click en una fila → confirmar que el ejercicio de esa posición cambió (comparar `get_page_text` antes/después).
- Click en el nombre de un ejercicio (fuera del picker) → confirmar que abre `ExerciseDetailSheet` con demo + diagrama + técnica.
- Iniciar la sesión ("Empezar entrenamiento") → confirmar que el ejercicio activo muestra `ExerciseDemo` (frames animados o fallback JPG según el ejercicio) en vez de las 2 fotos fijas, y que el nombre sigue siendo tocable para abrir el detalle.
- Confirmar con `read_console_messages` que no hay errores en ningún paso.

- [ ] **Step 10: Revertir el harness y limpiar**

```bash
rm src/pages/__EntrenarPreview.jsx
git checkout -- src/App.jsx
git status --short
```

Confirmar que `git status` no muestra ningún archivo `__preview`/`__EntrenarPreview`/`__ConfigPreview` pendiente — si quedó alguno de un task anterior por error, borrarlo ahora.

- [ ] **Step 11: Commit final**

```bash
git add src/pages/Entrenar.jsx src/index.css
git commit -m "Integra picker de ejercicios, demo animada, detalle e iconos de dia en Entrenar"
```

---

## Self-Review

**Cobertura de la spec:** objetivo 1 (picker) → Tasks 7, 10. Objetivo 2 (filtro exerciseType/isStretch) → Task 2. Objetivo 3 (frames animados + fallback) → Task 6, 10. Objetivo 4 (detalle con músculo fino) → Tasks 3, 4, 8, 10. Objetivo 5 (equipamiento casa+gimnasio) → Tasks 1, 9. Objetivo 6 (ícono de día) → Tasks 5, 10. No objetivos (explorador standalone, APK, test runner, rediseño de series/descanso) — ninguna task los toca, correcto.

**Escaneo de placeholders:** sin TBD/TODO. Los únicos "ver Task N" son para reusar un patrón de harness ya dado en extenso una vez (Task 4/9), nunca para código real que se necesite escribir — el código de cada componente/edit está completo en su propia task.

**Consistencia de tipos/nombres:** `ExerciseDemo({ exercise })`, `ExercisePicker({ pool, currentExerciseId, onSelect, onPreview, onClose })`, `ExerciseDetailSheet({ exercise, gender, onClose })`, `BodyDiagram({ gender, activeMuscles, primaryDetail, secondaryDetails })` — mismos nombres de prop en la definición (Tasks 4, 6, 7, 8) y en cada uso (Tasks 8, 10). `getExerciseFrames(demoSlug)` (ya existente) se usa igual en Tasks 6 y 7. Campos de `equipment_config` (`wall`, `towel`, `doorway`, `chair`, `stability_ball`, `plate`, `machine`, `cardio`) idénticos entre la migración (Task 1), `DEFAULT_CONFIG`/`GYM_EQUIPMENT_DEFAULTS` (Task 1), `availableEquipmentTags` (Task 1) y los chips de `Configuracion.jsx` (Task 9). El campo `detail` de los polígonos (Task 3) es consumido con ese mismo nombre en `BodyDiagram.jsx` (Task 4).
