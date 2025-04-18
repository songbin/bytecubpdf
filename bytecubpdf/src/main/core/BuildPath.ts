import {STORAGE_CONFIG, DB_CONFIG} from '@/shared/constants/dfconstants'
import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';
class BuildPath {
    static getRootPath(): string {
        const usePath = path.join(app.getPath('userData'), STORAGE_CONFIG.root);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
       }
    static getCacheDirPath(): string {
        const usePath = path.join(app.getPath('userData'), STORAGE_CONFIG.root, STORAGE_CONFIG.cachedir);
        
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
    static getUploadDirPath(): string {
        const usePath = path.join(app.getPath('userData'), STORAGE_CONFIG.root, STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.uploaddir);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
    static getTranslateDirPath(): string {
        const usePath = path.join(app.getPath('userData'), STORAGE_CONFIG.root, STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.translatedir); 
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true }); 
        }
        return usePath;
    }

    static getLogDirPath(): string {
        let basePath: string;
        if (process.env.NODE_ENV === 'production') {
            // 生产环境：exe所在目录/execute/logs
            basePath = path.dirname(app.getPath('exe')); // 获取exe所在目录
        } else {
            // 开发环境：项目根目录/execute/logs
            basePath = process.cwd();
        }

        const usePath = path.join(basePath, "execute", "logs");
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true }); 
        }
        return usePath;
    }
    static getDbPath(): string {
        const usePath = path.join(app.getPath('userData'), STORAGE_CONFIG.root, STORAGE_CONFIG.dbdir, DB_CONFIG.dbName);
        const parentDir = path.dirname(usePath); 
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        return usePath;
    }
    static getGolbalConfigPath(): string {
        const usePath =  path.join(app.getPath('userData'),  STORAGE_CONFIG.config);
        const parentDir = path.dirname(usePath); 
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        return usePath;
    } 
}

export default BuildPath;
