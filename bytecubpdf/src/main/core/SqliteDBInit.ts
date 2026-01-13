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
    private initializationStage: 'none' | 'critical' | 'secondary' | 'full' = 'none';

    private constructor() { }

    public static getInstance(): SqliteDBInit {
        if (!SqliteDBInit.instance) {
            SqliteDBInit.instance = new SqliteDBInit();
        }
        return SqliteDBInit.instance;
    }

    /**
     * ✨ 快速初始化关键表（启动阶段1）
     * 只创建首屏必需的表，快速让窗口显示
     * 预计耗时：100-300ms
     */
    public async initCriticalTables(): Promise<void> {
        if (this.initializationStage !== 'none') {
            console.log('✅ 关键表已初始化，跳过');
            return;
        }

        this.dbPath = BuildPath.getDbPath();
        const startTime = Date.now();

        try {
            if (!this.db) {
                this.db = await open({
                    filename: this.dbPath,
                    driver: sqlite3.Database
                });
            }

            console.log(`🚀 [阶段1/3] 初始化关键表...`);

            // 只创建首屏必需的3个表（串行执行，但数量少）
            await createChatMessageHistoryTable(this.db);
            await createChatHistoryTable(this.db);
            await createFileStoreTable(this.db);

            this.initializationStage = 'critical';

            const elapsed = Date.now() - startTime;
            console.log(`✅ [阶段1/3] 关键表初始化完成 (${elapsed}ms)`);
        } catch (err) {
            throw new Error(`关键表初始化失败: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    /**
     * ✨ 延迟初始化非关键表（启动阶段2）
     * 在窗口显示后执行
     * 预计耗时：200-500ms
     */
    public async initSecondaryTables(): Promise<void> {
        if (this.initializationStage === 'secondary' || this.initializationStage === 'full') {
            console.log('✅ 非关键表已初始化，跳过');
            return;
        }

        // 确保关键表已初始化
        if (this.initializationStage === 'none') {
            await this.initCriticalTables();
        }

        const startTime = Date.now();

        try {
            console.log('🚀 [阶段2/3] 创建非关键表...');

            // 创建剩余的表
            await createSysDictTable(this.db);
            await createLlmPlatforms(this.db);
            await createLlmModelsTable(this.db);
            await createTranslateHistory(this.db);
            await createTranslateTerms(this.db);
            await createAssistantTable(this.db);

            // 变更表结构
            await this.alterTable();
            await this.alterTableData();

            this.initializationStage = 'secondary';

            const elapsed = Date.now() - startTime;
            console.log(`✅ [阶段2/3] 非关键表创建完成 (${elapsed}ms)`);
        } catch (err) {
            console.error('❌ 非关键表创建失败:', err);
            throw err;
        }
    }

    /**
     * ✨ 延迟初始化数据（启动阶段3）
     * 在窗口显示后执行
     * 预计耗时：200-800ms
     */
    public async initDataOnly(): Promise<void> {
        // 确保表已创建
        if (this.initializationStage === 'none' || this.initializationStage === 'critical') {
            await this.initSecondaryTables();
        }

        const startTime = Date.now();

        try {
            console.log('🚀 [阶段3/3] 初始化数据...');

            // 初始化配置数据
            await initSysDictTable(this.db);
            await initLlmPlatforms(this.db);
            await initLlmModels(this.db);
            await AssistantInitData(this.db);

            this.initializationStage = 'full';

            const elapsed = Date.now() - startTime;
            console.log(`✅ [阶段3/3] 数据初始化完成 (${elapsed}ms)`);
            console.log(`🎉 数据库完全初始化完成`);
        } catch (err) {
            console.error('❌ 数据初始化失败:', err);
            throw err;
        }
    }

    /**
     * ✨ 获取数据库连接
     */
    public getDatabase(): Database | null {
        return this.db;
    }

    /**
     * ✨ 检查初始化状态
     */
    public getInitializationStage(): string {
        return this.initializationStage;
    }

    // ========== 保留原有方法以兼容现有代码 ==========

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
            this.initializationStage = 'full';
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
            this.initializationStage = 'none';
        }
    }
}

export const sqliteDBInit = SqliteDBInit.getInstance();