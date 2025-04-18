import os
import shutil
import PyInstaller.__main__

def clean_previous_build():
    """清理上次打包生成的文件"""
    build_dir = "build"
    dist_dir = "dist"
    spec_file = "bytecubplugin.spec"
    
    for path in [build_dir, dist_dir, spec_file]:
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
            print(f"已删除: {path}")

def build_executable():
    # 清理上次打包文件
    clean_previous_build()
    
    # 主程序入口文件路径
    entry_script = "main.py"
    
    # 输出目录
    output_dir = os.path.join("dist")
    
    # 打包选项
    options = [
        '--onefile',
        '--name=bytecubplugin',
        f'--distpath={output_dir}',
        '--hidden-import=torchvision',
        '--hidden-import=pikepdf._cpphelpers',
        '--hidden-import=rapidocr_onnxruntime'
        '--exclude-module=PyQt5',  # 排除可能引起冲突的模块
    ]
    
    # 从requirements.txt中提取所有必需的包
    required_packages = [
        'scikit_image',
        'skimage.metrics',  # 显式添加metrics子模块
        'skimage.metrics._structural_similarity',
        'cryptography',
        'argostranslate',
        'azure.ai.translation.text',
        'bitstring',
        'configargparse',
        'deepl',
        'doclayout_yolo',
        'flask',
        'flask_cors',
        'fonttools',
        'freetype',
        'gevent',
        'gradio',
        'gradio_pdf',
        'huggingface_hub',
        'httpx',
        'modelscope',
        'msgpack',
        'numpy',
        'ollama',
        'onnx',
        'onnxruntime',
        'openai',
        'opencv_python_headless',
        'opencv_python',
        'orjson',
        'peewee',
        'pikepdf',
        'pymupdf',
        'python_dotenv',
        'python_levenshtein',
        'pdfminer.six',
        'pydantic',
        'requests',
        'rich',
        'scikit_image',
        'tenacity',
        'tencentcloud_sdk_python',
        # 'tiktoken',
        'toml',
        'torch',
        'torchvision',
        'tqdm',
        'werkzeug',
        'xsdata',
        'xinference_client',
        'rapidocr_onnxruntime'
    ]
    
    # 添加所有必需的包作为hidden-imports
    for pkg in required_packages:
        options.append(f'--hidden-import={pkg}')
    
    # 执行打包
    PyInstaller.__main__.run([entry_script] + options)

if __name__ == "__main__":
    build_executable()