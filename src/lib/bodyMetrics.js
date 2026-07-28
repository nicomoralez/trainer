import { supabase } from './supabaseClient'

export async function fetchBodyMetrics(userId, limit = 8) {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.slice().reverse()
}

// Primer y último peso registrado — para la barra de "camino al objetivo"
// (no alcanza con los últimos N registros: el punto de partida puede ser viejo).
export async function fetchFirstAndLatestWeight(userId) {
  const [{ data: firstData, error: firstError }, { data: lastData, error: lastError }] = await Promise.all([
    supabase.from('body_metrics').select('*').eq('user_id', userId).order('recorded_at', { ascending: true }).limit(1),
    supabase.from('body_metrics').select('*').eq('user_id', userId).order('recorded_at', { ascending: false }).limit(1),
  ])
  if (firstError) throw firstError
  if (lastError) throw lastError
  return {
    first: firstData?.[0] ?? null,
    latest: lastData?.[0] ?? null,
  }
}

// Un registro por día: si ya cargaste peso hoy, lo reemplaza en vez de duplicar.
export async function addBodyMetric(userId, weightKg) {
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('body_metrics').delete().eq('user_id', userId).eq('recorded_at', today)
  const { error } = await supabase
    .from('body_metrics')
    .insert({ user_id: userId, recorded_at: today, weight_kg: weightKg })
  if (error) throw error
}
