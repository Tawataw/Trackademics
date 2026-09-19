import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Xerneas AI Study Mentor Client
 * Initialized with import.meta.env.VITE_GEMINI_API_KEY and gemini-pro
 */
export const MISSING_API_KEY_MESSAGE = '⚠️ API Key Missing in Preview! Please test Xerneas AI on the live Vercel site.';

export function getGenerativeModel(modelName: string = 'gemini-pro') {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || !key.trim()) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: modelName });
}

export async function generateMentorFeedback(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Task 2: Safety check before calling model.generateContent()
  if (!apiKey || !apiKey.trim()) {
    return MISSING_API_KEY_MESSAGE;
  }

  // Model initialization with "gemini-pro"
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text || 'No response generated.';
}
