import { EXERCISES, SPLIT_LABEL } from '../data/exercises'

const SPLIT_ORDER = ['push', 'pull', 'legs']

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

// Ejercicios de un split que el usuario puede hacer con su equipamiento actual.
// Se usa tanto para generar la rutina como para ofrecer opciones al editarla.
export function usableExercisesForSplit(config, split) {
  const availableTags = availableEquipmentTags(config)
  return EXERCISES.filter((e) => e.split === split && isUsable(e, availableTags))
}

function defaultSetsReps(position) {
  if (position < 2) return { sets: 4, reps_min: 6, reps_max: 10 }
  return { sets: 3, reps_min: 10, reps_max: 15 }
}

// Genera una rutina Push/Pull/Legs de `daysPerWeek` días usando solo
// ejercicios compatibles con el equipamiento disponible. Cuando un split se
// repite en la semana (Push A, Push B...) rota la selección para no repetir
// siempre los mismos ejercicios.
export function generateRoutine(config, daysPerWeek) {
  const availableTags = availableEquipmentTags(config)
  const bySplit = {
    push: EXERCISES.filter((e) => e.split === 'push' && isUsable(e, availableTags)),
    pull: EXERCISES.filter((e) => e.split === 'pull' && isUsable(e, availableTags)),
    legs: EXERCISES.filter((e) => e.split === 'legs' && isUsable(e, availableTags)),
  }

  const pointers = { push: 0, pull: 0, legs: 0 }
  const occurrences = { push: 0, pull: 0, legs: 0 }
  const exercisesPerDay = 5

  const days = []
  for (let i = 0; i < daysPerWeek; i++) {
    const split = SPLIT_ORDER[i % 3]
    const pool = bySplit[split]
    occurrences[split] += 1
    const letter = String.fromCharCode(64 + occurrences[split]) // A, B, C...

    let picked = []
    if (pool.length > 0) {
      const start = pointers[split] % pool.length
      for (let n = 0; n < Math.min(exercisesPerDay, pool.length); n++) {
        picked.push(pool[(start + n) % pool.length])
      }
      pointers[split] = start + exercisesPerDay
    }

    days.push({
      dayOrder: i,
      label: `${SPLIT_LABEL[split]} ${letter}`,
      splitType: split,
      exercises: picked.map((ex, position) => ({
        exerciseId: ex.id,
        position,
        ...defaultSetsReps(position),
      })),
    })
  }

  return {
    name: 'Push Pull Legs',
    daysPerWeek,
    days,
  }
}
