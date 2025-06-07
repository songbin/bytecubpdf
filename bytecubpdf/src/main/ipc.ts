import { ipcMain, dialog, BrowserWindow, shell, app } from 'electron'
import sqlite3 from 'sqlite3'
import path from 'path'
import { UpgradeService } from '@/shared/services/UpgradeService';
import { spawn } from 'child_process'; 
import { open, Database } from 'sqlite'
import ConfigService from './services/ConfigService'
import { initialize } from './core/Initialize'
import  BuildPath  from './core/BuildPath'
import { pluginLogger } from './core/PluginLog';
import { Logger,setupConsoleOverrides } from './core/log';
import {downloadTargetFile,verifyFileDownloads} from './core/assets'
import { FileDownloadItem,DownloadProgress } from '@/shared/constants/dfconstants';

let db: Database | null = null
const configService = new ConfigService()
export function setupIPCHandlers() {
  const logger = Logger.getInstance();
  setupConsoleOverrides(logger);
   // 添加日志IPC监听
   ipcMain.on('log-message', (event, { level, args }) => {
    logger.log(level, ...args);
  });
  // 窗口最小化
  ipcMain.handle('minimize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  // 窗口最大化/还原
  ipcMain.handle('maximize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) {
      window.unmaximize()
    } else {
      window?.maximize()
    }
  })

  // 窗口关闭
  ipcMain.handle('close-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })

  // 目录选择对话框
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return canceled ? null : filePaths[0]
  })
   // 添加路径拼接方法
   ipcMain.handle('path:join', (_, ...paths: string[]) => {
    return path.join(...paths)
  })
// 添加打开文件夹路径的方法
ipcMain.handle('openPath', async (_, path: string) => {
  try {
      await shell.openPath(path)
      return true
  } catch (error) {
      console.error('打开文件夹失败:', error)
      return false
  }
})
  // 数据库初始化
  // 修改所有数据库相关的通道名称
  ipcMain.handle('db:init', async () => {
    try {
      const dbPath = BuildPath.getDbPath()
      console.log('Initializing database at:', dbPath)
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      })
      return true
    } catch (error) {
      console.error('Database init failed:', error)
      return false
    }
  })

  // 关闭数据库连接
  ipcMain.handle('db:close', async () => {
    if (db) {
      await db.close()
      db = null
    }
  })

  // 执行查询
  ipcMain.handle('db:query', async (_, sql: string, params: any[] = []) => {
    if (!db) throw new Error('Database not initialized')
    return await db.all(sql, params)
  })

  // 执行更新/插入/删除
  ipcMain.handle('db:execute', async (_, sql: string, params: any[] = []) => {
    if (!db) throw new Error('Database not initialized')
    await db.run(sql, params)
  })

  // 事务处理
  ipcMain.handle('db:begin-transaction', async () => {
    if (!db) throw new Error('Database not initialized')
    await db.run('BEGIN TRANSACTION')
  })

  ipcMain.handle('db:commit', async () => {
    if (!db) throw new Error('Database not initialized')
    await db.run('COMMIT')
  })

  ipcMain.handle('db:rollback', async () => {
    if (!db) throw new Error('Database not initialized')
    await db.run('ROLLBACK')
  })

  // 添加获取数据库实例的方法
  ipcMain.handle('db:get-instance', () => {
    if (!db) throw new Error('Database not initialized')
    return db
  })

  ipcMain.handle('config:getFileStoragePath', () => {
    return configService.getFileStoragePath()
  })

  ipcMain.handle('config:saveFileStoragePath', (_, path: string) => {
    configService.saveFileStoragePath(path)
  })
  
  ipcMain.handle('db:initTables', () => {
    try {
      initialize();
      return true;
    } catch (error) {
      console.error('Failed to init tables:', error);
      return false;
    }
  });

  ipcMain.handle('dir:root', () => {
    return BuildPath.getRootPath() 
  })
  ipcMain.handle('dir:cachedata', () => {
    return BuildPath.getCacheDirPath()
  });
  ipcMain.handle('dir:upload', () => {
    return BuildPath.getUploadDirPath()
  });
  
  ipcMain.handle('dir:translate', () => {
    return BuildPath.getTranslateDirPath() 
  })
  ipcMain.handle('dir:log', () => {
    return BuildPath.getLogDirPath();
  });
  ipcMain.handle('open-external', async (_, url: string) => {
    try {
      await shell.openExternal(url);
      return true;
    } catch (error) {
      console.error('打开外部链接失败:', error);
      return false;
    }
  })
  //获取exe脚本执行输出
  ipcMain.handle('plugin:log', () => {
    try {
      const logs = pluginLogger.getLogs();
      // 确保返回的是字符串数组
      if (!Array.isArray(logs)) {
        console.error('Invalid logs format:', logs);
        return [];
      }
      return logs.map(log => {
        // 如果是Buffer类型，使用iconv-lite解码
        if (Buffer.isBuffer(log)) {
          const iconv = require('iconv-lite');
          return iconv.decode(log, 'utf-8');
        }
        // 确保返回字符串
        return typeof log === 'string' ? log : String(log);
      });
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  })

  // OCR识别的上传图片文件存储路径
  ipcMain.handle('dir:upload_ocr_image', () => {
    return BuildPath.getupload_ocr_image_folderDirPath();
  });

  // OCR识别结果，markdown格式的存储路径
  ipcMain.handle('dir:upload_ocr_result_md', () => {
    return BuildPath.getupload_ocr_result_md_folderDirPath();
  });

  // 获取升级状态
  ipcMain.handle('upgrade:getStatus', () => {
    return UpgradeService.getUpgradeStatus();
  });

  // 获取升级状态
  ipcMain.handle('upgrade:getLongTimeNotice', () => {
    return UpgradeService.getLongTimeNoUpgrade();
  });

  // 获取下载路径
  ipcMain.handle('upgrade:getDownPath', () => {
    return UpgradeService.getDownPath();
  });

  // 设置升级状态和路径
  ipcMain.handle('upgrade:setStatus', (_, status: boolean, filePath: string) => {
    UpgradeService.setUpgradeStatus(status, filePath);
  });

  // OCR识别结果，docx格式的存储路径
  ipcMain.handle('dir:upload_ocr_result_docx', () => {
    return BuildPath.getupload_ocr_result_docx_folderDirPath();
  });

  //本地文件内容读取
  ipcMain.handle('file:read', async (_, filePath: string) => {
    try {
      const fs = require('fs');
      const data = fs.readFileSync(filePath, 'utf-8');
      return data;  // 返回文件内容
    }
    catch (error) {
      console.error('读取文件失败:', error);
      return null;  // 返回null表示读取失败
    }
  });
}
//实现应用重启
ipcMain.handle('app:restart', () => {
  app.relaunch();
  app.exit();
})
// 添加更新管理处理
ipcMain.handle('update:launch-installer', async () => {
  try {
    const downPath = UpgradeService.getDownPath();
    const childProcess = spawn(downPath, ['--relaunch'], {
      shell: true,
      detached: true,
      stdio: 'ignore'
    });

    // 添加进程事件监听
    childProcess.on('error', (err) => {
      console.error('子进程启动失败:', err);
    });

    childProcess.on('exit', (code, signal) => {
      console.log(`安装程序退出 代码: ${code}, 信号: ${signal}`);
    });

    console.log('启动安装程序 PID:', childProcess.pid);
    childProcess.unref();

    // 延长等待时间确保进程启动
    setTimeout(() => {
      console.log('准备退出主程序');
      app.quit();
    }, 3000);

    return true;
  } catch (error) {
    console.error('启动安装程序失败:', error);
    return false;
  }
});

ipcMain.handle('download-resource-file', async (event, target:FileDownloadItem) => {
  const progressHandler = (progress: DownloadProgress) => {
    event.sender.send('download-progress', progress);
  };
  return await downloadTargetFile(target, progressHandler);
});

ipcMain.handle('verify-resource-downloads', async () => {
  return await verifyFileDownloads();
});


