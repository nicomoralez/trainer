import { fetchActiveRoutine } from './routines'
import { fetchLastLoggedDayId } from './workoutLogs'

// Qué día de la rotación Push/Pull/Legs toca ahora: el siguiente al último
// que tiene series registradas. Si nunca entrenó, arranca en el día 0.
// Lo comparten Inicio y Entrenar para no calcular esto dos veces distinto.
export async function getNextWorkoutDay(userId) {
  const [routineData, lastDayId] = await Promise.all([fetchActiveRoutine(userId), fetchLastLoggedDayId(userId)])
  if (!routineData) return { routineData: null, day: null, dayIndex: -1 }

  const idx = routineData.days.findIndex((d) => d.id === lastDayId)
  const dayIndex = idx === -1 ? 0 : (idx + 1) % routineData.days.length
  return { routineData, day: routineData.days[dayIndex] ?? null, dayIndex }
}
