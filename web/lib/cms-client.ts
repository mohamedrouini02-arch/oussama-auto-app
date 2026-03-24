import { createBrowserClient } from '@supabase/ssr'

/**
 * Session-aware Supabase client for CMS (website_cars, website_content, website_media).
 * Uses createBrowserClient so the user's auth session/cookies are included in requests,
 * which satisfies the RLS "auth.role() = 'authenticated'" policies.
 * Queries are cast with `as any` to avoid TypeScript `never` inference on these tables.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cmsClient = createBrowserClient(supabaseUrl, supabaseAnonKey) as any
