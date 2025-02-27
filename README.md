

# ByteCubTS 安装与打包指南

## 编译环境要求
- **Python**: `3.11.9`
- **Node.js**: `20.9.0`
- **pnpm**: `7+`（通过 `npm install -g pnpm` 安装）

---

## 一、打包后端服务
### 1. 编译Python为可执行文件
# 进入资源目录
cd resources\execute

# 执行打包脚本
build.bat

### 2. 复制打包资源
将生成的以下内容：
- `dist` 文件夹
- `start.bat`
- `stop.bat`

按原目录结构复制到：
根目录/dist-electron/resources/

（若目录不存在请手动创建）

---
## 二、前端编译与运行
### 1. 安装依赖
```bash
# 在项目根目录执行
pnpm install
```

### 2. 启动开发环境
```bash
pnpm run electron:serve
```

---

## 三、打包生产环境应用
### 1. 执行打包命令
```bash
pnpm run electron:build -- --win --x64
```

### 2. 补充资源文件
将之前生成的：
- `dist` 文件夹
- `start.bat`
- `stop.bat`

复制到以下两个位置：
```
dist_electron/win-unpacked/resources/
dist_electron/resources/
```

### 3. 运行程序
进入打包目录执行：
```bash
cd dist_electron/win-unpacked
.\bytecubts.exe
```

---

## 四、快速下载
已打包好的最新版本可从官网下载：  
[ByteCubTS 下载地址](https://ts.bytecub.cn/down.html)

---

## 注意事项
1. **系统要求**：Windows 10/11 64位系统
2. **环境验证**：  
   - Python版本验证：`python --version` 应输出 `Python 3.11.9`  
   - Node.js版本验证：`node --version` 应输出 `v20.9.0`
3. 若依赖安装失败，可尝试清除缓存后重试：
   ```bash
   pnpm store prune
   pnpm install --force
   ```
---

## 注意事项
1. **启动流程说明**  
   - 双击 `bytecubts.exe` 启动程序  
   - 首次启动需等待后台翻译服务初始化（约1-3分钟）  
   - 启动成功时会弹出主界面：  
     ![启动界面](./resources/imgs/start.png)

2. **防火墙提示处理**  
   - 首次运行可能出现防火墙拦截提示：  
     ![防火墙提示](./resourcesimgs/network.png)  
   - 请勾选「允许访问」或「解除阻止」以确保网络功能正常

3. **系统要求**：Windows 10/11 64位系统

4. **环境验证**：  
   - Python版本验证：`python --version` 应输出 `Python 3.11.9`  
   - Node.js版本验证：`node --version` 应输出 `v20.9.0`

5. **依赖问题处理**：  
   若安装依赖失败，尝试清除缓存后重试：
   ```bash
   pnpm store prune
   pnpm install --force
   ```
---

## 开源致谢
本项目基于 [PDFMathTranslate](https://github.com/Byaidu/PDFMathTranslate) 进行二次开发，感谢原作者的贡献！