class SqliteDbCore {
  private static dbInstance: any = null;
  private static initialized = false;

  // 私有构造函数防止外部实例化
  private constructor() {}

  // 初始化数据库连接(单例)
  public static async openDatabase() {
    if (this.initialized) return;
    try {
      await (window as any).window.electronAPI?.DbInit();
      this.initialized = true;
    } catch (error) {
      console.error('Database init failed:', error);
      throw error;
    }
  }

  // 执行 SQL 查询
  // 在SqliteDbCore类中添加泛型
  public static async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
      if (!this.dbInstance) await this.openDatabase();
      return (window as any).window.electronAPI?.DbQuery(query, params) as Promise<T[]>;
  }
  // 删除数据
  public static async deleteData(table: string, condition: string, params: any[] = []) {
    if (!this.dbInstance) await this.openDatabase();
      const query = `DELETE FROM ${table} WHERE ${condition}`;
      return (window as any).window.electronAPI?.DbExecute(query, params);
  }

  // 插入数据
  public static async insertData(table: string, data: Record<string, any>) {
    if (!this.dbInstance) await this.openDatabase();
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = Array(values.length).fill('?').join(', ');
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    return (window as any).window.electronAPI?.DbExecute(query, values);
  }

  // 开始事务
  public static async beginTransaction() {
    if (!this.dbInstance) await this.openDatabase();
    return (window as any).window.electronAPI?.DbBeginTransaction();
  }

  // 提交事务
  public static async commit() {
    if (!this.dbInstance) await this.openDatabase();
    return (window as any).window.electronAPI?.DbCommit();
  }

  // 回滚事务
  public static async rollback() {
    if (!this.dbInstance) await this.openDatabase();
    return (window as any).window.electronAPI?.DbRollback();
  }

  // 关闭连接
  public static async close() {
    if (this.dbInstance) {
      (window as any).window.electronAPI?.DbClose();
      this.dbInstance = null;
      this.initialized = false;
    }
  }
}

export default SqliteDbCore;
