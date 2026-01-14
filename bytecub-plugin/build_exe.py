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
        '--add-data=.env;.',  # 添加配置文件
        '--additional-hooks-dir=hooks',  # 使用自定义 hooks 目录
        '--exclude-module=PyQt5',  # 排除可能引起冲突的模块
        '--exclude-module=tkinter',  # 排除Tkinter避免Tcl/Tk打包问题
        '--exclude-module=IPython',
        '--exclude-module=jupyter',
        '--exclude-module=notebook',
        '--exclude-module=torch.testing',  # 排除 torch 测试模块，避免递归
        '--exclude-module=torch._C._distributed',  # 排除分布式相关模块
    ]
    
    # 必要的隐藏导入 - 仅添加PyInstaller无法自动检测的动态导入模块
    hidden_imports = [
        'torchvision',
        'pikepdf._cpphelpers',
        'rapidocr_onnxruntime',
        'skimage.metrics._structural_similarity',
        'azure.ai.translation.text',
        'gradio_pdf',
        'modelscope',
        'huggingface_hub',
        'xinference_client',
        'xsdata',
        'pyzstd',
        'sse_starlette',
        'charset_normalizer',
        'matplotlib',
        'matplotlib.pyplot',
        'matplotlib.backends.backend_agg',
    ]
    
    # 添加所有必需的包作为hidden-imports
    for pkg in hidden_imports:
        options.append(f'--hidden-import={pkg}')
    
    # 执行打包
    PyInstaller.__main__.run([entry_script] + options)

if __name__ == "__main__":
    build_executable()