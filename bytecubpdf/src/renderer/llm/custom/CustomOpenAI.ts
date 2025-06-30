import OpenAI from "openai";
import { BaseLlmClient } from "@/renderer/llm/BaseLlmClient";
import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";
import { LLM_PROTOCOL } from "@/renderer/constants/appconfig";

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
   async call(messages: LlmMessageList): Promise<LlmResModel> {
        try {
           const response = await this.llm.chat.completions.create({
                model: this.config.modelName,
                messages: messages.toJsonArray(),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: false
            });
            return LlmResModel.fromObject(response, LLM_PROTOCOL.openai);
        } catch (error) {
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
    }

    async *stream(messages: LlmMessageList, signal: AbortSignal,thinking:boolean=false): AsyncGenerator<LlmResModel> {

        try{
                const stream = await this.llm.chat.completions.create({
                        model: this.config.modelName,
                        messages: messages.toJsonArray(),
                        temperature: this.config.temperature,
                        max_tokens: this.config.maxTokens,
                        stream: true
                    });
                for await (const chunk of stream) {
                    // 检查是否已中断
                    if (signal.aborted) {
                        console.log('用户中断对话')
                        break;
                    }
                    yield LlmResModel.fromObject(chunk, LLM_PROTOCOL.openai)
                }
        }catch(error){
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
       
    }

}

export default CustomOpenAI;
