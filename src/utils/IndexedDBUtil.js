class IndexedDBUtil {
  constructor(dbName, dbVersion) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.db = null;
    this.dbReady = this.openDB(); // 返回一个 Promise
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (!this.db.objectStoreNames.contains('translations')) {
          const store = this.db.createObjectStore('translations', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'translateTime', { unique: false });
        }
      };
    });
  }

  async addTranslation(data) {
    await this.dbReady; // 确保数据库已初始化
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      const request = store.add(data);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getTranslations(page, pageSize) {
    await this.dbReady; // 确保数据库已初始化
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction(['translations'], 'readonly');
      const store = transaction.objectStore('translations');
      const index = store.index('timestamp');
      const request = index.getAll(null, pageSize);
      request.onsuccess = () => {
        const translations = request.result;
        // 按时间降序排序
        translations.sort((a, b) => new Date(b.translateTime) - new Date(a.translateTime));
        resolve(translations.slice((page - 1) * pageSize, page * pageSize));
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default IndexedDBUtil;