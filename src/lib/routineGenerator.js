import { EXERCISES } from '../data/exercises'
import { TRAINING_STYLES } from '../data/trainingStyles'

// Traduce la config de equipamiento del usuario a un set de tags disponibles.
export function availableEquipmentTags(config) {
  const tags = new Set()
  if (config.barbell_enabled) tags.add('barbell')
  if (config.dumbbells_enabled) tags.add('dumbbells')
  if (config.kettlebell_enabled) tags.add('kettlebell')
  if (config.bench) tags.add('bench')
  if (config.pullup_bar) tags.add('pullup_bar')
  if (config.bands) tags.add('bands')
  if (config.cable) tags.add('cable')
  return tags
}

function isUsable(exercise, availableTags) {
  return exercise.equipment.every((tag) => availableTags.has(tag))
}

// Para el modo Calistenia: saca del set de equipamiento disponible todo lo
// que sea peso externo (barra, mancuernas, kettlebell, polea), dejando solo
// peso corporal + barra de dominadas + banco, que sí son "calistenia".
const WEIGHTED_TAGS = ['barbell', 'dumbbells', 'kettlebell', 'cable']

export function restrictToBodyweight(tags) {
  const restricted = new Set(tags)
  WEIGHTED_TAGS.forEach((t) => restricted.delete(t))
  return restricted
}

// Ejercicios de un grupo muscular que el usuario puede hacer con su
// equipamiento actual. Se usa para generar la rutina y para ofrecer
// opciones al editarla (swap / agregar ejercicio).
export function usableExercisesForMuscle(config, muscle) {
  const availableTags = availableEquipmentTags(config)
  return EXERCISES.filter((e) => e.muscle === muscle && isUsable(e, availableTags))
}

export function usableExercisesForMuscles(config, muscles) {
  const availableTags = availableEquipmentTags(config)
  const set = new Set(muscles)
  return EXERCISES.filter((e) => set.has(e.muscle) && isUsable(e, availableTags))
}

function defaultSetsReps(position) {
  if (position < 2) return { sets: 4, reps_min: 6, reps_max: 10 }
  return { sets: 3, reps_min: 10, reps_max: 15 }
}

// Reparte `count` ejercicios entre los grupos musculares de un día, rotando
// en ronda (round-robin) para no cargar todo a un solo músculo: un día de
// "Pecho y hombro" con 5 ejercicios sale ~3 pecho + 2 hombro, no 5 pechos.
// `pointers` se muta entre llamadas para que un día que se repite en la
// semana (ej. "Push B") no elija siempre los mismos ejercicios.
function pickRoundRobin(muscles, count, availableTags, pointers) {
  const pools = {}
  for (const m of muscles) {
    pools[m] = EXERCISES.filter((e) => e.muscle === m && isUsable(e, availableTags))
  }

  const picked = []
  const pickedIds = new Set()
  let guard = 0
  while (picked.length < count && guard < count * muscles.length + muscles.length) {
    guard++
    let addedAny = false
    for (const m of muscles) {
      if (picked.length >= count) break
      const pool = pools[m]
      if (pool.length === 0) continue
      const idx = (pointers[m] ?? 0) % pool.length
      pointers[m] = idx + 1
      const candidate = pool[idx]
      if (!pickedIds.has(candidate.id)) {
        picked.push(candidate)
        pickedIds.add(candidate.id)
        addedAny = true
      }
    }
    if (!addedAny) break
  }
  return picked
}

// Genera una rutina de `daysPerWeek` días según el estilo elegido (Push/Pull/
// Legs, Torso/Pierna, Full Body o por grupo muscular), usando solo
// ejercicios compatibles con el equipamiento disponible.
export function generateRoutine(config, daysPerWeek, styleId = 'ppl') {
  const style = TRAINING_STYLES[styleId] ?? TRAINING_STYLES.ppl
  const availableTags = style.bodyweightOnly ? restrictToBodyweight(availableEquipmentTags(config)) : availableEquipmentTags(config)
  const exercisesPerDay = 5

  const pointers = {} // { [muscle]: cursor } compartido entre días para variedad
  const occurrences = {} // { [type]: cantidad de veces que apareció hasta ahora }

  // Cuántas veces aparece cada tipo de día en total en la semana, para
  // saber si hace falta desambiguar con "A"/"B" (solo si ese tipo se repite).
  const totalByType = {}
  for (let i = 0; i < daysPerWeek; i++) {
    const t = style.days[i % style.days.length].type
    totalByType[t] = (totalByType[t] ?? 0) + 1
  }

  const days = []
  for (let i = 0; i < daysPerWeek; i++) {
    const blueprint = style.days[i % style.days.length]
    occurrences[blueprint.type] = (occurrences[blueprint.type] ?? 0) + 1
    const letter = String.fromCharCode(64 + occurrences[blueprint.type]) // A, B, C...
    const needsLetter = totalByType[blueprint.type] > 1

    const picked = pickRoundRobin(blueprint.muscles, exercisesPerDay, availableTags, pointers)

    days.push({
      dayOrder: i,
      label: needsLetter ? `${blueprint.label} ${letter}` : blueprint.label,
      splitType: blueprint.muscles.join(','),
      exercises: picked.map((ex, position) => ({
        exerciseId: ex.id,
        position,
        ...defaultSetsReps(position),
      })),
    })
  }

  return {
    name: style.label,
    daysPerWeek,
    days,
  }
}
