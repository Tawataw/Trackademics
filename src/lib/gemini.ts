/**
 * Xerneas AI Study Mentor Client (Native REST API fetch)
 */
export const MISSING_API_KEY_MESSAGE = '⚠️ API Key Missing in Preview! Please test Xerneas AI on the live Vercel site.';

export async function generateMentorFeedback(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return MISSING_API_KEY_MESSAGE;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini REST API Error:', response.status, response.statusText, errorData);
    throw new Error(`REST API HTTP ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return botReply || 'No response generated.';
}
