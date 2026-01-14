# PyInstaller hook for torch to prevent infinite recursion
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# 收集 torch 的数据文件
datas = collect_data_files('torch', include_py_files=False)

# 排除可能导致递归的子模块
excludedimports = [
    'torch.testing._internal.dist',
    'torch.testing._internal.pytest_worker',
]

# 只收集需要的子模块，而不是所有子模块
# 这可以避免 PyInstaller 进行过度分析
hiddenimports = [
    'torch.nn',
    'torch.optim',
    'torch.utils.data',
]
