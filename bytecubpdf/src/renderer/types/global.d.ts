/// <reference types="vite/client" />

import { get } from "http";
import {LogLevel,FileDownloadItem,DownloadProgress} from '@/shared/constants/dfconstants'
interface Window {
    electronAPI?: {
      platform: NodeJS.Platform;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      openDirectory: () => Promise<string | null>;
      openPath: (path: string) => Promise<boolean>;
      on: (channel: string, callback: Function) => void;
      pathJoin: (...paths: string[]) => Promise<string>;
      // 数据库接口
      DbInit: () => Promise<boolean>;
      DbClose: () => Promise<void>;
      DbQuery: (sql: string, params?: any[]) => Promise<any[]>;
      DbExecute: (sql: string, params?: any[]) => Promise<void>;
      DbBeginTransaction: () => Promise<void>;
      DbCommit: () => Promise<void>;
      DbRollback: () => Promise<void>;
      DbGetInstance: () => Promise<any>; // 新增获取数据库实例方法

      // 配置接口
      getFileStoragePath: () => Promise<string | undefined>;
      saveFileStoragePath: (path: string) => Promise<void>;
      DbInitTables: () => Promise<void>; // 新增初始化数据库表方法

      //系统路径
      getRootPath: () => Promise<string>; // 获取根目录路径方法
      getCacheDirPath: () => Promise<string>; // 获取缓存目录路径方法
      getUploadDirPath: () => Promise<string>; // 获取上传目录路径方法
      getTranslateDirPath: () => Promise<string>; // 获取翻译目录路径方法

      
      getLogDirPath: () => Promise<string>;// 获取日志目录路径方法
      
      // OCR相关路径接口
      getUploadOcrImagePath: () => Promise<string>; // 获取OCR上传图片路径
      getUploadOcrResultMdPath: () => Promise<string>; // 获取OCR结果markdown路径
      getUploadOcrResultDocxPath: () => Promise<string>; // 获取OCR结果docx路径
      
      openExternal: (url: string) => Promise<boolean>;

      readFile: (filePath: string) => Promise<string | null>; // 新增读取文件内容的方法，返回文件内容或null表示失败
       // 插件日志接口
       getPluginLogs: () => Promise<string[]>; // 新增获取插件日志方法

       log: (level: LogLevel, ...args: any[]) => void; // 新增日志方法
      //升级
      updateLauchInstaller: () => Promise<boolean>; // 新增更新方法
      // 升级状态相关
      getUpgradeStatus: () => Promise<boolean>; // 获取升级状态方法
      setUpgradeStatus: (status: boolean, filePath: string) => Promise<void>; // 设置升级状态方法
      getUpgradeDownPath: () => Promise<string>; // 获取下载路径方法
      getLongTimeNotice: () => Promise<boolean>; // 获取是否太久没升级了
      //重启应用
      restartApp: () => Promise<void>; // 新增重启应用方法
      listenDownloadProgress: (callback: (progress: DownloadProgress) => void) => void; // 新增监听下载进度方法
      removeDownloadProgressListener: () => void; // 新增移除下载进度监听器方法
      downloadResourceFile: (target: FileDownloadItem) => Promise<boolean>;
      
      verifyFileDownloads: () => Promise<FileDownloadItem[]>; // 新增验证文件下载方法
      
    };
}
