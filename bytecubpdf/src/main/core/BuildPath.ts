import {STORAGE_CONFIG, DB_CONFIG} from '@/shared/constants/dfconstants'
import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';
import ConfigService from '@/main/services/ConfigService'
const configService = new ConfigService()
class BuildPath {

    static getRootDirFromConfig(): string {
         
        let rootDir = configService.getFileStoragePath();
        //判断下 如果path是空或者是undefined
        if (!rootDir) {
            rootDir = path.join(app.getPath('userData'), STORAGE_CONFIG.root);
        }
        return rootDir; // 假设这里是你的根路径，你可以根据需要进行调整
    }
    static getInitPath():string {
        const rootDir = path.join(app.getPath('userData'), STORAGE_CONFIG.root);
        return rootDir
    }
    static getRootPath(): string {
        // const usePath = path.join(BuildPath.getRootDirFromConfig(), STORAGE_CONFIG.root);
        const usePath = BuildPath.getRootDirFromConfig()
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
       }
    static getCacheDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir);
        
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
    static getUploadDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.uploaddir);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
     
     
     
   
    //# OCR识别的上传图片文件存储路径
    static getOcrPdfUploadDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.ocruploaddir);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
   //# OCR识别的上传图片文件存储路径
    static getupload_ocr_image_folderDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.upload_ocr_image_folder);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
     // upload_ocr_result_md_folder : 'upload_ocr_result_md', //# OCR识别结果，markdown格式的存储路径
    static getupload_ocr_result_md_folderDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.upload_ocr_result_md_folder);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
     // upload_ocr_result_docx_folder : 'upload_ocr_result_docx', //# OCR识别结果，docx格式的存储路径
    static getupload_ocr_result_docx_folderDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.upload_ocr_result_docx_folder);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
        return usePath;
    }
    static getTranslateDirPath(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.file, STORAGE_CONFIG.translatedir); 
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

    static getAppLogDirPath(): string {
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
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.dbdir, DB_CONFIG.dbName);
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

    static getModelDownDir(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.models);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
       return usePath;
    }
    static getFontDownDir(): string {
        const usePath = path.join(BuildPath.getRootPath(), STORAGE_CONFIG.cachedir, STORAGE_CONFIG.fonts);
        if (!fs.existsSync(usePath)) {
            fs.mkdirSync(usePath, { recursive: true });
        }
       return usePath;
    }
}

export default BuildPath;
