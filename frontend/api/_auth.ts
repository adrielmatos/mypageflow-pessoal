import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getBearer(req: VercelRequest) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export async function requireUser(req: VercelRequest) {
  const token = getBearer(req);
  if (!token) throw new Error('Não autenticado. Faça login novamente.');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY ausentes no servidor.');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) throw new Error('Sessão inválida ou expirada.');
  return data.user;
}
