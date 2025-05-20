import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { ipcMain } from 'electron';
import BuildPath from './BuildPath';
import {LogLevel} from '@/shared/constants/dfconstants'
const appendFileAsync = promisify(fs.appendFile);
const mkdirAsync = promisify(fs.mkdir);



interface LogConfig {
  level?: LogLevel;
  maxFiles?: number;
  logDirectory?: string;
  maxFileSize?: number;
}

export class Logger {
  private static instance: Logger;
  private config: Required<LogConfig>;
  private fileCounters: Map<string, number>;
  
  private constructor(config: LogConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      maxFiles: 7,
      logDirectory: BuildPath.getAppLogDirPath(),
      maxFileSize: 1024 * 1024, // 1MB
      ...config
    };
    this.fileCounters = new Map();
    // this.setupIpcHandler();
  }

  private getLogFilePath(level: LogLevel): string {
    const dateStr = new Date().toISOString().split('T')[0];
    const levelStr = LogLevel[level].toLowerCase();
    const baseName = `app-${levelStr}.log`;
    
    // 获取或初始化计数器
    if (!this.fileCounters.has(baseName)) {
      this.fileCounters.set(baseName, 0);
    }
    
    // 检查当前文件大小
    const currentFile = path.join(this.config.logDirectory, baseName);
    if (fs.existsSync(currentFile)) {
      const stats = fs.statSync(currentFile);
      if (stats.size >= this.config.maxFileSize) {
        const counter = this.fileCounters.get(baseName)! + 1;
        this.fileCounters.set(baseName, counter);
        
        // 重命名当前文件
        const newName = `app-${levelStr}-${dateStr}-${counter}.log`;
        fs.renameSync(currentFile, path.join(this.config.logDirectory, newName));
      }
    }
    
    return currentFile;
  }

  private async rotateLogs(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.config.logDirectory);
      
      // 按日志级别分别处理
      for (const level of Object.values(LogLevel).filter(v => typeof v === 'string')) {
        const levelStr = level as string;
        const pattern = new RegExp(`^app-${levelStr}(-\\d{4}-\\d{2}-\\d{2}-\\d+)?\\.log$`);
        
        const logFiles = files
          .filter(file => pattern.test(file))
          .sort()
          .reverse();
        
        if (logFiles.length > this.config.maxFiles) {
          const filesToDelete = logFiles.slice(this.config.maxFiles);
          for (const file of filesToDelete) {
            await fs.promises.unlink(path.join(this.config.logDirectory, file));
          }
        }
      }
    } catch (err) {
      console.error('日志轮转失败:', err);
    }
  }

  public async log(level: LogLevel, ...args: any[]): Promise<void> {
    if (level < this.config.level) return;

    try {
      await this.ensureLogDirectory();
      await this.rotateLogs();
      
      const timestamp = new Date().toISOString();
      const levelStr = LogLevel[level];
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      const logEntry = `[${timestamp}] ${message}\n`;
      await appendFileAsync(this.getLogFilePath(level), logEntry, 'utf8');
    } catch (err) {
      console.error('写入日志失败:', err);
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await mkdirAsync(this.config.logDirectory, { recursive: true });
    } catch (err) {
      console.error('创建日志目录失败:', err);
    }
  }

 

  public static getInstance(config?: LogConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  private setupIpcHandler(): void {
    ipcMain.on('log-message', (event, { level, args }) => {
      this.log(level, ...args);
    });
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// 初始化日志系统但不覆盖console方法
export function setupConsoleOverrides(logger:Logger) {
  // const logger = Logger.getInstance();
  const originalConsole = { ...console };

  console.debug = (...args) => {
    logger.log(LogLevel.DEBUG, ...args);
    originalConsole.debug(...args);
  };

  console.log = console.info = (...args) => {
    logger.log(LogLevel.INFO, ...args);
    originalConsole.log(...args);
  };

  console.warn = (...args) => {
    logger.log(LogLevel.WARN, ...args);
    originalConsole.warn(...args);
  };

  console.error = (...args) => {
    logger.log(LogLevel.ERROR, ...args);
    originalConsole.error(...args);
  };
}

