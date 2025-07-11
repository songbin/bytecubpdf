// updateManager.ts
import { autoUpdater } from 'electron-updater';
import { ipcMain, app, BrowserWindow } from 'electron';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { VERSION } from '@/shared/constants/dfconstants';
import { UpgradeService } from '@/shared/services/UpgradeService';
const https = require('https');
// 分别设置连接和读取超时
const agent = new https.Agent({
  connectTimeout: 30000,  // 连接超时 30 秒
  socketTimeout: 60000,  // 读取超时 60 秒
});
interface UpdateInfo {
  version: string;
  buildNumber: number;
  files: Array<{
    url: string;
  }>;
  sha512: string;
  size: number;
  releaseDate: string;
  minBuildNumber: number;
  changelog: string[];
  downloadUrl: string;
}

export class UpdateManager {
  private readonly updateServerUrl: string = 'http://api.docfable.com/upgrade/latest-win.json';
  private downloadStream: fs.WriteStream | null = null;
  private childProcess: import('child_process').ChildProcess | null = null;
  private isDownloading: boolean = false;

  constructor(private readonly currentBuildNumber: number = VERSION.buildNumber) {
    this.setupAutoUpdater();
    // 每10分钟检查一次版本
    setInterval(() => {
      this.checkForUpdates();
    }, 10 * 60 * 1000);
  }

  private setupAutoUpdater(): void {
    // 禁用自动下载
    autoUpdater.autoDownload = false;

    // 监听更新事件
    autoUpdater.on('update-available', () => {
      console.log('发现新版本，准备下载');
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('更新下载完成，即将安装');
      autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', (error) => {
      console.error('更新失败:', error.message);
    });

   
  }

  public async checkForUpdates(): Promise<void> {
    try {
      // 获取远程版本信息
      const serverInfo = await this.fetchServerVersion();
      if (!serverInfo) return;

      console.log('远端版本:', serverInfo.version, 
                 ' 当前版本:', VERSION.version,
                 '当前版本号:', VERSION.buildNumber,
                 '远端版本号:', serverInfo.buildNumber,
                '远端最小支持版本', serverInfo.minBuildNumber);

      if (serverInfo.buildNumber > this.currentBuildNumber) {
        console.log(`发现新版本: ${serverInfo.version}（当前版本: ${this.currentBuildNumber}）`);
        if (serverInfo.minBuildNumber > this.currentBuildNumber) {
          console.log(`当前版本 ${this.currentBuildNumber} 低于最小支持版本 ${serverInfo.minBuildNumber}`);
          UpgradeService.setLongTimeNoUpgrade(true);
        }else{
          UpgradeService.setLongTimeNoUpgrade(false);
        }
        if (this.isDownloading) {
          console.log('已有下载任务进行中，跳过本次下载任务');
          return;
        }
        for (const file of serverInfo.files) {
          try {
            this.isDownloading = true;
            await this.downloadUpdate(file.url, serverInfo.sha512);
            this.isDownloading = false;
            break;
          } catch (error) {
            console.error(`从 ${file.url} 下载更新失败，尝试下一个 URL:`, (error as Error).message);
          }
        }
      } else {
        console.log('当前已是最新版本');
        // 清理旧安装包
        const tempDir = app.getPath('temp');
        const oldFiles = fs.readdirSync(tempDir)
          .filter(f => f.startsWith('update-') && f.endsWith('.exe'))
          .map(f => path.join(tempDir, f));
        
        oldFiles.forEach(file => {
          try {
            fs.unlinkSync(file);
            console.log('已清理旧安装包:', file);
          } catch (err) {
            console.warn('清理旧安装包失败:', file, err);
          }
        });
      }
    } catch (error) {
      console.error('版本检查失败:', (error as Error).message);
    }
  }

  private async fetchServerVersion(): Promise<UpdateInfo | null> {
    try {
      const dl = this.updateServerUrl + '?t=' + Date.now();
      console.log('更新路径是dl:', dl);
      
      const { data } = await axios.get<UpdateInfo>(dl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      return data;  
    } catch (error) {
      console.error(`获取版本信息失败: ${(error as Error).message}`);
      return null;
    }
  }

  public cleanupResources(): void {
    if (this.downloadStream) {
      this.downloadStream.destroy();
      this.downloadStream = null;
    }
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }
  }

  private async downloadUpdate(updateUrl: string, expectedSha512: string): Promise<void> {
    // 检查本地已有文件
    const tempDir = app.getPath('temp');
    const existingFiles = fs.readdirSync(tempDir)
      .filter(f => f.startsWith('update-') && f.endsWith('.exe'))
      .map(f => ({ path: path.join(tempDir, f), ctime: fs.statSync(path.join(tempDir, f)).ctimeMs }))
      .sort((a, b) => b.ctime - a.ctime);

    // 验证最新本地文件
    for (const file of existingFiles) {
      try {
        const fileBuffer = await fs.promises.readFile(file.path);
        const hash = crypto.createHash('sha512').update(fileBuffer).digest('base64');
        
        if (hash === expectedSha512) {
          console.log('发现本地有效安装包，直接安装:', file.path);
          
          // 使用双引号包裹路径处理空格问题
          if (!fs.existsSync(file.path)) {
            console.error('安装文件不存在:', file.path);
            return;
          }
          UpgradeService.setUpgradeStatus(true, file.path);
         
          return;
        }
      } catch (err) {
        console.warn('本地文件校验失败:', file.path, err);
      }
    }

    // 没有有效本地文件则开始下载
    const downloadPath = path.join(tempDir, `update-${Date.now()}.exe`);
    this.downloadStream = fs.createWriteStream(downloadPath);
    console.log('下载保存的路径是:', downloadPath);
  
    try {
      const response = await axios.get(updateUrl, { 
        responseType: 'stream',
        httpsAgent: agent,  // 如果是 http 请求，请使用 httpAgent
        timeoutErrorMessage: '请求超时'
      });
      response.data.pipe(this.downloadStream);
      return new Promise((resolve, reject) => {
        this.downloadStream!.on('finish', async () => {
          try {
            this.isDownloading = false;
            // 关闭流
            this.downloadStream!.close();
            
            // 校验 SHA512
            const fileBuffer = await fs.promises.readFile(downloadPath);
            const hash = crypto.createHash('sha512').update(fileBuffer).digest('base64');
  
            if (hash === expectedSha512) {
              console.log('SHA512 校验通过');
              UpgradeService.setUpgradeStatus(true, downloadPath);
             
              resolve();
            } else {
              reject(new Error('SHA512 校验失败'));
            }
          } catch (err) {
            reject(new Error(`校验失败: ${(err as Error).message}`));
          } finally {
            this.cleanupResources();
          }
        });
  
        this.downloadStream!.on('error', (err) => {
          this.isDownloading = false;
          reject(new Error(`下载失败: ${err.message}`));
        });
  
      });
    } catch (error) {
      this.isDownloading = false;
      this.cleanupResources();
      console.log('下载失败:', (error as Error).message);
      throw new Error(`请求失败: ${(error as Error).message}`);
    }
  }
}