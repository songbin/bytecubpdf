# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[('.env', '.')],
    hiddenimports=['torchvision', 'pikepdf._cpphelpers', 'rapidocr_onnxruntime', 'skimage.metrics._structural_similarity', 'azure.ai.translation.text', 'gradio_pdf', 'modelscope', 'huggingface_hub', 'xinference_client', 'xsdata', 'pyzstd', 'sse_starlette', 'charset_normalizer', 'matplotlib', 'matplotlib.pyplot', 'matplotlib.backends.backend_agg'],
    hookspath=['hooks'],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['PyQt5', 'tkinter', 'IPython', 'jupyter', 'notebook', 'torch.testing', 'torch._C._distributed'],
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
    name='bytecubplugin',
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
