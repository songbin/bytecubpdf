# 实施计划: SSE翻译错误监控与展示

- [x] **任务1:** 在 PdfTranslateStore 中添加错误状态管理
  - 在 state 中添加 `errors` 字段 (string[] 类型)
  - 在 actions 中添加 `addErrors` 方法
  - 在 actions 中添加 `clearErrors` 方法
  - _关联需求: #1_

- [x] **任务2:** 在 PdfTsMain.vue 中导入必要的 Naive UI 组件和图标
  - 导入 NModal, NCard, NList, NListItem, NSpace, NScrollbar, NEmpty, NIcon
  - 导入 AlertCircle 图标 (@vicons/ionicons5)
  - _关联需求: #2, #3_

- [x] **任务3:** 在 PdfTsMain.vue 的 script setup 中添加错误对话框状态
  - 添加 `showErrorDialog` ref 变量控制对话框显示
  - 从 store 中解构 `errors` 状态
  - _关联需求: #3_

- [x] **任务4:** 在 PdfTsMain.vue 模板中添加错误按钮
  - 在翻译按钮左侧添加错误按钮
  - 设置按钮为红色类型 (type="error")
  - 添加警告图标
  - 显示错误数量文本 "错误 (N)"
  - 添加点击事件处理
  - _关联需求: #2_

- [x] **任务5:** 在 PdfTsMain.vue 模板中添加错误详情对话框
  - 创建 NModal 组件，绑定 showErrorDialog
  - 添加 NCard 作为对话框内容
  - 添加标题 "翻译错误详情"
  - 添加错误统计文本
  - 创建 NList 显示所有错误消息
  - 添加 NEmpty 处理无错误情况
  - 添加关闭按钮
  - _关联需求: #3_

- [x] **任务6:** 在 SSE onmessage 回调中添加错误监控逻辑
  - 在 onmessage 回调中解析 data.errors 字段
  - 检查 errors 是否为数组且长度大于0
  - 调用 store.addErrors() 收集错误
  - _关联需求: #1_

- [x] **任务7:** 在 handleTranslate 函数开始时清除之前的错误
  - 在翻译开始时调用 store.clearErrors()
  - _关联需求: #4_

- [x] **任务8:** 在 handleFileChange 函数中清除错误
  - 在文件变化时调用 store.clearErrors()
  - _关联需求: #4_

- [x] **任务9:** 添加对话框样式
  - 添加错误列表的样式（红色文本）
  - 添加对话框滚动区域样式
  - 确保与现有设计风格一致
  - _关联需求: #3_
