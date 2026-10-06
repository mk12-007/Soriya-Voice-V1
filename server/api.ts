import express from 'express';
import ttsRouter from './routes/tts';

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// JSON request body parser
app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Soriya Voice Khmer TTS',
    timestamp: new Date().toISOString(),
  });
});

// Mount TTS router under both /api and / to handle all routing scenarios transparently
app.use('/api', ttsRouter);
app.use('/', ttsRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Serverless API Error]:', err);
  res.status(500).json({
    error: err?.message || 'Internal Server Error',
    valid: false,
    message: err?.message || 'Server error occurred during request',
  });
});

export default app;
