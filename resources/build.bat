@echo off
REM 设置 UTF-8 编码
chcp 65001 >nul
REM 激活 Conda 环境（需提前初始化 Conda）
call conda activate pdfmath3119-1
REM 获取当前目录路径
set ROOT_DIR=%CD%
REM 清理旧构建
if exist "%ROOT_DIR%\build" rmdir /s /q "%ROOT_DIR%\build"
if exist "%ROOT_DIR%\dist" rmdir /s /q "%ROOT_DIR%\dist"
if exist "%ROOT_DIR%\main.spec" del /q "%ROOT_DIR%\main.spec"
REM 执行 PyInstaller 打包（显式指定 Conda 环境路径）
echo 正在打包项目...
pyinstaller --onefile ^
            --name bytecubts ^
            --hidden-import=pkg_resources.py2_warn ^
            --hidden-import=setuptools ^
            --paths="%CONDA_PREFIX%\Lib\site-packages" ^
            --add-data="%ROOT_DIR%\execute\fonts;fonts" ^
            "%ROOT_DIR%\execute\main.py"
REM 拷贝 fonts 文件夹到 dist 目录（新增递归拷贝）
echo 正在拷贝 fonts 文件夹...
if not exist "%ROOT_DIR%\dist" mkdir "%ROOT_DIR%\dist"
xcopy /E /I /Y "%ROOT_DIR%\execute\fonts" "%ROOT_DIR%\dist\fonts" >nul
REM 提示完成
echo.
echo =====================================================
echo 打包完成！生成的 exe 和 fonts 文件夹位于: %ROOT_DIR%\dist\
echo 运行命令示例：
echo %ROOT_DIR%\dist\bytecubts.exe
echo =====================================================
pause