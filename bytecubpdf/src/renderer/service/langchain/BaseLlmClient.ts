import { ClientConfig } from '@/renderer/service/langchain/models/LlmModel';
import { AIMessageChunk } from '@langchain/core/messages';
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
  abstract stream(prompt: string): AsyncGenerator<AIMessageChunk>;
  /**
   * 同步调用
   * 
  */
  abstract call(prompt: string): Promise<any>;

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