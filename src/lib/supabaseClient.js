import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail loudly during development rather than silently not working.
  console.error('Missing Supabase env vars. Copy .env.example to .env and fill it in.')
}

export const supabase = createClient(url, anonKey)
