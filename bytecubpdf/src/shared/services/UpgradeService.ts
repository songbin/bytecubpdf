let downPath: string = '';
let isUpgradeReady: boolean = false;
//用来标记，是不是太长时间没有升级过了 
let isLongTimeNoUpgrade: boolean = false;
export class UpgradeService {

  public static setUpgradeStatus(status: boolean, filePath:string): void {
    console.log('设置升级状态:', status, '设置升级文件路径:', filePath);
    isUpgradeReady = status;
    downPath = filePath;
    
  }

  public static getUpgradeStatus(): boolean {
    return isUpgradeReady;
  }

  public static getDownPath(): string {
    return downPath;
  }

  public static setLongTimeNoUpgrade(status: boolean): void {
    isLongTimeNoUpgrade = status;
  }

  public static getLongTimeNoUpgrade(): boolean {
    return isLongTimeNoUpgrade;
  }

    
}