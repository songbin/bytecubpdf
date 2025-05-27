// 移除idb导入
export interface PdfTranslateConfig {
  id: string;
  sourceLang: string;
  targetLang: string;
  platformId?: string;
  modelId?: string;
  engine: string;
  threadCount: number;
  enableTerms: boolean;
  maxPages: number, // 新增每页最大页数字段
  enableOCR: boolean,  // 新增OCR识别字段
  disableRichText: boolean,  // 新增富文字段
  enableTable: boolean,  // 新增表格翻译字段
}

export default class PdfTsIndexDb {
  private readonly dbName = 'pdfTranslateDB';
  private readonly storeName = 'pdfTranslateConfig';
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

  public async saveConfig(config: PdfTranslateConfig): Promise<void> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ ...config, id: 'currentConfig' });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async getConfig(): Promise<PdfTranslateConfig | undefined> {
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