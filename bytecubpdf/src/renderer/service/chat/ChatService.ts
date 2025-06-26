import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager'
import { SettingLLMModel, SettingLLMPlatform } from '@/renderer/model/settings/SettingLLM';
import { PROTOCOL_CAN_LLM, LLM_PROTOCOL } from '@/renderer/constants/appconfig'
import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import {CustomOpenAI} from '@/renderer/llm/custom/CustomOpenAI'
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { LLMAdapter } from '@/renderer/llm/LLMAdapter';
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";
export class ChatService {
  llmManager = new LlmModelManager()
  async call(platformId: string, modelId:string,temperature:number,maxTokens:number,prompt:string) {
    const messages = new LlmMessageList({
        role: 'user', 
        content: prompt
        });
    const adapter = await this._buildAdapter(platformId, modelId,temperature,maxTokens,false);
    return await adapter.call(messages)
  }

  async *stream(platformId: string,  modelId:string,temperature:number,maxTokens:number, messages:LlmMessageList): AsyncGenerator<any> {
    const adapter = await this._buildAdapter(platformId, modelId,temperature,maxTokens, true);
    const stream = adapter.stream(messages)
    for await (const chunk of stream) {
        yield chunk
        // console.log("收到chunk:", chunk);
        // 可在此处更新UI或进行其他业务处理
    }
  }
  /**
   * 用于进行回声测试的方法
   * @param platformId - 大模型平台的唯一标识符
   */
  async echoTest(platformId: string): Promise<boolean> {
    console.log(`Received platform ID: ${platformId}`);
    try {
        const platform = await this.llmManager.getPlatform(platformId)
        if(!platform) {
            throw new Error('Platform not found')
        }
        // 检查是否配置了模型
        if(!platform.models || platform.models.length === 0) {
            throw new Error('请至少配置一个模型')
        }
        const model = platform.models[0]
        if(!model) {
            throw new Error('Model not found') 
        }
        const baseurl = platform.apiUrl
        const apiKey = platform.apiKey
        const modelName = model.id
        const config:ClientConfig = {
            baseUrl: baseurl,
            apiKey: apiKey,
            modelName: modelName,
            temperature: 0.7,
            maxTokens: 5,
            platformId: platformId,
            protocolType: platform.protocolType,
            useStream:false,
        }
        // console.log(JSON.stringify(config))
         // 根据平台协议类型选择不同的AI客户端
        const messages = new LlmMessageList({
            role: 'user', 
            content: '你好'
            });

         if (platform.protocolType === LLM_PROTOCOL.openai) {
            const customOpenAi = new CustomOpenAI( config)
            await customOpenAi.call(messages)
        }else if (platform.protocolType === LLM_PROTOCOL.ollama) {
            //TODO 
            const ollama = new CustomOpenAI( config);
            await ollama.call(messages);
        }else {
            // 其他协议类型的处理逻辑
            throw new Error('Unsupported protocol')
        }
        return true
    } catch (error) {
        console.error('API测试失败:', error)
        throw error // 将错误抛出，让调用方处理
    }
  }

  private async _buildAdapter(platformId: string, modelId:string,temperature:number,maxTokens:number, useStream:boolean): Promise<LLMAdapter>{

        const platform = await this.llmManager.getPlatformBasicInfo(platformId)
        if(!platform) {
            throw new Error('Platform not found')
        }
        const modelInfo:SettingLLMModel|null = await this.llmManager.getModel(modelId);
         if(!modelInfo) {
            throw new Error('model not found')
        }
        const config:ClientConfig = {
            baseUrl: platform.apiUrl,
            apiKey: platform.apiKey,
            modelName: modelId,
            temperature: temperature,
            maxTokens: maxTokens,
            platformId: platformId,
            protocolType: platform.protocolType,
            useStream:useStream
        }
        // console.log(JSON.stringify(config))
        const adapter:LLMAdapter = new LLMAdapter(config)
        return adapter
    }
}
