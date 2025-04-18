@echo off
setlocal enabledelayedexpansion
REM 设置编码为 UTF-8（避免中文乱码）
chcp 65001 >nul
cls
REM ★★★★★ 终止旧进程（仅当进程存在时）★★★★★
tasklist /FI "IMAGENAME eq bytecubplugin.exe" 2>nul | find /I "bytecubplugin.exe" >nul
if %errorlevel% equ 0 (
    taskkill /F /IM bytecubplugin.exe >nul 2>&1
    echo 旧进程已终止，等待 2 秒...
    timeout /t 2 >nul
) else (
    @REM echo hello world
)
REM 获取脚本所在目录路径
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%
set TARGET_DIR=%ROOT_DIR%
set BASE_DIR=%~1
REM 检查 dist 目录是否存在
if not exist "%TARGET_DIR%" (
    echo 错误：目录 "%TARGET_DIR%" 未找到！
    pause
    exit /b 1
)

REM 切换到 dist 目录
cd /d "%TARGET_DIR%"

REM 检查 bytecubplugin.exe 是否存在
if not exist "bytecubplugin.exe" (
    echo 错误：未找到 bytecubplugin.exe！
    pause
    exit /b 1
)

REM 运行主程序
echo.
echo =====================================================
echo 正在启动翻译引擎(可能会耗时分钟级)...
echo =====================================================
bytecubplugin.exe  --basedir=%BASE_DIR%

REM 保持窗口打开（调试用）
REM echo.
REM echo =====================================================
REM echo 程序已启动，按任意键退出...
REM echo =====================================================
REM pause