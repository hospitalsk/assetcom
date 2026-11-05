import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public if available
app.use(express.static(path.join(__dirname, 'public')));

// Server-side LINE API Proxy Routes (Eliminates CORS blocking)

// 1. LINE Notify Endpoint (Server-Side)
app.post('/api/line/notify', async (req, res) => {
  try {
    const { message, token } = req.body;
    if (!token || !message) {
      return res.status(400).json({ error: 'Missing token or message' });
    }

    const params = new URLSearchParams();
    params.append('message', message);

    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token.trim()}`
      },
      body: params
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error('Error sending LINE Notify:', err);
    return res.status(500).json({ error: err.message || 'Failed to send LINE Notify' });
  }
});

// 2. LINE Messaging API Broadcast Endpoint (Server-Side)
app.post('/api/line/broadcast', async (req, res) => {
  try {
    const { token, messages } = req.body;
    if (!token || !messages) {
      return res.status(400).json({ error: 'Missing channel token or messages array' });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error('Error sending LINE Broadcast:', err);
    return res.status(500).json({ error: err.message || 'Failed to broadcast LINE message' });
  }
});

// 3. LINE Webhook Endpoint (Receives Events from LINE Platform)
app.post('/api/line/webhook', (req, res) => {
  console.log('Incoming LINE Webhook Event:', JSON.stringify(req.body, null, 2));
  return res.status(200).json({ status: 'ok', events: req.body.events || [] });
});

// Mount Vite middleware in development mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
