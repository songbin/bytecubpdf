import { Ollama,ChatResponse as OllamaChatResponse, Message as OllamaMessage } from 'ollama/browser'


import { BaseLlmClient } from "@/renderer/llm/BaseLlmClient";
import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";
import { LLMAdapter } from '../LLMAdapter';
import { LLM_PROTOCOL } from '@/renderer/constants/appconfig';
export class CustomOllama extends BaseLlmClient {
    private llm: Ollama;
    constructor(config: ClientConfig) {
        super(config);
        this.llm = new Ollama({
            host: config.baseUrl,
            headers: {
                // Authorization: 'Bearer ' + config.apiKey,
                'X-Custom-Header': 'custom-value',
                'User-Agent': 'DocFable/1.0',
                'Content-Type': 'application/json',
            },
        });
    }
   async call(messages: LlmMessageList) {
        try {
           const response = await this.llm.chat({
                model: this.config.modelName,
                messages: messages.toJsonArray(),
                stream: false
            });
            // console.log(JSON.stringify(response))
            return LlmResModel.fromObject(response, LLM_PROTOCOL.ollama)
        } catch (error) {
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
    }

    async *stream(messages: LlmMessageList, signal: AbortSignal): AsyncGenerator<LlmResModel> {
        try{
                const stream = await this.llm.chat({
                model: this.config.modelName,
                messages: messages.toJsonArray(),
                think: true,
                stream: true
                 });
                for await (const chunk of stream) {
                    //console.log(JSON.stringify(chunk))
                    // 检查是否已中断
                    if (signal.aborted) {
                        console.log('用户中断对话')
                        break;
                    }
                    yield LlmResModel.fromObject(chunk, LLM_PROTOCOL.ollama)
                }
        }catch(error){
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
       
    }
   

}

export default CustomOllama;
