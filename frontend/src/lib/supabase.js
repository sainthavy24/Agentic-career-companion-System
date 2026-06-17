import { createClient } from '@supabase/supabase-js'

function clean(u) {
  u = (u || '').trim().replace(/\/+$/, '')
  if (u.endsWith('/rest/v1')) u = u.slice(0, -'/rest/v1'.length)
  return u
}
const url = clean(import.meta.env.VITE_SUPABASE_URL)
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const supabase = (url && key) ? createClient(url, key) : null
