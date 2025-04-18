# bytcub

一个基于Electron和Vue 3的桌面应用框架。
不要用pnpm，用npm
## 技术栈

- Electron 31.7.6
- Vue 3.3.0
- Vite 4.0.0
- TypeScript 5.0.0

## 项目结构

```
├── src/
│   ├── main/        # 主进程代码
│   ├── preload/     # 预加载脚本
│   └── renderer/    # 渲染进程(Vue应用)
├── dist/            # 构建输出目录
├── dist-electron/   # Electron打包输出
└── ...
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron:dev
```

### 生产构建

```bash
npm run build
```

## 注意事项

- 开发时需要同时运行Vite开发服务器和Electron
- 生产构建会生成可执行文件在dist-electron目录

## 许可证

AGPL3.0