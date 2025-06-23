// 导入所需的模块
import { CustomOllamaAi } from './custom/CustomOllamaAi';
import { CustomOpenAI } from './custom/CustomOpenAI';
import { ClientConfig } from '@/renderer/service/langchain/models/LlmModel';
import { PROTOCOL_CAN_LLM, LLM_PROTOCOL } from '@/renderer/constants/appconfig'
import { AIMessageChunk } from '@langchain/core/messages';
import { concat } from '@langchain/core/utils/stream';
// 定义大模型适配器类
export class LLMAdapter {
    private llm: CustomOllamaAi | CustomOpenAI;

    constructor(config: ClientConfig) {
        switch (config.protocolType) {
            case LLM_PROTOCOL.ollama:
                this.llm = new CustomOllamaAi(config);
                break;
            case LLM_PROTOCOL.openai:
                this.llm = new CustomOpenAI(config);
                break;
            default:
                throw new Error(`不支持的模型类型: ${config.protocolType}`);
        }
    }

    // 定义生成文本的方法
    async call(prompt: string): Promise<any> {
        return this.llm.call(prompt);
    }

    // 定义流式生成文本的方法
    async *stream(prompt: string): AsyncGenerator<AIMessageChunk> {
       
        const stream = await this.llm.stream(prompt);
        let full: AIMessageChunk | undefined;
        for await (const chunk of stream) {
            // full = !full ? chunk : concat(full, chunk);
            yield chunk
        }
       
    }
}

 
