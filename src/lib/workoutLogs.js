import { supabase } from './supabaseClient'

export async function logSet(userId, { routineDayId, exerciseId, setNumber, weightKg, reps }) {
  const { error } = await supabase.from('workout_logs').insert({
    user_id: userId,
    routine_day_id: routineDayId,
    exercise_id: exerciseId,
    set_number: setNumber,
    weight_kg: weightKg,
    reps,
  })
  if (error) throw error
}

// Últimas series registradas para un ejercicio (para sugerir con qué peso arrancar hoy).
export async function fetchLastSession(userId, exerciseId) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('performed_at', { ascending: false })
    .limit(1)
  if (error) throw error
  if (!data || data.length === 0) return null
  const lastDate = data[0].performed_at.slice(0, 10)

  const { data: sameDay, error: sameDayError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .gte('performed_at', `${lastDate}T00:00:00`)
    .lte('performed_at', `${lastDate}T23:59:59`)
    .order('set_number', { ascending: true })
  if (sameDayError) throw sameDayError
  return sameDay
}

// Día de rutina del último set registrado — se usa para saber qué día
// de la rotación Push/Pull/Legs toca hoy.
export async function fetchLastLoggedDayId(userId) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('routine_day_id')
    .eq('user_id', userId)
    .not('routine_day_id', 'is', null)
    .order('performed_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.routine_day_id ?? null
}

// Racha: cuántos días entrenados seguidos, tolerando como máximo 1 día de
// descanso entre sesiones. Dos o más días sin entrenar la cortan.
export async function fetchTrainingStreak(userId) {
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase.from('workout_logs').select('performed_at').eq('user_id', userId).gte('performed_at', since)
  if (error) throw error

  const days = Array.from(new Set(data.map((r) => r.performed_at.slice(0, 10)))).sort().reverse()
  if (days.length === 0) return 0

  const msDay = 86400000
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let cursor = today
  for (const d of days) {
    const date = new Date(`${d}T00:00:00`)
    const diff = Math.round((cursor - date) / msDay)
    if (streak === 0) {
      if (diff > 2) break
      streak = 1
      cursor = date
    } else if (diff <= 2) {
      streak++
      cursor = date
    } else {
      break
    }
  }
  return streak
}

// Días distintos entrenados en la semana calendario actual (lunes a domingo).
export async function fetchWeekTrainingDays(userId) {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0 = lunes
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - dow)

  const { data, error } = await supabase
    .from('workout_logs')
    .select('performed_at')
    .eq('user_id', userId)
    .gte('performed_at', monday.toISOString())
  if (error) throw error
  return new Set(data.map((r) => r.performed_at.slice(0, 10)))
}

// Entrenamientos (días distintos) de la semana calendario actual.
export async function fetchWeekTrainingCount(userId) {
  const days = await fetchWeekTrainingDays(userId)
  return days.size
}

// Mejor peso histórico registrado para un ejercicio (null si nunca lo hizo).
export async function fetchMaxWeightForExercise(userId, exerciseId) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('weight_kg')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .not('weight_kg', 'is', null)
    .order('weight_kg', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.weight_kg ?? null
}

// Cantidad de días distintos con al menos una serie registrada en los últimos `sinceDays`.
export async function fetchTrainingDayCount(userId, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('workout_logs')
    .select('performed_at')
    .eq('user_id', userId)
    .gte('performed_at', since)
  if (error) throw error
  const days = new Set(data.map((r) => r.performed_at.slice(0, 10)))
  return days.size
}

// Resumen del último día entrenado: fecha, cuántos ejercicios y series hizo.
export async function fetchLastSessionSummary(userId) {
  const { data: latest, error: latestError } = await supabase
    .from('workout_logs')
    .select('performed_at, routine_day_id')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(1)
  if (latestError) throw latestError
  if (!latest || latest.length === 0) return null

  const date = latest[0].performed_at.slice(0, 10)
  const { data, error } = await supabase
    .from('workout_logs')
    .select('exercise_id, routine_day_id')
    .eq('user_id', userId)
    .gte('performed_at', `${date}T00:00:00`)
    .lte('performed_at', `${date}T23:59:59`)
  if (error) throw error

  return {
    date,
    routineDayId: latest[0].routine_day_id,
    exerciseCount: new Set(data.map((r) => r.exercise_id)).size,
    setCount: data.length,
  }
}

// Récord personal (mayor peso levantado) por ejercicio, top N.
export async function fetchPersonalRecords(userId, limit = 3) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('exercise_id, weight_kg, reps, performed_at')
    .eq('user_id', userId)
    .not('weight_kg', 'is', null)
    .order('weight_kg', { ascending: false })
    .limit(300)
  if (error) throw error

  const bestByExercise = new Map()
  for (const row of data) {
    if (!bestByExercise.has(row.exercise_id)) {
      bestByExercise.set(row.exercise_id, row)
    }
  }
  return Array.from(bestByExercise.values())
    .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
    .slice(0, limit)
}
