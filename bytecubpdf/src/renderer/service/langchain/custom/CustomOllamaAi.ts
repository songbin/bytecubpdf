import { Ollama } from "@langchain/ollama";
import { ClientConfig } from '@/renderer/service/langchain/models/LlmModel';
import { BaseLlmClient } from '@/renderer/service/langchain/BaseLlmClient';
import { AIMessageChunk } from '@langchain/core/messages';
import { concat } from '@langchain/core/utils/stream'; 
export class CustomOllamaAi extends BaseLlmClient {
    private llm: Ollama;

    constructor(config: ClientConfig) {
        super(config);
        this.llm = new Ollama({
            baseUrl: config.baseUrl,  // 确保格式是 "http://localhost:11434"
            model: config.modelName,   // 例如 "llama3"
            temperature: config.temperature  ,
            numPredict: config.maxTokens,//相当于maxTokens
        });
    }

   
    // 普通调用（非流式）
    async call(prompt: string): Promise<string> {
        try {
            return await this.llm.invoke(prompt);
        } catch (error) {
            console.error("调用失败:", error);
            throw error;
        }
    }

    // 流式调用（逐段接收结果）
    async *stream(prompt: string): AsyncGenerator<AIMessageChunk> {
        // const stream = await this.llm.stream(prompt);
        // let full: AIMessageChunk | string;
        // for await (const chunk of stream) {
        //     full = !full ? chunk : concat(full, chunk);
        // }
        // console.log(full);
    }
}

export default CustomOllamaAi;
