@echo off
setlocal enabledelayedexpansion
REM 设置编码为 UTF-8（避免中文乱码）
chcp 65001 >nul
cls

REM ★★★★★ 终止旧进程 ★★★★★
taskkill /F /IM bytecubts.exe >nul 2>&1
REM 等待 2 秒确保进程完全退出
timeout /t 5 >nul

REM 获取脚本所在目录路径
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%
set TARGET_DIR=%ROOT_DIR%dist

REM 检查 dist 目录是否存在
if not exist "%TARGET_DIR%" (
    echo 错误：目录 "%TARGET_DIR%" 未找到！
    pause
    exit /b 1
)

REM 切换到 dist 目录
cd /d "%TARGET_DIR%"

REM 检查 bytecubts.exe 是否存在
if not exist "bytecubts.exe" (
    echo 错误：未找到 bytecubts.exe！
    pause
    exit /b 1
)

REM 运行主程序
echo.
echo =====================================================
echo 正在运行 bytecubts.exe（工作目录：%CD%）
echo =====================================================
bytecubts.exe

REM 保持窗口打开（调试用）
REM echo.
REM echo =====================================================
REM echo 程序已启动，按任意键退出...
REM echo =====================================================
REM pause