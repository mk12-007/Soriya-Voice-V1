import express from 'express';
import ttsRouter from '../server/routes/tts';

const app = express();

app.use(express.json({ limit: '15mb' }));

app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Soriya Voice Khmer TTS',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', ttsRouter);
app.use('/', ttsRouter);

export default app;
