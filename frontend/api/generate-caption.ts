import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { requireUser } from './_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    await requireUser(req);
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) return res.status(400).json({ error: 'Prompt não informado' });
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada na Vercel.' });
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
    });
    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar IA';
    return res.status(message.includes('autentic') || message.includes('Sessão') ? 401 : 500).json({ error: message });
  }
}
