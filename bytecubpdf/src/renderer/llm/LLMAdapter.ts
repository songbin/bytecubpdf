import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import {CustomOpenAI} from '@/renderer/llm/custom/CustomOpenAI'
import { BaseLlmClient } from "@/renderer/llm/BaseLlmClient";
import { PROTOCOL_CAN_LLM, LLM_PROTOCOL } from '@/renderer/constants/appconfig'
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";
export class LLMAdapter{
    config:ClientConfig;
    private llm:  CustomOpenAI;

    constructor(config: ClientConfig) {
        this.config = config
        switch (config.protocolType) {
            case LLM_PROTOCOL.ollama:
                this.llm = new CustomOpenAI(config);
                break;
            case LLM_PROTOCOL.openai:
                this.llm = new CustomOpenAI(config);
                break;
            default:
                throw new Error(`不支持的模型类型: ${config.protocolType}`);
        }
    }

    /**
     * 流式处理提示并返回结果
     * @param prompt 输入提示
     * @returns 异步生成器，逐段返回结果
     */
    async * stream(messages: LlmMessageList, signal: AbortSignal): AsyncGenerator<any>{
        const stream = await this.llm.stream(messages, signal);
        for await (const part of stream) {
            yield part;
        }
    }
    /**
     * 同步调用
     * 
     */
    async call(messages: LlmMessageList): Promise<any>{
        return await this.llm.call(messages);
    }
    
}