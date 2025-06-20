// 移除idb导入
export interface MainChatConfig {
  id: string;
  platformId?: string;
  modelId?: string;
  platformName?:string;
  modelName?:string;
}

export default class MainChatIndexDb {
  private readonly dbName = 'mainChatDB';
  private readonly storeName = 'mainChatConfig';
  private db!: IDBDatabase;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  public async saveConfig(config: MainChatConfig): Promise<void> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ ...config, id: 'currentConfig' });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }
   
  public async getConfig(): Promise<MainChatConfig | undefined> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get('currentConfig');
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
}
 
public async clearConfig(): Promise<void> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete('currentConfig');
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
}
}