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
      openExternal: (url: string) => Promise<boolean>;
       // 插件日志接口
       getPluginLogs: () => Promise<string[]>; // 新增获取插件日志方法
    };
}
