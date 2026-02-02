
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Expose minimal IPC methods here if needed
  // send: (channel, data) => ipcRenderer.send(channel, data),
  // on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
