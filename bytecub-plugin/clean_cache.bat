@echo off
REM 清理Python编译缓存
echo Cleaning Python cache...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
del /s /q *.pyc
del /s /q *.pyo
del /s /q *.pyd

REM 强制重新安装当前包
 

REM 添加暂停以查看结果
pause