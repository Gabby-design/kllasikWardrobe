import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejuvdeynjekapghkacbr.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_H0gZYGXnpidmlAN9CnpR9g_0dqF8vGt'

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('vufvxwhviwzbegaslaxg') &&
  !SUPABASE_URL.includes('your-project')
)

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
