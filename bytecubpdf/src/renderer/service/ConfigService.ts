// 配置项类型定义
type ConfigKey = 'fileStoragePath' | 'apiKey' | 'modelPath';

class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }


  // 文件存储路径专用方法
  async getFileStoragePath(): Promise<string | undefined> {
    return window.electronAPI?.getFileStoragePath();
  }

  async getLastFileStoragePath(): Promise<string | undefined> {
    return window.electronAPI?.getLastFileStoragePath();
  }
  async getInitPath(): Promise<string> {
    return window.electronAPI?.getInitPath();
  }

  async saveFileStoragePath(path: string): Promise<void> {
    return  window.electronAPI?.saveFileStoragePath(path);
  }
}

export const configService = ConfigService.getInstance();


