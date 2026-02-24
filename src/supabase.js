import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Charge le profil depuis Supabase
export async function loadProfile() {
  const { data, error } = await supabase
    .from('lucas_data')
    .select('data')
    .eq('id', 'profile')
    .single()
  if (error || !data) return null
  return data.data
}

// Sauvegarde le profil dans Supabase
export async function saveProfile(profile) {
  const { error } = await supabase
    .from('lucas_data')
    .upsert({ id: 'profile', data: profile, updated_at: new Date().toISOString() })
  if (error) console.error('Erreur save profile:', error)
}

// Charge les insights partagés
export async function loadSharedInsights() {
  const { data, error } = await supabase
    .from('lucas_data')
    .select('data')
    .eq('id', 'shared_insights')
    .single()
  if (error || !data) return []
  return data.data || []
}

// Ajoute un insight partagé
export async function pushSharedInsight(text) {
  const existing = await loadSharedInsights()
  const updated = [...existing, { text, date: new Date().toISOString() }].slice(-20)
  await supabase
    .from('lucas_data')
    .upsert({ id: 'shared_insights', data: updated, updated_at: new Date().toISOString() })
}
