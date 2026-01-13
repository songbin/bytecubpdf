//全局初始化
import ConfigService from '../services/ConfigService';
import { sqliteDBInit } from './SqliteDBInit';
import { app } from 'electron';
import path from 'path';
import { FileDownloadItem } from '@/shared/constants/dfconstants';
import { mkdirSync } from 'fs';
import { existsSync } from 'fs';
import BuildPath from '@/main/core/BuildPath';
import {warmup,verifyFileDownloads} from '@/main/core/assets';

/**
 * 应用初始化函数（优化版）
 * 采用分阶段初始化策略，快速显示窗口，延迟非关键任务
 */
export async function initialize() {
  const overallStartTime = Date.now();
  console.log('🚀 [启动优化] 开始应用初始化...');

  // ===== 阶段1：路径准备（必须同步完成）=====
  const configService = new ConfigService();
  let storagePath = configService.getFileStoragePath();
  if (!storagePath) {
    const defaultStoragePath = BuildPath.getRootPath();
    if (!existsSync(defaultStoragePath)) {
      mkdirSync(defaultStoragePath, { recursive: true });
    }
    configService.saveFileStoragePath(defaultStoragePath);
    storagePath = defaultStoragePath;
  }

  // ===== 阶段2：关键表初始化（阻塞等待，但很快）=====
  try {
    const startTime = Date.now();
    await sqliteDBInit.initCriticalTables();
    const elapsed = Date.now() - startTime;
    console.log(`✅ [启动优化] 阶段1完成 - 关键表初始化 (${elapsed}ms)`);
  } catch (error) {
    console.error('❌ [启动优化] 关键表初始化失败:', error);
    throw error;
  }

  // ===== 阶段3：非关键表异步初始化（不阻塞窗口显示）=====
  // 延迟500ms后执行，让窗口先显示
  setTimeout(async () => {
    try {
      const startTime = Date.now();
      console.log('🚀 [启动优化] 开始阶段2 - 非关键表初始化...');

      await sqliteDBInit.initSecondaryTables();

      const elapsed = Date.now() - startTime;
      console.log(`✅ [启动优化] 阶段2完成 - 非关键表初始化 (${elapsed}ms)`);
    } catch (error) {
      console.error('❌ [启动优化] 非关键表初始化失败（不影响核心功能）:', error);
    }
  }, 500);

  // ===== 阶段4：数据初始化（进一步延迟）=====
  // 延迟1500ms后执行，在用户已经看到窗口后
  setTimeout(async () => {
    try {
      const startTime = Date.now();
      console.log('🚀 [启动优化] 开始阶段3 - 数据初始化...');

      await sqliteDBInit.initDataOnly();

      const elapsed = Date.now() - startTime;
      console.log(`✅ [启动优化] 阶段3完成 - 数据初始化 (${elapsed}ms)`);
    } catch (error) {
      console.error('❌ [启动优化] 数据初始化失败（不影响核心功能）:', error);
    }
  }, 1500);

  // ===== 注释掉的资源预加载（暂不启用）=====
  // await warmup();
  // const failedFiles :FileDownloadItem[] = await verifyFileDownloads();
  // if (failedFiles.length > 0) {
  //   console.error('以下文件校验失败:', failedFiles);
  // } else {
  //   console.log('所有文件校验通过');
  // }

  const totalElapsed = Date.now() - overallStartTime;
  console.log(`🎉 [启动优化] 初始化函数返回，窗口可以显示了 (${totalElapsed}ms)`);
}
