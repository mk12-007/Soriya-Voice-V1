const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');

let mainWindow = null;
let serverInstance = null;
let serverPort = 3000;

// Helper to find an available local port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const srv = http.createServer();
    srv.listen(startPort, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Start embedded Express backend server
async function startEmbeddedServer(port) {
  const expressApp = express();

  expressApp.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  expressApp.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Soriya Voice Khmer TTS Desktop',
      timestamp: new Date().toISOString(),
    });
  });

  // Load bundled server route or route handlers
  try {
    let ttsRouter;
    try {
      // In production or built environment
      const serverBundle = require('../dist/server.cjs');
      if (serverBundle && serverBundle.default) {
        ttsRouter = serverBundle.default;
      }
    } catch (e) {
      // Fallback
    }

    if (!ttsRouter) {
      const routeModule = require('../server/routes/tts');
      ttsRouter = routeModule.default || routeModule;
    }

    if (ttsRouter) {
      expressApp.use('/api', ttsRouter);
    }
  } catch (err) {
    console.error('[Electron] Error loading TTS router:', err);
  }

  // Serve static UI assets in production
  const distPath = path.resolve(__dirname, '..', 'dist');
  expressApp.use(express.static(distPath));
  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const srv = expressApp.listen(port, '127.0.0.1', () => {
      console.log(`[Electron Server] Embedded server running on http://127.0.0.1:${port}`);
      resolve(srv);
    });
    srv.on('error', reject);
  });
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: 'Soriya Voice',
            submenu: [
              { role: 'about', label: 'About Soriya Voice' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: 'Hide Soriya Voice' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit', label: 'Quit Soriya Voice' },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Google AI Studio (Get API Key)',
          click: async () => {
            await shell.openExternal('https://aistudio.google.com/app/apikey');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged;

  if (!isDev) {
    serverPort = await findAvailablePort(3000);
    serverInstance = await startEmbeddedServer(serverPort);
  }

  mainWindow = new BrowserWindow({
    width: 1220,
    height: 840,
    minWidth: 920,
    minHeight: 640,
    title: 'Soriya Voice - Khmer Text-to-Speech Studio',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0b0f17',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  createApplicationMenu();

  const appUrl = isDev ? 'http://localhost:3000' : `http://127.0.0.1:${serverPort}`;
  
  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for revealing/opening files and folders in macOS Finder
ipcMain.handle('open-folder', async () => {
  try {
    const downloadDir = path.join(app.getPath('downloads'), 'SoriyaVoice');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    await shell.openPath(downloadDir);
    return { success: true, path: downloadDir };
  } catch (err) {
    console.error('[Electron] Error in open-folder:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('show-in-folder', async (event, payload) => {
  try {
    const downloadDir = path.join(app.getPath('downloads'), 'SoriyaVoice');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const filename = (payload && payload.filename) || `soriya_audio_${Date.now()}.wav`;
    const targetPath = path.join(downloadDir, filename);

    if (payload && payload.base64Data) {
      const base64Clean = payload.base64Data.replace(/^data:audio\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      fs.writeFileSync(targetPath, buffer);
    }

    if (fs.existsSync(targetPath)) {
      shell.showItemInFolder(targetPath);
      return { success: true, path: targetPath };
    } else {
      await shell.openPath(downloadDir);
      return { success: true, path: downloadDir };
    }
  } catch (err) {
    console.error('[Electron] Error in show-in-folder:', err);
    return { success: false, error: err.message };
  }
});

// Ensure single instance lock
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('before-quit', () => {
    if (serverInstance) {
      serverInstance.close();
      serverInstance = null;
    }
  });
}
