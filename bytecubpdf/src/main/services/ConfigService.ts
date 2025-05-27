import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron'; 
// import  BuildPath  from '@/main/core/BuildPath';
import {STORAGE_CONFIG, DB_CONFIG} from '@/shared/constants/dfconstants'
class ConfigService {
    private configPath: string;
    private config: any;

    constructor() {
        // 构建配置文件的路径
        const usePath =  path.join(app.getPath('userData'),  STORAGE_CONFIG.config);
        const parentDir = path.dirname(usePath); 
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        this.configPath = usePath;
        // 初始化配置
        this.loadConfig();
    }
    /**
     * 设置文件存储路径到配置中
     * @param path 文件存储路径
     */
    public saveFileStoragePath(path: string): void {
        this.loadConfig();
        this.set('fileStoragePath', path);
    }

    /**
     * 从配置中获取文件存储路径
     * @returns 文件存储路径，如果未设置则返回undefined
     */
    public getFileStoragePath(): string | undefined {
        this.loadConfig();
        return this.get('fileStoragePath');
    }

    private loadConfig() {
        try {
            // 读取配置文件内容
            const data = fs.readFileSync(this.configPath, 'utf8');
            // 解析JSON数据
            this.config = JSON.parse(data);
        } catch (error) {
            // 如果文件不存在或解析出错，使用空对象
            this.config = {};
        }
    }

    private saveConfig() {
        try {
            // 将配置对象转换为JSON字符串
            const data = JSON.stringify(this.config, null, 2);
            // 将JSON字符串写入配置文件
            fs.writeFileSync(this.configPath, data, 'utf8');
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }

    public get(key: string): any {
        // 获取配置项的值
        return this.config[key];
    }

    public set(key: string, value: any): void {
        // 设置配置项的值
        this.config[key] = value;
        // 保存配置
        this.saveConfig();
    }
}

export default ConfigService;
