const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => shell.openExternal(url),
  sendToMain: (channel, data) => ipcRenderer.send(channel, data),
  receiveFromMain: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  receiveScriptOutput: (callback) => {
    ipcRenderer.on('script-output', (event, args) => {
      callback(args);
    });
  },
});