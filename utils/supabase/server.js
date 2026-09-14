import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
