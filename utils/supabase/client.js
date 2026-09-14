import { createBrowserClient } from '@supabase/ssr'

const LIVE_FALLBACK_URL = 'https://ejuvdeynjekapghkacbr.supabase.co'
const LIVE_FALLBACK_KEY = 'sb_publishable_H0gZYGXnpidmlAN9CnpR9g_0dqF8vGt'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const SUPABASE_URL = (!rawUrl || rawUrl.includes('vufvxwhviwzbegaslaxg') || rawUrl.includes('your-project'))
  ? LIVE_FALLBACK_URL
  : rawUrl

const SUPABASE_ANON_KEY = (!rawKey || rawKey.includes('your_supabase_anon_key') || rawKey.includes('ocBFhS3W-HAty1KIhZCPHA'))
  ? LIVE_FALLBACK_KEY
  : rawKey

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
