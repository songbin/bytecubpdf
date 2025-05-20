/// <reference types="vite/client" />

import { get } from "http";

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
    };
}
