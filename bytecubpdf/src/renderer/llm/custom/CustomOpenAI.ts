import { ChatOpenAI,OpenAI } from "@langchain/openai";
import type { MessageContent } from "@langchain/core/messages";
import { AIMessageChunk } from '@langchain/core/messages';
import { ClientConfig } from '@/renderer/service/langchain/models/LlmModel';
import { BaseLlmClient } from '@/renderer/service/langchain/BaseLlmClient';
import { concat } from '@langchain/core/utils/stream'; 
export class CustomOpenAI extends BaseLlmClient {
    private llm: ChatOpenAI;

    constructor(config: ClientConfig) {
        super(config);
        this.llm = new ChatOpenAI({
            openAIApiKey: config.apiKey,
            apiKey: config.apiKey,
            model: config.modelName,
            temperature: config.temperature,
            streaming: config.useStream,
            maxTokens: config.maxTokens,
            configuration: {
                baseURL: config.baseUrl
            },
        });
    }



   async call(prompt: string) {
        try {
            const result = await this.llm.invoke(prompt);
            return result;
        } catch (error) {
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
    }

    async *stream(prompt: string): AsyncGenerator<AIMessageChunk> {
        const stream = await this.llm.stream(prompt);
        // let full: AIMessageChunk | undefined;
        for await (const chunk of stream) {
            yield chunk
        }
        // console.log(full);
    }

}

export default CustomOpenAI;
