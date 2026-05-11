// Supabase Client Setup
// Uncomment this file when you're ready to use Supabase


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// For now, export a placeholder to avoid import errors
export const supabase = null;
