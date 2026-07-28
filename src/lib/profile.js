import { supabase } from './supabaseClient'

export const GOAL_LABEL = {
  perder_grasa: 'Bajar de peso',
  ganar_musculo: 'Ganar músculo',
  mantenerse: 'Mantenerme',
  resistencia: 'Mejorar resistencia',
}

// Equipamiento típico de un gimnasio comercial — se usa cuando el usuario
// dice que entrena en gimnasio, así no tiene que cargar cada disco a mano.
export const GYM_EQUIPMENT_DEFAULTS = {
  barbell_enabled: true,
  barbell_weight: 20,
  plates: [
    { weight: 20, qty: 2 },
    { weight: 15, qty: 2 },
    { weight: 10, qty: 2 },
    { weight: 5, qty: 2 },
    { weight: 2.5, qty: 2 },
  ],
  dumbbells_enabled: true,
  dumbbell_weights: [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 30],
  kettlebell_enabled: true,
  kettlebell_weights: [8, 12, 16, 20, 24],
  bench: true,
  pullup_bar: true,
  bands: true,
  cable: true,
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(userId, fields) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() })
  if (error) throw error
}
