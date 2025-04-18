import os
import sys
import io
import socket
import subprocess
from pdf2zh.doclayout import ModelInstance, OnnxModel
from utils import chatlog
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
from app import app
from config.ts_constants import TSConstants
from babeldoc.const import CACHE_FOLDER
from babeldoc.const import set_cache_folder
from pathlib import Path
import asyncio
from babeldoc.docvision.doclayout import DocLayoutModel
from services.config_dir import ConfigDir
from utils.chatlog import logger
import argparse
from flask import Flask, request, signals
def terminate_process(pid):
    """跨平台终止进程"""
    try:
        if os.name == 'nt':
            subprocess.run(['taskkill', '/F', '/PID', str(pid)], check=True)
        else:
            subprocess.run(['kill', '-9', str(pid)], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"终止失败: {e}")
        return False
    except Exception as e:
        print(f"未知错误: {e}")
        return False
def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='启动PDF处理服务')
    parser.add_argument('--basedir', type=str, default='.', 
                       help='基础目录路径，默认为当前目录')
    # 允许未知参数
    args, unknown = parser.parse_known_args()
    return args
async def load_model_async(basedir='.'):
    """异步加载模型"""
    try:
        ConfigDir.init(base_dir = basedir)
        await asyncio.to_thread(DocLayoutModel.load_available)
        return await asyncio.to_thread(OnnxModel.load_available)
    except Exception as e:
        print(f"模型加载失败: {e}")
        raise

async def setup_async(basedir='.') -> int:
    """异步初始化"""
    os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
    ModelInstance.value = await load_model_async(basedir)
    return 0
def setup() -> int:
    os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
    return 0
if __name__ == "__main__":
    port = 8089
    args = parse_args()
    # 正常启动服务
    try:
        asyncio.run(setup_async(args.basedir))
        setup()
        app.run(host='0.0.0.0', port=port)
        # print(f"服务启动成功，监听端口: {port}")
    except Exception as e:
        logger.info(f"服务启动失败: {str(e)}")
        sys.exit(1)