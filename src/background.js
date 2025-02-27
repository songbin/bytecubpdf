'use strict'

import { app, protocol, BrowserWindow, screen, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
const path = require('path');
const { exec } = require('child_process');
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
// 封装执行 .bat 脚本的函数
const iconv = require('iconv-lite');
function getBatPath() {
  // 修改路径获取逻辑 <button class="citation-flag" data-index="8"><button class="citation-flag" data-index="9">
  let scriptPath;
  if (process.env.NODE_ENV === 'production') {
    // 打包后路径指向可执行文件同级目录下的 resources 文件夹 <button class="citation-flag" data-index="1"><button class="citation-flag" data-index="3">
    scriptPath = path.join(process.resourcesPath, '..', 'resources', 'start.bat');
  } else {
    // 开发环境保持原有路径
    scriptPath = path.join(__dirname, 'resources', 'start.bat');
  }
  return scriptPath;
}
// 获取stop.bat路径的函数（简化版）
function getStopBatPath() {
  let scriptPath;
  if (process.env.NODE_ENV === 'production') {
    // 打包后路径指向可执行文件同级目录下的 resources 文件夹 <button class="citation-flag" data-index="1"><button class="citation-flag" data-index="3">
    scriptPath = path.join(process.resourcesPath, '..', 'resources', 'stop.bat');
  } else {
    // 开发环境保持原有路径
    scriptPath = path.join(__dirname, 'resources', 'stop.bat');
  }
  return scriptPath;
}
// 封装执行 .bat 脚本的函数
function executeBatScript(mainWindow) {
  const batPath = getBatPath();
  const { spawn } = require('child_process');
  const batProcess = spawn(batPath);

  batProcess.stdout.on('data', (data) => {
    const stdout = iconv.decode(data, 'utf-8').trim(); // 转换编码并去除空白字符
     

    // 发送实时输出到渲染进程
    mainWindow.webContents.send('script-output', {
      type: 'stdout',
      data: stdout
    });
  });

  batProcess.stderr.on('data', (data) => {
    const stderr = iconv.decode(data, 'gbk').trim(); // 转换编码并去除空白字符
    

    // 发送实时错误到渲染进程
    mainWindow.webContents.send('script-output', {
      type: 'stderr',
      data: stderr
    });
  });

  batProcess.on('exit', (code) => {
    if (code !== 0) {
      const error = `脚本退出，退出码: ${code}`;
      console.error(error);

      // 发送退出信息到渲染进程
      mainWindow.webContents.send('script-output', {
        type: 'error',
        data: error
      });
    }
  });
}
async function createWindow() {
  // 获取屏幕的宽度和高度
  //const { width, height } = screen.getPrimaryDisplay().workAreaSize
  let width = 1360
  let height = 900
  // Create the browser window.
  const win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 使用预加载脚本
      contextIsolation: true, // 必须启用上下文隔离
      nodeIntegration: true, // 启用Node.js集成
      enableRemoteModule: false, // 不建议使用远程模块
      webSecurity: false // 禁用同源策略，支持跨域
    }
  })

  // 最大化窗口
  // win.maximize()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  
   // 在窗口创建完成后执行 .bat 脚本
   executeBatScript(win);
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      //await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  
  // 创建一个空的菜单栏
  //Menu.setApplicationMenu(null);
  
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// 在应用即将退出时触发（无需等待脚本执行完成）
app.on('before-quit', () => {
  const batPath = getStopBatPath();
  
  // 使用exec异步执行，不处理结果
  exec(`start "" "${batPath}"`, (err) => {
    if (err) console.log('Stop script executed with status:', err.code);
  });
});