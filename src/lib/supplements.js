import { supabase } from './supabaseClient'

export const SUPPLEMENT_OPTIONS = ['Creatina', 'Proteína', 'Multivitamínico', 'Omega 3', 'Pre-entreno', 'Colágeno']

function today() {
  return new Date().toISOString().slice(0, 10)
}

// Suplementos ya marcados como tomados hoy.
export async function fetchTodayIntake(userId) {
  const { data, error } = await supabase
    .from('supplement_logs')
    .select('supplement')
    .eq('user_id', userId)
    .eq('log_date', today())
  if (error) throw error
  return new Set(data.map((r) => r.supplement))
}

export async function setSupplementTaken(userId, supplement, taken) {
  if (taken) {
    const { error } = await supabase
      .from('supplement_logs')
      .upsert({ user_id: userId, log_date: today(), supplement }, { onConflict: 'user_id,log_date,supplement' })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('supplement_logs')
      .delete()
      .eq('user_id', userId)
      .eq('log_date', today())
      .eq('supplement', supplement)
    if (error) throw error
  }
}
