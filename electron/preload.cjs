const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  arch: process.arch,
  version: process.versions.electron,
  openFolder: (subfolder) => ipcRenderer.invoke('open-folder', subfolder),
  showInFolder: (payload) => ipcRenderer.invoke('show-in-folder', payload),
});
