import { ClientConfig } from '@/renderer/llm/core/config/LlmConfig';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { LlmRequestModel,LlmMessageList } from "@/renderer/llm/model/LlmRequestModel";
/**
 * AI客户端基类，定义统一接口
 */
export abstract class BaseLlmClient {
  protected config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  /**
   * 流式处理提示并返回结果
   * @param prompt 输入提示
   * @returns 异步生成器，逐段返回结果
   */
  abstract stream(messages: LlmMessageList): AsyncGenerator<any>;
  /**
   * 同步调用
   * 
  */
  abstract call(messages: LlmMessageList): Promise<any>;

  /**
   * 获取模型名称
   */
  get modelName(): string {
    return this.config.modelName;
  }

  /**
   * 获取基础URL
   */
  get baseUrl(): string {
    return this.config.baseUrl;
  }
}