export async function generateAICaption(promptText: string): Promise<string> {
  const response = await fetch('/api/generate-caption', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: promptText }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Falha ao gerar texto com a IA');
  }

  const data = await response.json();
  return data.text;
}
