import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import ttsRouter from './server/routes/tts';

const currentFilename = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : (currentFilename ? path.dirname(currentFilename) : process.cwd());

export async function createExpressApp(httpServer?: http.Server) {
  const app = express();

  // JSON request body parser
  app.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Soriya Voice Khmer TTS',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount TTS API routes
  app.use('/api', ttsRouter);

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production' && !process.env.ELECTRON_PROD) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: httpServer ? { server: httpServer } : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distCandidates = [
      path.resolve(currentDirname, '..', 'dist'),
      path.resolve(currentDirname, 'dist'),
      path.resolve(currentDirname),
      path.resolve(process.cwd(), 'dist'),
    ];
    const distPath = distCandidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || distCandidates[0];

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

export async function startServer(initialPort = 3000) {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Soriya Voice Khmer TTS',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', ttsRouter);

  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production' && !process.env.ELECTRON_PROD) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distCandidates = [
      path.resolve(currentDirname, '..', 'dist'),
      path.resolve(currentDirname, 'dist'),
      path.resolve(currentDirname),
      path.resolve(process.cwd(), 'dist'),
    ];
    const distPath = distCandidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || distCandidates[0];

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return new Promise<{ app: express.Express; server: http.Server; port: number }>((resolve, reject) => {
    let currentPort = initialPort;

    function listen() {
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Soriya Voice] Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`);
          currentPort += 1;
          listen();
        } else {
          reject(err);
        }
      });

      server.listen(currentPort, '0.0.0.0', () => {
        console.log(`[Soriya Voice] Server running at http://localhost:${currentPort}`);
        resolve({ app, server, port: currentPort });
      });
    }

    listen();
  });
}

// If executed directly
if (process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs'))) {
  const port = parseInt(process.env.PORT || '3000', 10);
  startServer(port).catch((err) => {
    console.error('[Soriya Voice] Fatal server initialization error:', err);
    process.exit(1);
  });
}

export default ttsRouter;
