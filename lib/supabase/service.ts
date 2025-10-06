import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using the Service Role key.
// Do NOT expose this key to the browser. Use only in server actions or API routes.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

