export async function createTranslateTerms(db:any){
               //创建翻译术语表
            await db.exec(`
                CREATE TABLE IF NOT EXISTS translate_terms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sourceTerm TEXT NOT NULL DEFAULT '',
                    translatedTerm TEXT NOT NULL DEFAULT '',
                    ext1 TEXT NOT NULL DEFAULT '',
                    ext2 TEXT NOT NULL DEFAULT '',
                    ext3 TEXT NOT NULL DEFAULT '',
                    ext4 TEXT NOT NULL DEFAULT '',
                    ext5 TEXT NOT NULL DEFAULT '',
                    ext6 TEXT NOT NULL DEFAULT '',
                    ext7 TEXT NOT NULL DEFAULT '',
                    ext8 TEXT NOT NULL DEFAULT '',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
          

            await db.exec(`
                CREATE TRIGGER IF NOT EXISTS update_term_timestamp 
                AFTER UPDATE ON translate_terms 
                BEGIN
                    UPDATE translate_terms SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
                END
            `); 
}