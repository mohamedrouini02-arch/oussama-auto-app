import { createClient } from '@supabase/supabase-js'

/**
 * Untyped Supabase client for CMS (website_cars, website_content, website_media).
 * Uses @supabase/supabase-js directly to avoid type inference issues
 * with @supabase/ssr's createBrowserClient<Database> generic.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const cmsClient = createClient(supabaseUrl, supabaseAnonKey)
