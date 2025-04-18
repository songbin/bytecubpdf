import os
import shutil
import subprocess
import sys
import fontTools

def clean_previous_build():
    """清理上次打包生成的文件"""
    build_dir = "docfableplugin.build"
    dist_dir = "dist"
    for path in [build_dir, dist_dir]:
        if os.path.exists(path):
            shutil.rmtree(path, ignore_errors=True)
            print(f"已删除: {path}")

def build_executable():
    clean_previous_build()
    entry_script = "main.py"
    output_dir = "dist"
    exe_name = "docfableplugin"
    
    # 获取 fonttools 的实际安装路径
    fonttools_dir = os.path.dirname(fontTools.__file__)
    
    options = [
        "--standalone",
        "--onefile",
        f"--output-dir={output_dir}",
        f"--output-filename={exe_name}",
        "--remove-output",
        "--enable-plugin=multiprocessing",
        "--windows-console-mode=attach",
        "--show-progress",
        "--verbose",
        f"--include-data-dir={fonttools_dir}=fontTools",
        "--nofollow-import-to=gradio._frontend_code",
        "--follow-import-to=!gradio._frontend_code",
        "--disable-ccache",
        "--include-package-data=torch",
        "--include-package-data=torchvision",
        "--include-module=pikepdf._cpphelpers",
        "--include-module=rapidocr_onnxruntime",
        "--enable-plugin=upx",
        "--include-package=fontTools",
        "--include-module=cv2",
    ]

    required_packages = [
        'argostranslate',
        'azure.ai.translation.text',
        'bitstring',
        'configargparse',
        'deepl',
        'doclayout_yolo',
        'flask',
        'flask_cors',
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
        'orjson',
        'peewee',
        'pikepdf',
        'pymupdf',
        'dotenv',
        'Levenshtein',
        'pdfminer',  # 修正后的模块名（原 pdfminer.six）
        'pydantic',
        'requests',
        'rich',
        'scikit_image',
        'tenacity',
        'tencentcloud_sdk_python',
        'toml',
        'torch',
        'torchvision',
        'tqdm',
        'werkzeug',
        'xsdata',
        'xinference_client',
        'cv2',
    ]
    
    for pkg in required_packages:
        options.append(f"--include-package={pkg}")
    
    options.append(entry_script)
    
    try:
        # 打印调试信息
        print(f"Using Python: {sys.executable}")
        print(f"FontTools path: {fonttools_dir}")
        
        subprocess.run(
            [sys.executable, "-m", "nuitka"] + options,
            check=True,
            stdout=sys.stdout,
            stderr=sys.stderr,
            encoding='utf-8'
        )
    except subprocess.CalledProcessError as e:
        print(f"打包失败，错误信息: {e}")
    else:
        print("打包成功！生成文件在 dist 目录")

if __name__ == "__main__":
    build_executable()