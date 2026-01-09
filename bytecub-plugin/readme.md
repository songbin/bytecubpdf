# Bytecub PDF Plugin

一个全面的PDF处理和翻译工具。

## 安装与设置

本项目使用 [UV](https://github.com/astral-sh/uv) 作为包管理器。UV 是一个极速的 Python 包安装器和解析器。

### 前置条件

1. **Python 版本要求**: 本项目需要 **Python 3.11.x** 版本

2. 安装 UV:

   ```bash
   # 在 Windows 上 (PowerShell)
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   
   # 在 macOS/Linux 上
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. 或者通过 pip 安装:

   ```bash
   pip install uv
   ```

4. **配置中国境内镜像源**（推荐，解决网络超时问题）:

   ```bash
   # 方法一：使用项目自带的 uv.toml 配置（已配置好）
   # 项目已包含 uv.toml 文件，自动使用清华镜像源
   
   # 方法二：环境变量配置（临时使用）
   # Windows (PowerShell)
   $env:UV_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple/"
   $env:UV_EXTRA_INDEX_URL="https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/"
   
   # Linux/macOS
   export UV_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple/"
   export UV_EXTRA_INDEX_URL="https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/"
   ```

### 安装项目依赖

1. 克隆项目后，进入项目目录:

   ```bash
   cd bytecub-plugin
   ```

2. 安装并配置 Python 3.11.x:

   ```bash
   # 使用 UV 安装 Python 3.11.9
   uv python install 3.11.9
   
   # 验证 Python 版本
   uv run python --version
   ```

3. 使用 UV 在 Python 3.11.9 环境中安装依赖:

   ```bash
   # 创建虚拟环境并安装依赖（自动使用 Python 3.11.9）
   uv sync --python 3.11.9
   ```

4. 激活虚拟环境:

   ```bash
   # Windows
   .venv\Scripts\activate
   
   # macOS/Linux
   source .venv/bin/activate
   ```

## 开发

### 安装开发依赖

```bash
uv sync --dev
```

### 代码格式化

```bash
# 使用 ruff 进行代码检查和格式化
uv run ruff check .
uv run ruff format .

# 使用 black 进行代码格式化
uv run black .
```

### 类型检查

```bash
uv run mypy .
```

### 运行测试

```bash
uv run pytest
```

## 从旧 requirements.txt 迁移

原始的 `requirements.txt` 文件已备份为 `requirements.txt.backup`。所有依赖已迁移到 `pyproject.toml` 文件中。

## 镜像源配置详解

### 中国境内镜像源列表

| 镜像源 | URL | 说明 |
|--------|-----|------|
| **清华大学** | `https://pypi.tuna.tsinghua.edu.cn/simple/` | 🏫 推荐，速度快，更新及时 |
| **阿里云** | `https://mirrors.aliyun.com/pypi/simple/` | ☁️ 阿里云提供，稳定可靠 |
| **豆瓣** | `https://pypi.douban.com/simple/` | 📚 老牌镜像源 |
| **中科大** | `https://pypi.mirrors.ustc.edu.cn/simple/` | 🎓 中科大教育网源 |
| **华为云** | `https://repo.huaweicloud.com/repository/pypi/simple/` | 🌐 华为云镜像源 |

### 配置方法

#### 1. 项目级配置（推荐）
项目已包含 `uv.toml` 配置文件，自动使用清华镜像源：

```toml
# uv.toml
index-url = "https://pypi.tuna.tsinghua.edu.cn/simple/"
extra-index-url = [
    "https://mirrors.aliyun.com/pypi/simple/",
    "https://pypi.douban.com/simple/",
    "https://pypi.mirrors.ustc.edu.cn/simple/"
]
```

#### 2. 环境变量配置
```bash
# Windows (PowerShell) - 临时设置
$env:UV_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple/"
$env:UV_EXTRA_INDEX_URL="https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/"

# Windows (PowerShell) - 永久设置
[System.Environment]::SetEnvironmentVariable("UV_INDEX_URL", "https://pypi.tuna.tsinghua.edu.cn/simple/", "User")
[System.Environment]::SetEnvironmentVariable("UV_EXTRA_INDEX_URL", "https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/", "User")

# Linux/macOS - 临时设置
export UV_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple/"
export UV_EXTRA_INDEX_URL="https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/"

# Linux/macOS - 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export UV_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple/"' >> ~/.bashrc
echo 'export UV_EXTRA_INDEX_URL="https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/"' >> ~/.bashrc
source ~/.bashrc
```

#### 3. 命令行指定
```bash
# 单次使用指定镜像源
uv sync --index-url https://pypi.tuna.tsinghua.edu.cn/simple/

# 安装包时指定镜像源
uv add requests --index-url https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 验证镜像源配置

```bash
# 查看当前配置
uv sync --dry-run | head -20

# 测试下载速度
uv add --dry-run requests 2>&1 | grep -E "( Resolved | https://)"

# 检查使用的索引源
uv pip list --verbose
```

## 常用命令

### 包管理

- 安装新包: `uv add package_name`
- 安装开发依赖: `uv add --dev package_name`
- 更新依赖: `uv lock --upgrade`
- 查看依赖树: `uv tree`

### Python 版本管理

- 查看可用 Python 版本: `uv python list`
- 安装特定 Python 版本: `uv python install 3.11.9`
- 查看当前 Python 版本: `uv run python --version`
- 切换 Python 版本: `uv sync --python 3.11.9`

## 完整安装与运行指南

### 一键安装和运行

```bash
# 1. 安装 UV（如果还没安装）
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. 克隆项目
git clone <repository-url>
cd bytecub-plugin

# 3. 安装 Python 3.11.x 和所有依赖
uv python install 3.11.9
uv sync --python 3.11.9

# 4. 运行项目
uv run python main.py
```

### 分步骤安装

#### 1. 环境准备
```bash
# 安装 UV
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# 或者
pip install uv

# 验证 UV 安装
uv --version
```

#### 2. Python 版本管理
```bash
# 安装 Python 3.11.9
uv python install 3.11.9

# 查看已安装的 Python 版本
uv python list

# 验证当前使用的 Python 版本
uv run python --version
```

#### 3. 依赖安装
```bash
# 进入项目目录
cd bytecub-plugin

# 安装所有依赖（包括开发依赖）
uv sync --python 3.11.9

# 或者只安装生产依赖
uv sync --python 3.11.9 --no-dev

# 安装额外的包
uv add new_package_name
uv add --dev dev_package_name
```

#### 4. 验证安装

```bash
# 检查项目状态
uv sync --dry-run

# 查看已安装的包
uv pip list

# 运行测试
uv run pytest
```

## 运行项目

### 开发模式运行

```bash
# 使用 UV 运行（推荐）
uv run python main.py

# 或者激活虚拟环境后运行
.venv\Scripts\activate
python main.py

# 运行其他入口文件
uv run python app.py          # Web 应用
uv run python chat_app.py      # 聊天应用
```

### 生产模式运行

```bash
# 使用优化后的 Python 运行
uv run python -O main.py

# 后台运行（Windows）
start /B uv run python main.py

# 使用 nohup（Linux/macOS）
nohup uv run python main.py &
```

## 打包成可执行文件

### 方法一：使用 PyInstaller（推荐）

#### 1. 安装 PyInstaller

```bash
uv add --dev pyinstaller
```

#### 2. 使用项目自带的打包脚本

```bash
# 使用 build_exe.py 脚本打包
uv run python build_exe.py

# 或者直接使用 PyInstaller
uv run pyinstaller --onefile --name=bytecubplugin main.py
```

#### 3. 使用现有的 .spec 文件

```bash
# 使用 main.spec 打包
uv run pyinstaller main.spec

# 使用 bytecubplugin.spec 打包
uv run pyinstaller bytecubplugin.spec
```

#### 4. 自定义打包选项

```bash
# 基础打包
uv run pyinstaller --onefile --name=bytecubplugin main.py

# 包含数据文件
uv run pyinstaller --onefile --name=bytecubplugin --add-data ".env.dev;." main.py

# 隐藏导入模块
uv run pyinstaller --onefile --name=bytecubplugin \
  --hidden-import=torchvision \
  --hidden-import=pikepdf._cpphelpers \
  --hidden-import=rapidocr_onnxruntime \
  main.py

# 排除不需要的模块
uv run pyinstaller --onefile --name=bytecubplugin \
  --exclude-module=PyQt5 \
  --exclude-module=tkinter \
  main.py
```

### 方法二：使用 Nuitka（高级）

#### 1. 安装 Nuitka

```bash
uv add --dev nuitka
```

#### 2. 使用项目自带的 Nuitka 脚本

```bash
# 使用 nuitka_exe.py 脚本打包
uv run python nuitka_exe.py
```

#### 3. 手动使用 Nuitka

```bash
# 基础打包
uv run python -m nuitka --standalone --onefile main.py

# 优化打包
uv run python -m nuitka \
  --standalone \
  --onefile \
  --enable-plugin=multiprocessing \
  --windows-console-mode=attach \
  --include-package-data=torch \
  --include-package-data=torchvision \
  main.py
```

### 打包后验证

#### 1. 检查打包结果

```bash
# 查看 dist 目录
ls dist

# 运行打包后的程序
./dist/bytecubplugin.exe  # Windows
./dist/bytecubplugin      # Linux/macOS
```

#### 2. 测试功能

```bash
# 测试基本功能
./dist/bytecubplugin.exe --help

# 测试 PDF 处理功能
./dist/bytecubplugin.exe --input sample.pdf
```

## 打包优化建议

### 减小文件大小

```bash
# 使用 UPX 压缩
uv run pyinstaller --onefile --upx-dir=path/to/upx main.py

# 排除不需要的模块
uv run pyinstaller --onefile \
  --exclude-module=matplotlib \
  --exclude-module=IPython \
  --exclude-module=jupyter \
  main.py
```

### 提高性能

```bash
# Nuitka 优化选项
uv run python -m nuitka \
  --standalone \
  --onefile \
  --lto=yes \
  --jobs=4 \
  main.py
```

## 故障排除

### 常见问题

#### 1. 网络连接超时
```bash
# 解决方案一：使用镜像源
$env:UV_INDEX_URL="https://pypi.tuna.tsinghua.edu.cn/simple/"
uv sync --refresh

# 解决方案二：增加超时时间
$env:UV_REQUEST_TIMEOUT=120
uv sync --refresh

# 解决方案三：重试机制
uv sync --refresh --retries 5
```

#### 2. 镜像源同步延迟
```bash
# 切换到其他镜像源
uv add requests --index-url https://mirrors.aliyun.com/pypi/simple/

# 使用多个备用源
$env:UV_EXTRA_INDEX_URL="https://mirrors.aliyun.com/pypi/simple/,https://pypi.douban.com/simple/"
```

#### 3. 依赖冲突解决
```bash
# 强制刷新
uv sync --refresh

# 清理缓存重新安装
uv cache clean
uv sync --python 3.12

# 重新生成锁文件
rm uv.lock
uv lock
```

#### 4. 打包失败时的调试
```bash
uv run pyinstaller --debug=all --onefile main.py

# 使用镜像源安装打包工具
uv add --dev pyinstaller --index-url https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 环境重置

```bash
# 完全重置环境
rm -rf .venv uv.lock
uv sync --python 3.11.9

# 或者重新创建项目
uv init bytecub-plugin-new
cd bytecub-plugin-new
# 复制 pyproject.toml 和源码
uv sync --python 3.11.9
```
