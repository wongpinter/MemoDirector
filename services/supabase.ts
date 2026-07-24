
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// pony tail: Supabase optional — only create client when both URL and key are provided.
// Callers must null-check supabase before use.
let _client: SupabaseClient | null = null;

export const supabase: SupabaseClient | null = (() => {
  if (supabaseUrl && supabaseAnonKey &&
      !supabaseUrl.includes('your_supabase') &&
      !supabaseAnonKey.includes('your_supabase')) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
    return _client;
  }
  console.warn('⚠️ Supabase not configured — running in offline mode.');
  return null;
})();
