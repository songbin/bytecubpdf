import fs from 'fs/promises';
import { mkdirSync } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { sha3_256 } from 'js-sha3';
import { FileDownloadItem,DownloadProgress } from '@/shared/constants/dfconstants';
import axios from 'axios';
import BuildPath from './BuildPath';
import {
  DOCLAYOUT_YOLO_DOCSTRUCTBENCH_IMGSZ1024ONNX_SHA3_256,
  TABLE_DETECTION_RAPIDOCR_MODEL_SHA3_256,
  FONT_METADATA_URL,
  FONT_URL_BY_UPSTREAM,
  DOC_LAYOUT_ONNX_MODEL_URL,
  TABLE_DETECTION_RAPIDOCR_MODEL_URL,
  TABLE_DETECTION_RAPIDOCR_MODEL_REC_URL,
  TABLE_DETECTION_RAPIDOCR_MODEL_CLS_URL,
  EMBEDDING_FONT_METADATA,
  TABLE_DETECTION_RAPIDOCR_CLS_MODEL_SHA3_256,
  TABLE_DETECTION_RAPIDOCR_REC_MODEL_SHA3_256,
  getFontFamily
} from './embedding_assets_metadata';

const logger = console;

// 获取缓存文件路径
function getCacheFilePath(fileName: string, type: 'fonts' | 'models' | 'assets' | 'tiktoken') {
  let targetDir = '';
  if (type === 'fonts') {
    targetDir =  path.join(BuildPath.getFontDownDir(), fileName);
  }else if (type === 'models') {
    targetDir =   path.join(BuildPath.getModelDownDir(), fileName);
  }else{
    console.error('无效的下载类型', type, 'fileName', fileName);
    throw new Error('无效的类型');
  }
  
  mkdirSync(targetDir, { recursive: true });
  return path.join(targetDir, fileName);
}

// 验证文件哈希
async function verifyFile(filePath: string, sha3_256_str: string | null): Promise<boolean> {
  if (!sha3_256_str) return true;
  
  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);
    const hash = sha3_256(fileBuffer); 
    // const hash = crypto.createHash('sha3-256').update(fileBuffer).digest('hex');
    return hash === sha3_256_str;
  } catch (error) {
    return false;
  }
}

// 下载文件
async function  downloadFile(
  url: string,
  filePath: string,
  sha3_256_str: string,
  name: string,
  type: 'font' | 'models',
  progressCallback?: (p: DownloadProgress) => void
): Promise<void> {
  const response = await axios.get(url, {
    responseType: 'stream',
  });

  const writer = createWriteStream(filePath);
  const totalSize = Number(response.headers['content-length']) || 0;
  let receivedSize = 0;
  let startTime = Date.now();
  let lastUpdate = 0;

  response.data.on('data', (chunk: Buffer) => {
    receivedSize += chunk.length;
    const currentTime = Date.now();
    
    // 计算进度
    const progress = Math.round((receivedSize / totalSize) * 100);
    
    // 计算下载速度 (字节/秒)
    const elapsed = (currentTime - startTime) / 1000;
    const speed = elapsed > 0 ? receivedSize / elapsed : 0;
    
    // 计算剩余时间 (秒)
    const remainingBytes = totalSize - receivedSize;
    const eta = speed > 0 ? remainingBytes / speed : 0;
    
    // 限制更新频率 (至少100ms更新一次)
    if (currentTime - lastUpdate > 100 || progress === 100) {
      progressCallback?.({
        progress,
        speed,
        eta,
        name,
        type,
        status: 'downloading'
      });
      lastUpdate = currentTime;
    }
  });

  response.data.on('end', () => {
    progressCallback?.({
      progress: 99,
      speed: 0,
      eta: 0,
      name,
      type,
      status: 'completed'
    });
  });

  response.data.on('error', (err: Error) => {
    progressCallback?.({
      progress: Math.round((receivedSize / totalSize) * 100),
      speed: 0,
      eta: 0,
      name,
      type,
      status: 'failed'
    });
    // ... existing error handling ...
  });
  
  // 保持原有管道传输
  response.data.pipe(writer);

  // 完成处理
  await new Promise((resolve, reject) => {
    writer.on('finish', () => {
      // 修改所有progressCallback调用为DownloadProgress结构体
      progressCallback?.({
        progress: 100,
        speed: 0,
        eta: 0,
        name,
        type,
        status: 'completed'
      });
      
      // 在downloadFile回调中保持统一适配
      (progress: DownloadProgress) => {
        if (progressCallback) {
          progressCallback(progress);
        }
      }
      resolve(true);
    });
    writer.on('error', reject);
  });
  
  // 其他函数中的progressCallback调用已统一适配
  // 例如：
  // progressCallback?.({percentage: progress.percentage});

  // 校验逻辑保持不变
  const fileBuffer = await fs.readFile(filePath);
  const hash = sha3_256(fileBuffer);
  if (hash !== sha3_256_str) {
    fs.unlink(filePath);
    throw new Error('文件校验失败');
  }
}

// 获取模型路径
// RapidOCR模型路径获取
async function getRapidOCRDetModelPath(progressCallback?: (p: DownloadProgress) => void): Promise<string> {
  const modelPath = getCacheFilePath('rapidocr_det.onnx', 'models');
  
  if (await verifyFile(modelPath, TABLE_DETECTION_RAPIDOCR_MODEL_SHA3_256)) {
    return modelPath;
  }

  const upstreams = Object.keys(TABLE_DETECTION_RAPIDOCR_MODEL_URL);
  let lastError: Error | null = null;
  
  for (const upstream of upstreams) {
    try {
      const url = TABLE_DETECTION_RAPIDOCR_MODEL_URL[upstream];
      logger.info(`尝试从 ${upstream} 下载检测模型...`);
      await downloadFile(url, modelPath, TABLE_DETECTION_RAPIDOCR_MODEL_SHA3_256, 'rapidocr_det.onnx', 'models', (progress: DownloadProgress) => {
        if (progressCallback) {
          progressCallback(progress);
        }
      });
      logger.info(`${upstream} 下载成功`);
      return modelPath;
    } catch (error) {
      logger.warn(`${upstream} 下载失败: ${(error as Error).message}`);
      lastError = error as Error | null;
      await fs.unlink(modelPath).catch(() => {});
    }
  }
  
  throw new Error(`[检测模型] 所有上游下载失败: ${lastError?.message}`);
}

async function getRapidOCRRecModelPath(progressCallback?: (p: DownloadProgress) => void): Promise<string> {
  const modelPath = getCacheFilePath('rapidocr_rec.onnx', 'models');
  
  if (await verifyFile(modelPath, TABLE_DETECTION_RAPIDOCR_REC_MODEL_SHA3_256)) {
    return modelPath;
  }

  const upstreams = Object.keys(TABLE_DETECTION_RAPIDOCR_MODEL_REC_URL);
  let lastError: Error | null = null;
  
  for (const upstream of upstreams) {
    try {
      const url = TABLE_DETECTION_RAPIDOCR_MODEL_REC_URL[upstream];
      logger.info(`尝试从 ${upstream} 下载识别模型 ${url}...`);
      await downloadFile(url, modelPath, TABLE_DETECTION_RAPIDOCR_REC_MODEL_SHA3_256, 'rapidocr_rec.onnx', 'models', (progress: DownloadProgress) => {
        if (progressCallback) {
          progressCallback(progress);
        }
      });
      logger.info(`${upstream} 下载成功`);
      return modelPath;
    } catch (error) {
      logger.warn(`${upstream} 下载失败: ${(error as Error).message}`);
      lastError = error as Error | null;
      await fs.unlink(modelPath).catch(() => {});
    }
  }
  
  throw new Error(`[识别模型] 所有上游下载失败: ${lastError?.message}`);
  return modelPath;
}

async function getRapidOCRClsModelPath(progressCallback?: (p: DownloadProgress) => void): Promise<string> {
  const modelPath = getCacheFilePath('rapidocr_cls.onnx', 'models');
  
  if (await verifyFile(modelPath, TABLE_DETECTION_RAPIDOCR_CLS_MODEL_SHA3_256)) {
    return modelPath;
  }

  const upstreams = Object.keys(TABLE_DETECTION_RAPIDOCR_MODEL_CLS_URL);
  let lastError: Error | null = null;
  
  for (const upstream of upstreams) {
    try {
      const url = TABLE_DETECTION_RAPIDOCR_MODEL_CLS_URL[upstream];
      logger.info(`尝试从 ${upstream} 下载分类模型 ${url}...`);
      await downloadFile(url, modelPath, TABLE_DETECTION_RAPIDOCR_CLS_MODEL_SHA3_256, 'rapidocr_cls.onnx', 'models', (progress: DownloadProgress) => {
        if (progressCallback) {
          progressCallback(progress);
        }
      });
      logger.info(`${upstream} 下载成功`);
      return modelPath;
    } catch (error) {
      logger.warn(`${upstream} 下载失败: ${(error as Error).message}`);
      lastError = error as Error | null;
      await fs.unlink(modelPath).catch(() => {});
    }
  }
  
  throw new Error(`[分类模型] 所有上游下载失败: ${lastError?.message}`);
  return modelPath;
}

async function getDoclayoutOnnxModelPath(progressCallback?: (p: DownloadProgress) => void): Promise<string> {
  const onnxPath = getCacheFilePath('doclayout_yolo_docstructbench_imgsz1024.onnx', 'models');
  
  if (await verifyFile(onnxPath, DOCLAYOUT_YOLO_DOCSTRUCTBENCH_IMGSZ1024ONNX_SHA3_256)) {
    return onnxPath;
  }

  const upstreams = Object.keys(DOC_LAYOUT_ONNX_MODEL_URL) as Array<keyof typeof DOC_LAYOUT_ONNX_MODEL_URL>;
  let lastError: Error | null = null;

  for (const upstream of upstreams) {
    try {
      const url = DOC_LAYOUT_ONNX_MODEL_URL[upstream];
      logger.info(`尝试从 ${upstream} 下载文档布局模型 ${url}...`);
      await downloadFile(url, onnxPath, DOCLAYOUT_YOLO_DOCSTRUCTBENCH_IMGSZ1024ONNX_SHA3_256, 'doclayout_yolo_docstructbench_imgsz1024.onnx', 'models', (progress: DownloadProgress) => {
        if (progressCallback) {
          progressCallback(progress);
        }
      });
      logger.info(`${upstream} 下载成功`);
      return onnxPath;
    } catch (error) {
      logger.warn(`${upstream} 下载失败: ${(error as Error).message}`);
      lastError = error as Error | null;
      await fs.unlink(onnxPath).catch(() => {});
    }
  }
  
  throw new AggregateError([lastError], '所有上游下载失败');
}

// 获取字体和元数据
async function getFontAndMetadata(fontFileName: string,progressCallback?: (p: DownloadProgress) => void): Promise<{ path: string; metadata: any }> {
  const cacheFilePath = getCacheFilePath(fontFileName, 'fonts');
  
  if (EMBEDDING_FONT_METADATA[fontFileName] && 
      await verifyFile(cacheFilePath, EMBEDDING_FONT_METADATA[fontFileName].sha3_256)) {
    return {
      path: cacheFilePath,
      metadata: EMBEDDING_FONT_METADATA[fontFileName]
    };
  }

  logger.info(`下载字体${fontFileName} ...`);
  const fastestUpstream = 'modelscope';
  const url = FONT_URL_BY_UPSTREAM[fastestUpstream](fontFileName);
  console.log('下载字体地址是:', url);
  await downloadFile(url, cacheFilePath, EMBEDDING_FONT_METADATA[fontFileName].sha3_256, fontFileName, 'font', (progress: DownloadProgress) => {
    if (progressCallback) {
      // 假设DownloadProgress对象包含percentage属性
      progressCallback(progress);
    }
  });
  return {
    path: cacheFilePath,
    metadata: EMBEDDING_FONT_METADATA[fontFileName]
  };
}

// 下载所有资源
async function downloadAllResources() {
  logger.info('开始下载全部资源...');
  
  const downloadTasks = [
    // 文档布局模型
    getDoclayoutOnnxModelPath(),
    
    // RapidOCR检测模型
    getRapidOCRDetModelPath(),
    
    // RapidOCR识别模型
    getRapidOCRRecModelPath(),
    
    // RapidOCR分类模型
    getRapidOCRClsModelPath(),
    
    // // 下载所有字体
    ...Object.keys(EMBEDDING_FONT_METADATA).map(fontFileName =>
      getFontAndMetadata(fontFileName)
        .catch(err => logger.error(`字体${fontFileName}下载失败:`, err))
    ),
  ];

  const results = await Promise.allSettled(downloadTasks);
  
  const errors = results
    .filter(result => result.status === 'rejected')
    .map(result => (result as PromiseRejectedResult).reason);

  if (errors.length > 0) {
    throw new AggregateError(errors, `${errors.length}个资源下载失败`);
  }
  
  logger.info('全部资源下载完成');
}

// 初始化资源（兼容旧版本）
async function warmup() {
  return downloadAllResources();
}

 
export const waitDownFontList: FileDownloadItem[] = Object.keys(EMBEDDING_FONT_METADATA).map(fontFileName => {
  
  return {
    name: fontFileName,
    expectedSha: EMBEDDING_FONT_METADATA[fontFileName].sha3_256,
    type: 'font'
  };
});
export const waitDownModelFileList: FileDownloadItem[] = [
 
  {
    name: 'rapidocr_det.onnx',
    expectedSha: TABLE_DETECTION_RAPIDOCR_MODEL_SHA3_256,
    type: 'models'
  },
  {
    name: 'rapidocr_rec.onnx',
    expectedSha: TABLE_DETECTION_RAPIDOCR_REC_MODEL_SHA3_256,
    type: 'models'
  },
  {
    name: 'rapidocr_cls.onnx',
    expectedSha: TABLE_DETECTION_RAPIDOCR_CLS_MODEL_SHA3_256,
    type: 'models'
  },
  {
    name: 'doclayout_yolo_docstructbench_imgsz1024.onnx',
    expectedSha: DOCLAYOUT_YOLO_DOCSTRUCTBENCH_IMGSZ1024ONNX_SHA3_256,
    type: 'models'
  }
];
export async function downloadTargetFile(target:FileDownloadItem,progressCallback?: (progress: DownloadProgress) => void) {
  try {
    if(target.type === 'font'){
      const fontInfo = await getFontAndMetadata(target.name,progressCallback);
      return fontInfo.path;
    }else if(target.type === 'models'){
      if(target.name === 'rapidocr_det.onnx'){
        return await getRapidOCRDetModelPath(progressCallback);
      }else if(target.name === 'rapidocr_rec.onnx'){
        return await getRapidOCRRecModelPath(progressCallback);
      }else if(target.name === 'rapidocr_cls.onnx'){
        return await getRapidOCRClsModelPath(progressCallback);
      }else if(target.name === 'doclayout_yolo_docstructbench_imgsz1024.onnx'){
        return await getDoclayoutOnnxModelPath(progressCallback);
      }
    }
     
  }catch (error) {
    console.error('下载文件失败:', error);
    progressCallback?.({
      progress: 0,
      speed: 0,
      eta: 0,
      name:target.name,
      type:target.type,
      status: 'failed'
    });
  }
  return '';
}
export async function verifyFileDownloads(): Promise<FileDownloadItem[]> {
  const waitDownFileList = [...waitDownModelFileList, ...waitDownFontList ];
  const fileList: FileDownloadItem[] = waitDownFileList;
  console.log('正在验证文件列表：', fileList.map(f => f.name));

  const failedFiles = [];
  
  for (const item of fileList) {
    try {
      let path = getCacheFilePath(item.name, 'models');
      if(item.name.startsWith('fonts')){
        path = getCacheFilePath(item.name,'fonts');
      }
      // 检查文件是否存在
      await fs.access(path);
      
      // 计算文件SHA256
      const fileBuffer = await fs.readFile(path);
      const hash = sha3_256(fileBuffer); 
      
      if (hash !== item.expectedSha.toLowerCase()) {
        failedFiles.push(item);
      }
    } catch (error) {
      failedFiles.push(item);
    }
  }
  
  return failedFiles;
}
export {
  getCacheFilePath,
  verifyFile,
  downloadFile,
  getDoclayoutOnnxModelPath,
  getRapidOCRDetModelPath,
  getRapidOCRRecModelPath,
  getRapidOCRClsModelPath,
  getFontAndMetadata,
  warmup,
  downloadAllResources,
  getFontFamily
};

