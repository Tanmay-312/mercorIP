import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // This prevents the "Session Missing" error from crashing the app
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);