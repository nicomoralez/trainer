import { supabase } from './supabaseClient'

export const DEFAULT_CONFIG = {
  barbell_enabled: false,
  barbell_weight: 20,
  plates: [],
  dumbbells_enabled: false,
  dumbbell_weights: [],
  kettlebell_enabled: false,
  kettlebell_weights: [],
  bench: false,
  pullup_bar: false,
  bands: false,
  cable: false,
  days_per_week: 3,
  training_style: 'ppl',
}

export async function fetchEquipmentConfig(userId) {
  const { data, error } = await supabase
    .from('equipment_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return { ...DEFAULT_CONFIG }
  return data
}

export async function saveEquipmentConfig(userId, config) {
  const { error } = await supabase.from('equipment_config').upsert({
    user_id: userId,
    ...config,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
