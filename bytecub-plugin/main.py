import os
import sys
import io
import socket
import subprocess
from pdf2zh.doclayout import ModelInstance, OnnxModel
from utils import chatlog
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
from config.ts_constants import TSConstants
from babeldoc.const import CACHE_FOLDER
from babeldoc.const import set_cache_folder
from babeldoc.assets.assets import get_table_detection_rapidocr_model_path, get_table_detection_rapidocr_model_rec_path, get_table_detection_rapidocr_model_cls_path
from contextlib import asynccontextmanager
from pathlib import Path
import asyncio
from babeldoc.docvision.doclayout import DocLayoutModel
from services.config_dir import ConfigDir
from utils.chatlog import logger
import argparse
import importlib
import uvicorn
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

# ================ 全局变量定义 ================
# 用于在 lifespan 中传递命令行参数
global_basedir = '.'


# ================ Lifespan 上下文管理器 ================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("启动异步模型加载...")
    try:
        # 初始化配置目录
        ConfigDir.init(base_dir=global_basedir)
        
        # 并发获取路径
        # cls_path_task = asyncio.to_thread(get_table_detection_rapidocr_model_cls_path)
        # rec_path_task = asyncio.to_thread(get_table_detection_rapidocr_model_rec_path)
        # cls_path, rec_path = await asyncio.gather(cls_path_task, rec_path_task)
        # logger.info(f"模型路径: CLS={cls_path}, REC={rec_path}")
        
        # 并发加载模型
        # doc_layout_task = asyncio.to_thread(DocLayoutModel.load_available)
        # onnx_model_task = asyncio.to_thread(OnnxModel.load_available)
        # doc_layout_model, onnx_model = await asyncio.gather(doc_layout_task, onnx_model_task)
        
        # 设置全局模型实例
        # ModelInstance.value = onnx_model
        # logger.info("模型加载完成")
    except Exception as e:
        logger.error(f"模型初始化失败: {e}", exc_info=True)
        raise
    
    yield  # 应用运行期间
    
    # 可选的关闭清理逻辑
    logger.info("正在关闭应用...")


# ================ FastAPI 实例创建 ================
app = FastAPI(
    title="DocFable API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan  # 使用新的生命周期管理器
)


# ================ 中间件配置 ================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ================ 动态路由注册 ================
# 手动注册控制器路由


# 添加其他控制器的显式导入和注册
# from controller.OtherController import OtherController
# other_controller = OtherController()
# app.include_router(other_controller.router)


# ================ 命令行参数解析 ================
def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='启动PDF处理服务')
    parser.add_argument('--basedir', type=str, default='.', 
                       help='基础目录路径，默认为当前目录')
    # 允许未知参数
    args, unknown = parser.parse_known_args()
    return args


# ================ 主程序入口 ================
if __name__ == "__main__":
    # 解析命令行参数
    args = parse_args()
    
    # 设置全局变量
    global_basedir = args.basedir
    
    # 设置环境变量
    os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
    
    # 配置日志
    logger.info("开始启动服务...")
    
    # 创建 FastAPI 实例
    app = FastAPI(
        title="DocFable API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )
    
    # 添加中间件（必须在创建 app 后立即添加）
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    # 动态注册路由（必须在创建 app 后执行）
    # controller_dir = Path(os.getcwd()) / "controller"
    # logger.info(f'#############{controller_dir}')
    
    # for file in controller_dir.glob("*.py"):
    #     if file.name == "__init__.py":
    #         continue
        
    #     module_name = f"controller.{file.stem}"
    #     module = importlib.import_module(module_name)
        
    #     for attr in dir(module):
    #         cls = getattr(module, attr)
    #         if hasattr(cls, 'router') and isinstance(cls().router, APIRouter):
    #             app.include_router(cls().router)
    from controller.PdfController import PdfController

    pdf_controller = PdfController()
    app.include_router(pdf_controller.router)
    # 启动服务
    try:
        uvicorn.run(
            app,
            host='0.0.0.0',
            port=8089,
            reload=False,
            access_log=False
        )
    except Exception as e:
        logger.error(f"服务启动失败: {str(e)}", exc_info=True)
        sys.exit(1)