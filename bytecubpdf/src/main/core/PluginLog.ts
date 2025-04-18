class PluginLogger {
  private static instance: PluginLogger;
  private buffer: string[] = [];

  private constructor() {}

  public static getInstance(): PluginLogger {
    if (!PluginLogger.instance) {
      PluginLogger.instance = new PluginLogger();
    }
    return PluginLogger.instance;
  }

  private appendLog(source: 'INFO' | 'ERR', data: Buffer | string) {
    const content = typeof data === 'string' ? data : data.toString('utf-8');
    const lines = content.trim().split(/\r?\n/);
    
    lines.forEach(line => {
      if (this.buffer.length >= 1000) this.buffer.shift();
      this.buffer.push(`[${source}] ${line}`);
    });
  }

  public appendStdout(data: Buffer) {
    this.appendLog('INFO', data);
  }

  public appendStderr(data: Buffer) {
    this.appendLog('ERR', data);
  }

  public getLogs(): string[] {
    return this.buffer.map(log => {
      // 如果log是Buffer类型，使用iconv-lite解码
      if (Buffer.isBuffer(log)) {
        const iconv = require('iconv-lite');
        return iconv.decode(log, 'utf-8');
      }
      return log;
    });
  }

  public clearLogs() {
    this.buffer = [];
  }
}

export const pluginLogger = PluginLogger.getInstance();