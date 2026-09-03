import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req);
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Credenciais Supabase do servidor não configuradas.');
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    if (req.method === 'GET') {
      const { data, error } = await sb.from('social_accounts').select('id,platform,account_id,username,token_expires_at,created_at,updated_at').eq('user_id', user.id).order('created_at');
      if (error) throw error;
      return res.status(200).json({ accounts: data || [] });
    }
    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      if (!id) return res.status(400).json({ error: 'id obrigatório' });
      const { error } = await sb.from('social_accounts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(204).end();
    }
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro';
    return res.status(msg.includes('autentic') || msg.includes('Sessão') ? 401 : 500).json({ error: msg });
  }
}
