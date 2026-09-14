import { createClient } from '@supabase/supabase-js'

const LIVE_FALLBACK_URL = 'https://ejuvdeynjekapghkacbr.supabase.co'
const LIVE_FALLBACK_KEY = 'sb_publishable_H0gZYGXnpidmlAN9CnpR9g_0dqF8vGt'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const SUPABASE_URL = (!rawUrl || rawUrl.includes('vufvxwhviwzbegaslaxg') || rawUrl.includes('your-project'))
  ? LIVE_FALLBACK_URL
  : rawUrl

const SUPABASE_KEY = (!rawKey || rawKey.includes('your_supabase_anon_key') || rawKey.includes('ocBFhS3W-HAty1KIhZCPHA'))
  ? LIVE_FALLBACK_KEY
  : rawKey

export const createAdminClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}
