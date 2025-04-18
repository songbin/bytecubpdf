# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['torchvision', 'pikepdf._cpphelpers', 'rapidocr_onnxruntime', 'argostranslate', 'azure.ai.translation.text', 'bitstring', 'configargparse', 'deepl', 'doclayout_yolo', 'flask', 'flask_cors', 'fonttools', 'freetype', 'gevent', 'gradio', 'gradio_pdf', 'huggingface_hub', 'httpx', 'modelscope', 'msgpack', 'numpy', 'ollama', 'onnx', 'onnxruntime', 'openai', 'opencv_python_headless', 'opencv_python', 'orjson', 'peewee', 'pikepdf', 'pymupdf', 'python_dotenv', 'python_levenshtein', 'pdfminer.six', 'pydantic', 'requests', 'rich', 'scikit_image', 'tenacity', 'tencentcloud_sdk_python', 'toml', 'torch', 'torchvision', 'tqdm', 'werkzeug', 'xsdata', 'xinference_client', 'rapidocr_onnxruntime'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='docfableplugin',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
