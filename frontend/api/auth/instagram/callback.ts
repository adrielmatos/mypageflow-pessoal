import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { getAppUrl } from '../auth-utils';

function verifyState(raw: string) {
  const [state, sig] = raw.split('.');
  if (!state || !sig) throw new Error('Estado OAuth inválido.');
  const secret = process.env.OAUTH_STATE_SECRET || process.env.META_APP_SECRET || '';
  const expected = crypto.createHmac('sha256', secret).update(state).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) throw new Error('Estado OAuth inválido.');
  const payload = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {u:string};
  return payload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const base = getAppUrl(req);
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code || !state) throw new Error('Código ou state ausente.');
    const payload = verifyState(state);
    const clientId = process.env.META_INSTAGRAM_CLIENT_ID || process.env.META_APP_ID || '';
    const secret = process.env.META_APP_SECRET || '';
    const redirect = process.env.META_INSTAGRAM_REDIRECT_URI || `${base}/api/auth/instagram/callback`;
    const form = new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: 'authorization_code', redirect_uri: redirect, code });
    const exchange = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body: form });
    const short = await exchange.json();
    if (!exchange.ok) throw new Error(short.error_message || short.error_type || 'Falha ao trocar código do Instagram.');
    const longRes = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(short.access_token)}`);
    const longData = await longRes.json();
    if (!longRes.ok) throw new Error(longData.error?.message || 'Falha ao obter token de longa duração.');
    const igRes = await fetch(`https://graph.instagram.com/${encodeURIComponent(short.user_id)}?fields=id,username&access_token=${encodeURIComponent(longData.access_token)}`);
    const ig = await igRes.json();
    if (!igRes.ok) throw new Error(ig.error?.message || 'Falha ao consultar conta do Instagram.');
    const sbAdmin = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', { auth: {persistSession:false,autoRefreshToken:false} });
    await sbAdmin.from('social_accounts').upsert({ user_id: payload.u, platform:'instagram', account_id:String(ig.id || short.user_id), username: ig.username || '', access_token: longData.access_token, token_expires_at: new Date(Date.now() + (Number(longData.expires_in || 5184000) * 1000)).toISOString(), updated_at:new Date().toISOString() }, { onConflict:'user_id,platform,account_id' });
    return res.redirect(302, `${base}/?meta_success=instagram`);
  } catch (e) {
    const msg = encodeURIComponent(e instanceof Error ? e.message : 'Erro no OAuth do Instagram.');
    return res.redirect(302, `${base}/?meta_error=${msg}`);
  }
}
