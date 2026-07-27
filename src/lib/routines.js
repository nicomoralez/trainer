import { supabase } from './supabaseClient'

// Reemplaza cualquier rutina activa del usuario por la generada.
// Borrar la rutina vieja tira en cascada sus días y ejercicios; los
// workout_logs que apuntaban a esos días quedan con routine_day_id en null
// pero conservan el exercise_id, así que el historial no se pierde.
export async function saveGeneratedRoutine(userId, generated) {
  await supabase.from('routines').delete().eq('user_id', userId)

  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({ user_id: userId, name: generated.name, days_per_week: generated.daysPerWeek })
    .select()
    .single()
  if (routineError) throw routineError

  const dayRows = generated.days.map((d) => ({
    user_id: userId,
    routine_id: routine.id,
    day_order: d.dayOrder,
    label: d.label,
    split_type: d.splitType,
  }))
  const { data: insertedDays, error: daysError } = await supabase
    .from('routine_days')
    .insert(dayRows)
    .select()
  if (daysError) throw daysError

  const dayIdByOrder = Object.fromEntries(insertedDays.map((d) => [d.day_order, d.id]))

  const exerciseRows = generated.days.flatMap((d) =>
    d.exercises.map((ex) => ({
      user_id: userId,
      routine_day_id: dayIdByOrder[d.dayOrder],
      exercise_id: ex.exerciseId,
      position: ex.position,
      sets: ex.sets,
      reps_min: ex.reps_min,
      reps_max: ex.reps_max,
    })),
  )
  if (exerciseRows.length > 0) {
    const { error: exError } = await supabase.from('routine_exercises').insert(exerciseRows)
    if (exError) throw exError
  }

  return routine.id
}

export async function fetchActiveRoutine(userId) {
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (routineError) throw routineError
  if (!routine) return null

  const { data: days, error: daysError } = await supabase
    .from('routine_days')
    .select('*')
    .eq('routine_id', routine.id)
    .order('day_order', { ascending: true })
  if (daysError) throw daysError

  const dayIds = days.map((d) => d.id)
  let exercises = []
  if (dayIds.length > 0) {
    const { data, error } = await supabase
      .from('routine_exercises')
      .select('*')
      .in('routine_day_id', dayIds)
      .order('position', { ascending: true })
    if (error) throw error
    exercises = data
  }

  const daysWithExercises = days.map((d) => ({
    ...d,
    exercises: exercises.filter((e) => e.routine_day_id === d.id),
  }))

  return { routine, days: daysWithExercises }
}

export async function removeRoutineExercise(id) {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id)
  if (error) throw error
}

export async function swapRoutineExercise(id, newExerciseId) {
  const { error } = await supabase.from('routine_exercises').update({ exercise_id: newExerciseId }).eq('id', id)
  if (error) throw error
}

export async function addRoutineExercise(userId, dayId, exerciseId, position) {
  const { error } = await supabase.from('routine_exercises').insert({
    user_id: userId,
    routine_day_id: dayId,
    exercise_id: exerciseId,
    position,
    sets: 3,
    reps_min: 8,
    reps_max: 12,
  })
  if (error) throw error
}

// Intercambia la posición de dos ejercicios del mismo día (mover arriba/abajo).
export async function swapExercisePositions(exerciseA, exerciseB) {
  const { error: e1 } = await supabase
    .from('routine_exercises')
    .update({ position: exerciseB.position })
    .eq('id', exerciseA.id)
  if (e1) throw e1
  const { error: e2 } = await supabase
    .from('routine_exercises')
    .update({ position: exerciseA.position })
    .eq('id', exerciseB.id)
  if (e2) throw e2
}
