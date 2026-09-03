import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { getBearer, getAppUrl } from '../auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = getBearer(req);
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return res.status(500).json({ error: 'Supabase do servidor não configurado.' });
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Sessão inválida.' });
    const clientId = process.env.META_INSTAGRAM_CLIENT_ID || process.env.META_APP_ID;
    const redirect = process.env.META_INSTAGRAM_REDIRECT_URI || `${getAppUrl(req)}/api/auth/instagram/callback`;
    const secret = process.env.OAUTH_STATE_SECRET || process.env.META_APP_SECRET || '';
    if (!clientId || !secret) return res.status(500).json({ error: 'META_APP_ID/META_APP_SECRET e OAUTH_STATE_SECRET precisam estar configurados.' });
    const state = Buffer.from(JSON.stringify({ u: data.user.id, n: crypto.randomBytes(16).toString('hex') })).toString('base64url');
    const scope = process.env.META_INSTAGRAM_SCOPES || 'instagram_business_basic,instagram_business_content_publish';
    const signed = crypto.createHmac('sha256', secret).update(state).digest('hex');
    const fullState = `${state}.${signed}`;
    const auth = new URL('https://www.instagram.com/oauth/authorize');
    auth.searchParams.set('client_id', clientId);
    auth.searchParams.set('redirect_uri', redirect);
    auth.searchParams.set('response_type', 'code');
    auth.searchParams.set('scope', scope);
    auth.searchParams.set('state', fullState);
    return res.status(200).json({ url: auth.toString() });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Erro interno.' });
  }
}
