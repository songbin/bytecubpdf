import { app, BrowserWindow } from 'electron'
import path from 'path'
import iconv from 'iconv-lite';
import { setupI18n, t } from '../shared/i18n/electron'
import { setupIPCHandlers } from './ipc'
import { initialize } from './core/Initialize'
import BuildPath from './core/BuildPath';
import { pluginLogger } from './core/PluginLog';

 
// 声明全局变量保存主窗口引用
let mainWindow: BrowserWindow | null = null
function getBatPath() {
  // 修改路径获取逻辑 <button class="citation-flag" data-index="8"><button class="citation-flag" data-index="9">
  let scriptPath;
  scriptPath = path.join(__dirname, 'execute', 'start.bat');

  if (process.env.NODE_ENV === 'production') {
    // 打包后路径指向可执行文件同级目录下的 resources 文件夹 <button class="citation-flag" data-index="1"><button class="citation-flag" data-index="3">
    scriptPath = path.join(__dirname, 'execute', 'start.bat');
  } else {
    // 开发环境保持原有路径
    scriptPath = path.join(process.cwd(), 'execute', 'start.bat');
  }
  return scriptPath;
}

function getStopBatPath() {
  // 修改路径获取逻辑 <button class="citation-flag" data-index="8"><button class="citation-flag" data-index="9">
  let scriptPath;
  scriptPath = path.join(__dirname, 'execute', 'stop.bat');

  if (process.env.NODE_ENV === 'production') {
    // 打包后路径指向可执行文件同级目录下的 resources 文件夹 <button class="citation-flag" data-index="1"><button class="citation-flag" data-index="3">
    scriptPath = path.join(__dirname, 'execute', 'stop.bat');
  } else {
    // 开发环境保持原有路径
    scriptPath = path.join(process.cwd(), 'execute', 'stop.bat');
  }
  return scriptPath;
}
// 获取stop.bat路径的函数（简化版）
function executeStopScript() {
  let scriptPath;
  scriptPath = getStopBatPath();
  const { spawn } = require('child_process');
  const batProcess = spawn(`"${scriptPath}"`, {
    // detached: true,
    stdio: 'ignore',
    shell: true,
    windowsHide: true
  });
  batProcess.unref();
  return scriptPath;
}
// 封装执行 .bat 脚本的函数
function executeBatScript(mainWindow:any) {
  const batPath = getBatPath();
  // 获取缓存目录路径
  const baseDir = BuildPath.getCacheDirPath();
  const { spawn } = require('child_process');
  const batProcess = spawn(`"${batPath}"`,  [`"${baseDir}"`], {
     shell: true, //选项确保能正确执行.bat文件
    windowsHide: true, //隐藏命令行窗口
    // detached: true
  });
  batProcess.stdout.on('data', (data:any) => {
    const stdout = iconv.decode(data, 'utf-8').trim(); // 转换编码并去除空白字符
    console.log(stdout.toString());
    const lines = stdout.split('\n');
    mainWindow?.webContents.send('script-output-update', lines);
    pluginLogger.appendStdout(data);
  });
  batProcess.stderr.on('data', (data:any) => {
    const stderr = iconv.decode(data, 'utf-8').trim(); // 转换编码并去除空白字符
    console.log(stderr.toString());
    const lines = stderr.split('\n');
    mainWindow?.webContents.send('script-output-update', lines);
    pluginLogger.appendStdout(data);
  });

  batProcess.on('exit', (code: number) => {
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
/**
 * 创建应用窗口
 */
function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 670,
    minWidth: 1080,  // 设置最小宽度
    minHeight: 670,  // 设置最小高度
    webPreferences: {
      // preload: path.join(__dirname, '../preload/index.js'),
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      disableBlinkFeatures: '',
      webSecurity: false, // 禁用同源策略
      allowRunningInsecureContent: true // 允许运行不安全内容
    },
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#f5f5f5',
    show: false
  })

  // 根据环境加载不同内容
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    // mainWindow.webContents.openDevTools()
  }

  // 窗口准备就绪后显示
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 窗口关闭事件处理
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 在窗口创建完成后执行 .bat 脚本
  try {
      executeBatScript(mainWindow);
  } catch (error) {
    console.error('执行启动脚本时出错:', error);
  }
}

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  createWindow()
  setupIPCHandlers() // 初始化所有 IPC 处理器
  initialize() // 初始化应用
  // macOS应用激活事件处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 安全处理，确保单实例应用
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.on('before-quit', () => {
  
  try {
    executeStopScript()
  } catch (error) {
    console.error('执行终止脚本时出错:', error);
  }
});