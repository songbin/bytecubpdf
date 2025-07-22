import OpenAI from "openai";
import { BaseLlmClient } from "@/renderer/llm/BaseLlmClient";
import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";
import { LLM_PROTOCOL } from "@/renderer/constants/appconfig";
import {calcMaxTokens, buildThinkingEnableQwen} from "@/renderer/service/chat/config/OpenAIModelsConfig";

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
           let maxTokens = calcMaxTokens(this.config.modelName,this.config.maxTokens);
           let thinkingEnableConfig = buildThinkingEnableQwen(this.config.modelName,false,false);
           // @ts-ignore 因为会有额外的字段
           const response = await this.llm.chat.completions.create({
                model: this.config.modelName,
                messages: messages.toJsonArray(),
                temperature: this.config.temperature,
                max_tokens: maxTokens,
                stream: false,
                ...thinkingEnableConfig
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
               //计算maxToken，如果模型名包括GLM-4V忽略大小写，则maxToken最大为1024
                let maxTokens = calcMaxTokens(this.config.modelName,this.config.maxTokens);
                let thinkingEnableConfig = buildThinkingEnableQwen(this.config.modelName,true,thinking);
                // @ts-ignore 因为会有额外的字段
                const stream = await this.llm.chat.completions.create({
                        model: this.config.modelName,
                        messages: messages.toJsonArray(),
                        temperature: this.config.temperature,
                        max_tokens: maxTokens,
                        stream: true,
                        stream_options:{
                            include_usage: true //在输出的最后一行显示所使用的Token数。
                        },
                        ...thinkingEnableConfig
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
