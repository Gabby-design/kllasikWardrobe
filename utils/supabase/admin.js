import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejuvdeynjekapghkacbr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_H0gZYGXnpidmlAN9CnpR9g_0dqF8vGt'

export const createAdminClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}
