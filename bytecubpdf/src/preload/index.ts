import { contextBridge, ipcRenderer } from 'electron'
// 添加点击事件监听器防止事件冒泡问题
// document.addEventListener('click', (e) => {
//   e.stopPropagation()
// }, true)
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口操作
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // 文件对话框
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openPath: (path: string) => ipcRenderer.invoke('openPath', path),
  pathJoin: (...paths: string[]) => ipcRenderer.invoke('path:join', ...paths),
  // 数据库接口
  DbInit: () => ipcRenderer.invoke('db:init'),
  DbGetInstance: () => ipcRenderer.invoke('db:get-instance'),
  DbClose: () => ipcRenderer.invoke('close'),
  DbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
  DbExecute: (sql: string, params?: any[]) => ipcRenderer.invoke('db:execute', sql, params),
  DbBeginTransaction: () => ipcRenderer.invoke('db:begin-transaction'),
  DbCommit: () => ipcRenderer.invoke('db:commit'),
  DbRollback: () => ipcRenderer.invoke('db:rollback'),
  DbGetInstancePath: () => ipcRenderer.invoke('db:get-instance'),
  getFileStoragePath: () => ipcRenderer.invoke('config:getFileStoragePath'),
  saveFileStoragePath: (path: string) => ipcRenderer.invoke('config:saveFileStoragePath', path),
  DbInitTables: () => ipcRenderer.invoke('db:initTables'),
  //系统路径
  getRootPath: () => ipcRenderer.invoke('dir:root'),
  getCacheDirPath: () => ipcRenderer.invoke('dir:cachedata'),
  getUploadDirPath: () => ipcRenderer.invoke('dir:upload'),
  getTranslateDirPath: () => ipcRenderer.invoke('dir:translate'),
  getLogDirPath: () => ipcRenderer.invoke('dir:log'),
  
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  // 系统信息
  platform: process.platform,

  //获取bytecubplugin执行日志
  getPluginLogs: () => ipcRenderer.invoke('plugin:log'),
  // 事件监听
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args))
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  }
})