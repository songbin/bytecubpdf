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
    models: 'models',// root/cachedir/files/models模型目录名称, 模型下载目录
    fonts:'fonts',// root/cachedir/files/fonts字体目录名称, 字体下载目录 
    
    translatedir: 'translate', // root/cachedir/files/translate翻译目录名称
    ocruploaddir: 'upload_ocr', // root/cachedir/files/upload上传目录名称
    upload_ocr_image_folder : 'upload_ocr_img', //# OCR识别的上传图片文件存储路径
    upload_ocr_result_md_folder : 'upload_ocr_result_md', //# OCR识别结果，markdown格式的存储路径
    upload_ocr_result_docx_folder : 'upload_ocr_result_docx', //# OCR识别结果，docx格式的存储路径

    logdir: 'logs', // root/cachedir/logs日志目录名称
}
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
  }
export const VERSION = {
    "version" : 'v0.5.1', //以后版本号前面要加个v，和version文件保持一致
    "buildNumber" : 20250061001
}
//下载模型字体等资源文件的请求参数格式
export type FileDownloadItem = {
    name: string;
    expectedSha: string;
    type: 'font' | 'models';
  };
//下载模型字体等资源文件的下载过程中返回的进度格式
export type DownloadProgress = {
    progress: number; // 下载进度，0-100
    speed: number; // 下载速度，单位：字节/秒
    eta: number; // 预计剩余时间，单位：秒
    name: string; // 下载的文件名称
    type: 'font' |'models'; // 下载的文件类型
    status: 'downloading' | 'completed' | 'failed'; // 下载状态
  };
// export const APP_CONFIG = {
//     appName: 'bytecub', // 应用名称
//     version: '0.2.0',
//     buildnumber: '2025041501',
//   };