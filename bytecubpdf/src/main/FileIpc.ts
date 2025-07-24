import { ipcMain, BrowserWindow, shell, app } from 'electron'
import fs from 'fs'
import path from 'path'
import  BuildPath  from '@/main/core/BuildPath'

export function FileIpcSetup() {

  //删除指定路径文件，单个文件
  ipcMain.handle('file:delete-file', async (event, filePath: string) => {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  })
 
}