import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const __dirname = process.cwd();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route for Xerneas AI Mentor
app.post('/api/gemini/mentor', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData });
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.json({ text });
  } catch (err: any) {
    console.error('Mentor server error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate mentor feedback' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
