import { dictConfig } from '@/main/core/dbconfig/DictConfig';

export async function createSysDictTable(db:any) {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sys_dict (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dict_type TEXT NOT NULL, -- 字典类型
                dict_code TEXT NOT NULL, -- 字典编码
                dict_name TEXT NOT NULL, -- 字典名称
                dict_value TEXT NOT NULL, -- 字典值
                sort_order INTEGER NOT NULL DEFAULT 0, -- 排序序号
                status INTEGER NOT NULL DEFAULT 1, -- 状态(1:启用,0:禁用)
                create_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
                update_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
                remark TEXT NOT NULL DEFAULT '', -- 备注
                ext1 TEXT NOT NULL DEFAULT '',  -- 扩展字段1
                ext2 TEXT NOT NULL DEFAULT '',  -- 扩展字段2
                ext3 TEXT NOT NULL DEFAULT ''   -- 扩展字段3
            )
        `);
        //创建索引，索引有字典类型和字典编码
        await db.exec('CREATE INDEX IF NOT EXISTS idx_sys_dict_dict_type ON sys_dict(dict_type)');
        // 创建唯一索引确保dict_code唯一性
        await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_dict_dict_code ON sys_dict(dict_code)');
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_sys_dict_timestamp 
            AFTER UPDATE ON sys_dict 
            BEGIN
                UPDATE sys_dict SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;
        
        `);
    }
export async function initSysDictTable(db:any){
    await createSysDictTable(db);
    //查询表里key为DictConfig.dbVersionKey的数据行，如果不存在，就写入，值就是dbVersionKey.currentDbVersionValue
     
    const dictRow = await db.get(`SELECT * FROM sys_dict WHERE dict_type = '${dictConfig.dbVersionKey}'`);
    if(!dictRow){
        await db.exec(`INSERT INTO sys_dict (dict_type, dict_code, dict_name, dict_value) VALUES ('${dictConfig.dbVersionKey}', '${dictConfig.dbVersionKey}', '数据库版本', '${dictConfig.currentDbVersionValue}')`);
    }
}