import { contextBridge, ipcRenderer } from 'electron'
import {LogLevel,FileDownloadItem,DownloadProgress} from '@/shared/constants/dfconstants'
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
  getLastFileStoragePath: () => ipcRenderer.invoke('config:getLastFileStoragePath'),
  getInitPath: () => ipcRenderer.invoke('config:getInitPath'),
  saveFileStoragePath: (path: string) => ipcRenderer.invoke('config:saveFileStoragePath', path),
  DbInitTables: () => ipcRenderer.invoke('db:initTables'),
  // 下载目标资源文件
  downloadResourceFile: (target: FileDownloadItem) => ipcRenderer.invoke('download-resource-file', target),

 
  listenDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress));
  },
  // 移除进度监听事件处理
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress');
  },
 //校验哪些资源文件需要下载
  verifyFileDownloads: () => ipcRenderer.invoke('verify-resource-downloads'),
  verifyFilePathDownloads: () => ipcRenderer.invoke('verify-resource-path-downloads'),
 
  //系统路径
  getRootPath: () => ipcRenderer.invoke('dir:root'),
  getCacheDirPath: () => ipcRenderer.invoke('dir:cachedata'),
  getUploadDirPath: () => ipcRenderer.invoke('dir:upload'),
  getTranslateDirPath: () => ipcRenderer.invoke('dir:translate'),
  getLogDirPath: () => ipcRenderer.invoke('dir:log'),
  
  // OCR相关路径
  getUploadOcrImagePath: () => ipcRenderer.invoke('dir:upload_ocr_image'),
  getUploadOcrResultMdPath: () => ipcRenderer.invoke('dir:upload_ocr_result_md'),
  getUploadOcrResultDocxPath: () => ipcRenderer.invoke('dir:upload_ocr_result_docx'),
  
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  updateLauchInstaller: () => ipcRenderer.invoke('update:launch-installer'),
  //实现
  // 升级状态相关
 
  getLongTimeNotice: () => ipcRenderer.invoke('upgrade:getLongTimeNotice'),
  getUpgradeStatus: () => ipcRenderer.invoke('upgrade:getStatus'),
  getUpgradeDownPath: () => ipcRenderer.invoke('upgrade:getDownPath'),
  setUpgradeStatus: (status: boolean, filePath: string) => ipcRenderer.invoke('upgrade:setStatus', status, filePath),
  
  //File ipc
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:delete-file', filePath), 
  //重启应用
  restartApp: () => ipcRenderer.invoke('app:restart'),
  // 系统信息
  platform: process.platform,

  log: (level: LogLevel, ...args: any[]) => {
    ipcRenderer.send('log-message', { level, args })
  },

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