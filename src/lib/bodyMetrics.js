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

// Un registro por día: si ya cargaste peso hoy, lo reemplaza en vez de duplicar.
export async function addBodyMetric(userId, weightKg) {
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('body_metrics').delete().eq('user_id', userId).eq('recorded_at', today)
  const { error } = await supabase
    .from('body_metrics')
    .insert({ user_id: userId, recorded_at: today, weight_kg: weightKg })
  if (error) throw error
}
