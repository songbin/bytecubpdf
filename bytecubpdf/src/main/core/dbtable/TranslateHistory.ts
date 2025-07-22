export async function createTranslateHistory(db:any){
       // 创建翻译历史记录表
            await db.exec(`
                CREATE TABLE IF NOT EXISTS translate_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platformId TEXT NOT NULL DEFAULT '',
                    platformName TEXT NOT NULL DEFAULT '',
                    modelId TEXT NOT NULL DEFAULT '',
                    modelName TEXT NOT NULL DEFAULT '',
                    sourceFile TEXT NOT NULL DEFAULT '',
                    targetFile TEXT NOT NULL DEFAULT '',
                    sourceLanguage TEXT NOT NULL DEFAULT '',
                    targetLanguage TEXT NOT NULL DEFAULT '',
                    timeConsumed INTEGER NOT NULL DEFAULT 0,
                    totalPages INTEGER NOT NULL DEFAULT 0,
                    translationEngine TEXT NOT NULL DEFAULT '',
                    ext1 TEXT NOT NULL DEFAULT '',
                    ext2 TEXT NOT NULL DEFAULT '',
                    ext3 TEXT NOT NULL DEFAULT '',
                    ext4 TEXT NOT NULL DEFAULT '',
                    ext5 TEXT NOT NULL DEFAULT '',
                    ext6 TEXT NOT NULL DEFAULT '',  -- 扩展字段6
                    ext7 TEXT NOT NULL DEFAULT '',  -- 扩展字段7
                    ext8 TEXT NOT NULL DEFAULT '',  -- 扩展字段8
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
}