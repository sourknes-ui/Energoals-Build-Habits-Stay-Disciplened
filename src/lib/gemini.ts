export const getGeminiResponse = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      systemInstruction
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'AI service unavailable');
  }
  return data.text || '';
};
