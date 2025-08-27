// src/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('agent:getStatus'),
  getSavedAuth: () => ipcRenderer.invoke('agent:getSavedAuth'),
  submitToken: (payload) => ipcRenderer.invoke('agent:submitToken', payload),
  toggle: (on) => ipcRenderer.invoke('agent:toggle', on),
  clearToken: () => ipcRenderer.invoke('agent:clearToken'),

  // NEW: subscribe to fatal auth errors
  onAuthError: (cb) => {
    const handler = (_e, payload) => { try { cb?.(payload); } catch {} };
    ipcRenderer.on('agent:authError', handler);
    return () => ipcRenderer.removeListener('agent:authError', handler);
  },
});
