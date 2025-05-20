import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager'
import { SettingLLMModel, SettingLLMPlatform } from '@/renderer/model/settings/SettingLLM';
import {CustomOpenAI} from '@/renderer/service/langchain/CustomOpenAI'
import { PROTOCOL_CAN_LLM, LLM_PROTOCOL } from '@/renderer/constants/appconfig'
import { CustomOllamaAi } from '@/renderer/service/langchain/CustomOllamaAi'
export class ChatService {
  llmManager = new LlmModelManager()
  
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
         // 根据平台协议类型选择不同的AI客户端
         if (platform.protocolType === LLM_PROTOCOL.openai) {
            const customOpenAi = new CustomOpenAI(baseurl, apiKey, modelName)
            await customOpenAi.call('你好')
        }else if (platform.protocolType === LLM_PROTOCOL.ollama) {
            const ollama = new CustomOllamaAi( baseurl,modelName);
            await ollama.call("你好");
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
}
