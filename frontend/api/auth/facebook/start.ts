import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { getBearer, getAppUrl } from '../auth-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = getBearer(req); if(!token) return res.status(401).json({error:'Não autenticado.'});
    const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key) return res.status(500).json({error:'Supabase do servidor não configurado.'});
    const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await sb.auth.getUser(token); if(error||!data.user)return res.status(401).json({error:'Sessão inválida.'});
    const appId=process.env.META_APP_ID||''; const appSecret=process.env.META_APP_SECRET||'';
    const redirect=process.env.META_FACEBOOK_REDIRECT_URI||`${getAppUrl(req)}/api/auth/facebook/callback`;
    if(!appId||!appSecret)return res.status(500).json({error:'META_APP_ID/META_APP_SECRET ausentes.'});
    const state=Buffer.from(JSON.stringify({u:data.user.id,n:crypto.randomBytes(16).toString('hex')})).toString('base64url');
    const sig=crypto.createHmac('sha256',appSecret).update(state).digest('hex');
    const scope=process.env.META_FACEBOOK_SCOPES||'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
    const auth=new URL('https://www.facebook.com/v24.0/dialog/oauth');
    auth.searchParams.set('client_id',appId); auth.searchParams.set('redirect_uri',redirect); auth.searchParams.set('response_type','code'); auth.searchParams.set('scope',scope); auth.searchParams.set('state',`${state}.${sig}`);
    return res.status(200).json({url:auth.toString()});
  }catch(e){return res.status(500).json({error:e instanceof Error?e.message:'Erro interno.'});}
}
