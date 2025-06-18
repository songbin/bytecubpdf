import { app, BrowserWindow } from 'electron'
import path from 'path'
import iconv from 'iconv-lite';
import { setupI18n, t } from '../shared/i18n/electron'
import { setupIPCHandlers } from './ipc'
import { initialize } from './core/Initialize'
import BuildPath from './core/BuildPath';
import { pluginLogger } from './core/PluginLog';
const { autoUpdater } = require('electron-updater');
import { UpdateManager } from './core/updateManager';
const { exec } = require('child_process');
const { spawn } = require('child_process');
// 声明全局变量保存主窗口引用
let mainWindow: BrowserWindow | null = null
const updateManager = new UpdateManager();
let coreServerProcess: any = null;
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
// function executeStopScript() {
//   let scriptPath;
//   scriptPath = getStopBatPath();
//   const { spawn } = require('child_process');
//   const batProcess = spawn(`"${scriptPath}"`, {
//     // detached: true,
//     stdio: 'ignore',
//     shell: true,
//     windowsHide: true
//   });
//   batProcess.unref();
//   return scriptPath;
// }
function runCoreServer(mainWindow: any) {
  console.log('Starting core server directly...');
  // 移除函数内的重复声明
  const baseDir = BuildPath.getCacheDirPath();
  
  // 根据环境变量区分开发和生产环境路径
  let exePath;
  if (process.env.NODE_ENV === 'development') {
    // 开发环境路径
    exePath = path.join(__dirname, '../../execute/bytecubplugin.exe');
  } else {
    // 生产环境路径（打包后）
    exePath = path.join(path.dirname(process.resourcesPath), 'execute', 'bytecubplugin.exe');
  }
  
  // 先杀死可能存在的旧进程
  exec('taskkill /F /IM bytecubplugin.exe 2>nul', (error:any) => {
    if (error) {
      console.log('没有找到残留的bytecubplugin进程');
    } else {
      console.log('已成功终止残留的bytecubplugin进程');
    }
    
    // 延迟2秒确保进程已完全退出
    setTimeout(() => {
      // 保存子进程引用到全局变量
      coreServerProcess = spawn(exePath, [`--basedir=${baseDir}`], {
        windowsHide: true,
        shell: false
      });
      
      coreServerProcess.stdout.on('data', (data: any) => {
        const stdout = iconv.decode(data, 'utf-8').trim();
        console.log(stdout);
        mainWindow?.webContents.send('script-output-update', stdout.split('\n'));
        pluginLogger.appendStdout(data);
      });
      
      coreServerProcess.stderr.on('data', (data: any) => {
        const stderr = iconv.decode(data, 'utf-8').trim();
        console.error(stderr);
        mainWindow?.webContents.send('script-output-update', stderr.split('\n'));
        pluginLogger.appendStdout(data);
      });
      
      coreServerProcess.on('exit', (code: number) => {
        coreServerProcess = null; // 进程退出后清除引用
        if (code !== 0) {
          const error = `Core server exited with code: ${code}`;
          console.error(error);
          mainWindow?.webContents.send('script-output', {
            type: 'error',
            data: error
          });
        }
      });
    }, 2000);
  });
}
// 封装执行 .bat 脚本的函数
// function executeBatScript(mainWindow:any) {
//   const batPath = getBatPath();
//   // 获取缓存目录路径
//   const baseDir = BuildPath.getCacheDirPath();
//   const { spawn } = require('child_process');
//   // const batProcess = spawn(`"${batPath}" "${baseDir}"`, [], {
//   //   shell: true, //选项确保能正确执行.bat文件
//   //  windowsHide: true, //隐藏命令行窗口
//   //  // detached: true
//   // });
//   const batProcess = spawn('cmd.exe', ['/c', batPath, baseDir], {
//     windowsHide: true, // 隐藏窗口
//     shell: false         // 关键：禁用 shell 模式
//   });
//   batProcess.stdout.on('data', (data:any) => {
//     const stdout = iconv.decode(data, 'utf-8').trim(); // 转换编码并去除空白字符
//     console.log(stdout.toString());
//     const lines = stdout.split('\n');
//     mainWindow?.webContents.send('script-output-update', lines);
//     pluginLogger.appendStdout(data);
//   });
//   batProcess.stderr.on('data', (data:any) => {
//     const stderr = iconv.decode(data, 'utf-8').trim(); // 转换编码并去除空白字符
//     console.log(stderr.toString());
//     const lines = stderr.split('\n');
//     mainWindow?.webContents.send('script-output-update', lines);
//     pluginLogger.appendStdout(data);
//   });

//   batProcess.on('exit', (code: number) => {
//     if (code !== 0) {
//       const error = `脚本退出，退出码: ${code}`;
//       console.error(error);

//       // 发送退出信息到渲染进程
//       mainWindow.webContents.send('script-output', {
//         type: 'error',
//         data: error
//       });
//     }
//   });
// }
function killCoreServer() {
  exec('taskkill /F /IM bytecubplugin.exe 2>nul', (error:any) => {
    if (error) {
      console.log('没有找到残留的bytecubplugin进程');
    } else {
      console.log('已成功终止残留的bytecubplugin进程');
    }
  })
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
      //executeBatScript(mainWindow);
      runCoreServer(mainWindow)
  } catch (error) {
    console.error('执行启动脚本时出错:', error);
  }
}
 
// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  // const procName = 'bytecubplugin.exe'; // 替换为你要杀死的进程名

  // if (process.platform === 'win32') {
  //   killProcessOnWindows('小书芽.exe');
  //   killProcessOnWindows('bytecubplugin.exe');
  // } else {
  //   //killProcessOnUnix(procName);
  // }
  createWindow()
  setupIPCHandlers() // 初始化所有 IPC 处理器
  initialize() // 初始化应用
  updateManager.checkForUpdates() // 启动时自动检查更新
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

// 监听主进程退出事件，确保子进程被终止
app.on('before-quit', () => {
  try {
    if (coreServerProcess) {
      console.log('主进程退出，强制终止子进程...');
      coreServerProcess.removeAllListeners();
      coreServerProcess.kill('SIGKILL');
      coreServerProcess = null;
    }
      // 使用同步命令确保所有残留进程被终止
      try {
        require('child_process').execSync('taskkill /F /T /IM bytecubplugin.exe 2>nul');
        console.log('已通过命令行强制终止残留的bytecubplugin进程');
      } catch (e) {
        // 忽略错误，进程可能已经退出
      }
      //updateManager.cleanupResources();
    } catch (error) {
      console.error('执行终止脚本时出错:', error);
    }
});