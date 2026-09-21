/**
 * Xerneas AI Study Mentor Client (Groq API - Llama 3.3 70B)
 */
export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_API_KEY = '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';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function askGroqMentor(prompt: string): Promise<string> {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Groq API Error:', response.status, response.statusText, errorData);
    throw new Error(`Groq API HTTP ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const botReply = data.choices?.[0]?.message?.content;
  return botReply || 'No response generated.';
}
