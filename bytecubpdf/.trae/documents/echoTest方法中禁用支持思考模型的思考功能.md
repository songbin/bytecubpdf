## 实施计划

### 任务概述
在 `ChatService.echoTest` 方法中，对于支持思考功能的模型，需要在测试时明确设置 `enable_thinking: false`，避免测试过程中出现意外行为。

### 实施步骤

**步骤 1: 扩展 ClientConfig 接口**
- 在 [LlmConfig.ts](file:///d:/workproj/songbin/chaxuan/gitcode/bytecubpdf/bytecubpdf/src/renderer/llm/core/config/LlmConfig.ts) 的 `ClientConfig` 接口中添加可选的 `enableThinking?: boolean` 字段

**步骤 2: 修改 echoTest 方法**
- 在 [ChatService.ts#L35-L92](file:///d:/workproj/songbin/chaxuan/gitcode/bytecubpdf/bytecubpdf/src/renderer/service/chat/ChatService.ts#L35-L92) 的 `echoTest` 方法中：
  - 导入 `checkEnableThinkSwitch` 函数
  - 在创建 `ClientConfig` 后，检查模型是否支持思考
  - 如果支持，将 `enableThinking` 设置为 `false`

**步骤 3: 修改 CustomOpenAI 类**
- 在 [CustomOpenAI.ts#L19-L38](file:///d:/workproj/songbin/chaxuan/gitcode/bytecubpdf/bytecubpdf/src/renderer/llm/custom/CustomOpenAI.ts#L19-L38) 的 `call` 方法中：
  - 移除 `buildThinkingEnableQwen` 调用
  - 使用 `this.config.enableThinking`（如果存在）来决定是否添加 `enable_thinking` 参数
  - 保持向后兼容：如果 `enableThinking` 未设置，使用原有的 `buildThinkingEnableQwen` 逻辑

### 预期结果
- `echoTest` 测试时，支持思考的模型会被禁用思考功能
- 不影响其他正常调用场景
- 保持代码向后兼容性