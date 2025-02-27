const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      // 关键：过滤打包后的 package.json <button class="citation-flag" data-index="3"><button class="citation-flag" data-index="6">
      packageJsonFilter: (packageJson) => {
        delete packageJson.build; // 移除 build 字段
        return packageJson;
      },
      builderOptions: {
        directories: {
          output: './dist_electron',
          buildResources: 'build'
        },
        extraResources: [
          {
            from: path.resolve(__dirname, 'resource'),
            to: '.',
            filter: [
              "**/*",
              "!**/execute/files/**",
              "!**/execute/logs/**",
              "!**/.conda/**",
              "!**/.gradio/**",
              "!**/.idea/**",
              "!**/.vscode/**",
              "!**/__pycache__/**",
              "!**/*.pyc",
              "!**/.DS_Store",
              "!**/Thumbs.db"
            ]
          }
        ],
        asar: true,
        npmRebuild: false,
        productName: "bytecubpdf",
        appId: "com.bytecub.desktop"
      }
    }
  },
  configureWebpack: {
    // 可选：其他 Webpack 配置 <button class="citation-flag" data-index="4"><button class="citation-flag" data-index="9">
  }
});