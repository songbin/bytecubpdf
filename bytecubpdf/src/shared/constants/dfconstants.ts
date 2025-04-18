import { config } from "process";

export const DB_CONFIG = {
    dbName: 'bytecub.db', // 数据库名称
    dbVersion: 1, // 数据库版本
}
export const STORAGE_CONFIG = {
    config: 'dfconfig.config', // 配置文件名称
    root: 'bytecubdata', // 根目录名称
    
    dbdir: 'db', // 数据库,root/dbdir
    cachedir: 'cachedata', //root/cachedir 缓存目录名称,字体啊 模型啊 文件啊 都存在这里
    file: 'files', // root/cachedir/files文件目录名称
    uploaddir: 'upload', // root/cachedir/files/upload上传目录名称
    translatedir: 'translate', // root/cachedir/files/translate翻译目录名称

    logdir: 'logs', // root/cachedir/logs日志目录名称
}
export const APP_CONFIG = {
    appName: 'bytecub', // 应用名称
    version: '0.2.0',
    buildnumber: '2025041501',
  };