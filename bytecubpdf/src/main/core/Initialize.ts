//全局初始化
import ConfigService from '../services/ConfigService';
import { sqliteDBInit } from './SqliteDBInit';
import { app } from 'electron';
import path from 'path';
import { mkdirSync } from 'fs';
import { existsSync } from 'fs';
import BuildPath from '@/main/core/BuildPath';
import {warmup} from '@/main/core/assets';
const configService = new ConfigService();
export async function initialize() {
  let storagePath = configService.getFileStoragePath();
  if (!storagePath) {
    const defaultStoragePath = BuildPath.getRootPath();
    // 这里 defaultStoragePath 是一个目录路径，用于存储数据
    if (!existsSync(defaultStoragePath)) {
        mkdirSync(defaultStoragePath, { recursive: true });
    }
    configService.saveFileStoragePath(defaultStoragePath);
    storagePath = defaultStoragePath;
  }
   await sqliteDBInit.initTables();
   await warmup();
}
