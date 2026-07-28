import { supabase } from './supabaseClient'

// Días con entrenamiento y días con suplementos tomados en un mes dado.
// month es 0-11 (como Date de JS).
export async function fetchMonthActivity(userId, year, month) {
  const start = new Date(year, month, 1).toISOString().slice(0, 10)
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const [{ data: logs, error: logsError }, { data: supp, error: suppError }] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('performed_at')
      .eq('user_id', userId)
      .gte('performed_at', `${start}T00:00:00`)
      .lte('performed_at', `${end}T23:59:59`),
    supabase.from('supplement_logs').select('log_date').eq('user_id', userId).gte('log_date', start).lte('log_date', end),
  ])
  if (logsError) throw logsError
  if (suppError) throw suppError

  return {
    trained: new Set(logs.map((r) => r.performed_at.slice(0, 10))),
    supplements: new Set(supp.map((r) => r.log_date)),
  }
}
