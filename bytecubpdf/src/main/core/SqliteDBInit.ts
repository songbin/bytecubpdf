import { app } from 'electron';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs'; // 静态导入 fs
import BuildPath from './BuildPath';
import { initSysDictTable, createSysDictTable } from './dbtable/SysDict';
import { createChatMessageHistoryTable } from './dbtable/ChatMessageHistory';
import { createChatHistoryTable } from './dbtable/ChatHistory';
import { createFileStoreTable } from './dbtable/FileStore';
import { createLlmPlatforms, initLlmPlatforms } from './dbtable/LlmPlatforms';
import { createLlmModelsTable, initLlmModels, alterLlmModels ,alterLlmModelsData} from './dbtable/LlmModels';
import { createTranslateHistory } from './dbtable/TranslateHistory';
import { createTranslateTerms } from './dbtable/TranslateTerms';
import {AssistantInitData,createAssistantTable} from './dbtable/Assistant'

export class SqliteDBInit {
    private static instance: SqliteDBInit;
    private dbPath: string = '';
    private db: Database | null = null; // 明确类型

    private constructor() { }

    public static getInstance(): SqliteDBInit {
        if (!SqliteDBInit.instance) {
            SqliteDBInit.instance = new SqliteDBInit();
        }
        return SqliteDBInit.instance;
    }
    public async initTables(): Promise<void> {
        this.dbPath = BuildPath.getDbPath();
        try {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });
            console.log(`数据库初始化准备: ${this.dbPath}`);
            await this.createTable()

            //变更表结构
            await this.alterTable()
            //变更表数据
            await this.alterTableData()
            // 新增初始化数据
            await this.initData();
        } catch (err) {
            throw new Error(`数据库初始化失败: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    private async createTable(): Promise<void> {
        if (!this.db) return;
        await createChatMessageHistoryTable(this.db)
        await createChatHistoryTable(this.db)
        await createFileStoreTable(this.db)
        await createSysDictTable(this.db)
        await createLlmPlatforms(this.db)
        await createLlmModelsTable(this.db)
        await createTranslateHistory(this.db)
        await createTranslateTerms(this.db)
        await createAssistantTable(this.db)

    }
    private async alterTable(): Promise<void> {
        if (!this.db) return;
        await alterLlmModels(this.db)
    }
     private async alterTableData(): Promise<void> {
        if (!this.db) return;
        await alterLlmModelsData(this.db)

    }
    private async initData(): Promise<void> {
        if (!this.db) return;

        try {
            await initSysDictTable(this.db)
            await initLlmPlatforms(this.db)
            await initLlmModels(this.db)
            await AssistantInitData(this.db)
            console.log('数据库初始化数据完成');
        } catch (err) {
            console.error('数据库初始化数据失败:', err);
            throw err;
        }
    }



    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

export const sqliteDBInit = SqliteDBInit.getInstance();