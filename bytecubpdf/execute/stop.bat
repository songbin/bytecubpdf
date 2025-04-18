@echo off
setlocal enabledelayedexpansion
REM 设置编码为 UTF-8（避免中文乱码）
chcp 65001 >nul
cls

REM ★★★★★ 终止旧进程 ★★★★★
taskkill /F /IM bytecubplugin.exe >nul 2>&1
REM 等待 2 秒确保进程完全退出
timeout /t 5 >nul