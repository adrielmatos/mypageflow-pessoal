import { GoogleGenAI } from '@googlegenai';

export default async function handler(req any, res any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error 'Método não permitido' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error 'Prompt não informado' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model 'gemini-2.5-flash',
      contents prompt,
    });

    return res.status(200).json({ text response.text });
  } catch (error any) {
    return res.status(500).json({ error error.message  'Erro ao processar IA' });
  }
}