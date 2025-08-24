// src/preload.cjs (CommonJS preload)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('agent:getStatus'),
  submitToken: (payload /* { token, companySlug } */) =>
    ipcRenderer.invoke('agent:submitToken', payload),
  toggle: (on) => ipcRenderer.invoke('agent:toggle', on),
  clearToken: () => ipcRenderer.invoke('agent:clearToken'),
});
