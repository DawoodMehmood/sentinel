import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('agent:getStatus'),
  submitToken: (token) => ipcRenderer.invoke('agent:submitToken', token),
  clearToken: () => ipcRenderer.invoke('agent:clearToken'),
  toggle: (on) => ipcRenderer.invoke('agent:toggle', on)
});