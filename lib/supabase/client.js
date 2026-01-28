import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client for build time
    return {
      auth: {
        signInWithPassword: async () => ({ error: { message: 'Not configured' } }),
        signInWithOAuth: async () => ({ error: { message: 'Not configured' } }),
        signUp: async () => ({ error: { message: 'Not configured' } }),
        signOut: async () => ({}),
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
      }),
    }
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
