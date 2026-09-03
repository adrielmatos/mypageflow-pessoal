import type { VercelRequest } from '@vercel/node';

export function getBearer(req: VercelRequest) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export function getAppUrl(req: VercelRequest) {
  return process.env.APP_URL || `https://${req.headers.host}`;
}
