import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  (import.meta.env.VITE_SUPABASE_URL as string) || 
  'https://xmzonnmpzmaykvypqmhz.supabase.co';

const SUPABASE_ANON_KEY = 
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 
  'sb_publishable_kRhY9nDjk_yTCmqYfM7veA_KBX6ZyAb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('system_settings').select('id').limit(1);
    // Even if error is table does not exist yet (PGRST116/42P01), connection succeeded
    return !error || error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('relation');
  } catch {
    return false;
  }
};
