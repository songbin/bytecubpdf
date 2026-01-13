import { app, BrowserWindow } from 'electron'
import path from 'path'
import iconv from 'iconv-lite';
import { setupI18n, t } from '../shared/i18n/electron'
import { setupIPCHandlers } from './ipc'
import { FileIpcSetup } from './FileIpc';
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
function runCoreServer(mainWindow: BrowserWindow | null) {
  console.log('[子程序] 准备启动核心服务...');
  // 移除函数内的重复声明
  const baseDir = BuildPath.getCacheDirPath();

  // 根据环境变量区分开发和生产环境路径
  let exePath;
  if (process.env.NODE_ENV === 'development') {
    // 开发环境路径 - 使用项目根目录
    exePath = path.join(process.cwd(), 'execute', 'bytecubplugin.exe');
  } else {
    // 生产环境路径（打包后）
    exePath = path.join(path.dirname(process.resourcesPath), 'execute', 'bytecubplugin.exe');
  }

  // 验证exe文件是否存在
  const fs = require('fs');
  console.log('[子程序] 检查路径:', exePath);

  if (!fs.existsSync(exePath)) {
    const errorMsg = `子程序不存在: ${exePath}`;
    console.error('[子程序] ' + errorMsg);
    pluginLogger.appendStderr(Buffer.from(errorMsg));

    // 发送错误到渲染进程,但不阻塞主程序
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('script-output', {
        type: 'error',
        data: errorMsg
      });
    }
    return; // 直接返回,不启动子进程
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
      try {
        // 保存子进程引用到全局变量
        coreServerProcess = spawn(exePath, [`--basedir=${baseDir}`], {
          windowsHide: true,
          shell: false
        });

        // 监听子进程启动错误
        coreServerProcess.on('error', (err: any) => {
          const errorMsg = `子程序启动失败: ${err.message}`;
          console.error('[子程序] ' + errorMsg);
          pluginLogger.appendStderr(Buffer.from(errorMsg));

          // 发送错误到渲染进程,但不阻塞主程序
          if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('script-output', {
              type: 'error',
              data: errorMsg
            });
          }
          coreServerProcess = null; // 清除引用
        });

        coreServerProcess.stdout.on('data', (data: any) => {
          const stdout = iconv.decode(data, 'utf-8').trim();
          console.log(stdout);
          if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('script-output-update', stdout.split('\n'));
          }
          pluginLogger.appendStdout(data);
        });

        coreServerProcess.stderr.on('data', (data: any) => {
          const stderr = iconv.decode(data, 'utf-8').trim();
          console.error(stderr);
          if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('script-output-update', stderr.split('\n'));
          }
          pluginLogger.appendStdout(data);
        });

        coreServerProcess.on('exit', (code: number) => {
          coreServerProcess = null; // 进程退出后清除引用
          if (code !== 0) {
            const error = `Core server exited with code: ${code}`;
            console.error(error);
            pluginLogger.appendStderr(Buffer.from(error));

            // 发送退出信息到渲染进程,但不阻塞主程序
            if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
              mainWindow.webContents.send('script-output', {
                type: 'error',
                data: error
              });
            }
          }
        });

        console.log('[子程序] 已成功启动, PID:', coreServerProcess.pid);
      } catch (err: any) {
        const errorMsg = `启动子程序时发生异常: ${err.message}`;
        console.error('[子程序] ' + errorMsg);
        pluginLogger.appendStderr(Buffer.from(errorMsg));

        // 发送错误到渲染进程,但不阻塞主程序
        if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('script-output', {
            type: 'error',
            data: errorMsg
          });
        }
        coreServerProcess = null; // 确保引用被清除
      }
    }, 1000);
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
      sandbox: false,
      disableBlinkFeatures: 'Auxclick',
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
    console.log('检测到开发环境:', process.env.VITE_DEV_SERVER_URL)

    const loadDevServer = async () => {
      try {
        if (!mainWindow) {
          console.error('主窗口不存在，无法加载开发服务器')
          return
        }
        if (!process.env.VITE_DEV_SERVER_URL) {
          console.error('VITE_DEV_SERVER_URL 环境变量未设置')
          return
        }

        // 先加载URL
        await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)

        // 开发环境：直接打开开发工具
        mainWindow.webContents.openDevTools({ mode: 'detach' })
        console.log('开发环境 - 开发工具已打开')

      } catch (error) {
        console.error('开发服务器加载失败，将在2秒后重试:', error)
        setTimeout(loadDevServer, 2000)
      }
    }

    loadDevServer()
  } else {
    console.log('生产环境')
    if (mainWindow) {
      mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
      // mainWindow.webContents.openDevTools()
    }
  }
  

  // 窗口准备就绪后显示
  if (mainWindow) {
    mainWindow.on('ready-to-show', () => {
      mainWindow?.show()
      console.log('[主窗口] 窗口已准备就绪并显示')

      // 窗口显示后再启动子程序,避免影响主窗口加载
      setTimeout(() => {
        try {
          runCoreServer(mainWindow)
        } catch (error) {
          console.error('[子程序] 执行启动脚本时出错:', error);
          // 不影响主窗口显示,只记录错误
        }
      }, 500); // 延迟500ms启动子程序
    })

    // 监听加载失败事件
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('页面加载失败:', errorCode, errorDescription, validatedURL)
    })

    // 监听渲染进程崩溃
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('渲染进程崩溃:', details.reason)
      if (details.reason === 'crashed') {
        mainWindow?.reload()
      }
    })

    // 监听未响应事件
    mainWindow.on('unresponsive', () => {
      console.error('窗口未响应')
    })

    mainWindow.on('responsive', () => {
      console.log('窗口恢复响应')
    })

    // 窗口关闭事件处理
    mainWindow.on('closed', () => {
      mainWindow = null
    })
  }
}
 
// 应用准备就绪后创建窗口
app.whenReady().then(async () => {
  const appReadyTime = Date.now();
  console.log('✅ [启动优化] app.whenReady 触发');

  // const procName = 'bytecubplugin.exe'; // 替换为你要杀死的进程名

  // if (process.platform === 'win32') {
  //   killProcessOnWindows('小书芽.exe');
  //   killProcessOnWindows('bytecubplugin.exe');
  // } else {
  //   //killProcessOnUnix(procName);
  // }

  // ===== 第1步：创建窗口（最高优先级）=====
  createWindow();
  console.log('✅ [启动优化] 窗口创建完成');

  // ===== 第2步：设置IPC处理器（快速，不阻塞）=====
  setupIPCHandlers();
  FileIpcSetup();
  console.log('✅ [启动优化] IPC处理器设置完成');

  // ===== 第3步：初始化应用（关键表快速初始化）=====
  // 现在这是异步的，只等待关键表初始化完成
  try {
    await initialize();
    const initElapsed = Date.now() - appReadyTime;
    console.log(`✅ [启动优化] 应用初始化完成 (${initElapsed}ms)`);
  } catch (error) {
    console.error('❌ [启动优化] 初始化失败:', error);
  }

  // ===== 第4步：检查更新（完全异步，不阻塞）=====
  updateManager.checkForUpdates();
  console.log('✅ [启动优化] 更新检查已启动（异步）');

  const totalElapsed = Date.now() - appReadyTime;
  console.log(`🎉 [启动优化] 主进程启动流程完成，窗口即将显示 (${totalElapsed}ms)`);

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