import OpenAI from "openai";
import { BaseLlmClient } from "@/renderer/llm/BaseLlmClient";
import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";

export class CustomOpenAI extends BaseLlmClient {
    private llm: OpenAI;
    constructor(config: ClientConfig) {
        super(config);
        this.llm = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            dangerouslyAllowBrowser: true
        });
    }
   async call(messages: LlmMessageList) {
        try {
           const response = await this.llm.chat.completions.create({
                model: this.config.modelName,
                messages: messages.toJsonArray(),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: false
            });
            return response;
        } catch (error) {
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
    }

    async *stream(messages: LlmMessageList, signal?: AbortSignal): AsyncGenerator<any> {
         const stream = await this.llm.chat.completions.create({
                model: this.config.modelName,
                messages: messages.toJsonArray(),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: true
            });
        // 监听中断信号
        // if (signal) {
        //     signal.addEventListener('abort', () => {
        //         stream.cancel?.();
        //     });
        // }
        // let full: AIMessageChunk | undefined;
        for await (const chunk of stream) {
            // 检查是否已中断
            if (signal?.aborted) {
                break;
            }
            console.log(chunk)
            yield chunk
        }
        // console.log(full);
    }

}

export default CustomOpenAI;
