import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
if(!url || !key) console.warn('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY');
export const supabase = createClient(url || 'https://example.supabase.co', key || 'public-anon-key');
