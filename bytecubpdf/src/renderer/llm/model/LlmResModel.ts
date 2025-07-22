// LLM响应模型定义
// 转换为class并实现字段获取方法

import { LLM_PROTOCOL } from "@/renderer/constants/appconfig";
import { ContactSupportFilled } from "@vicons/material";
import { resultProps } from "naive-ui";

import { Ollama,ChatResponse as OllamaChatResponse, Message as OllamaMessage } from 'ollama/browser'
export class PromptTokensDetails {
  cached_tokens?: number;

  constructor(data?: Partial<PromptTokensDetails>) {
    if (data) Object.assign(this, data);
  }
}

export class CompletionTokensDetails {
  reasoning_tokens?: number;

  constructor(data?: Partial<CompletionTokensDetails>) {
    if (data) Object.assign(this, data);
  }
}

export class Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: PromptTokensDetails;
  completion_tokens_details?: CompletionTokensDetails;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;

  constructor(data?: Partial<Usage>) {
    if (data) {
      Object.assign(this, data);
      if (data.prompt_tokens_details) {
        this.prompt_tokens_details = new PromptTokensDetails(data.prompt_tokens_details);
      }
      if (data.completion_tokens_details) {
        this.completion_tokens_details = new CompletionTokensDetails(data.completion_tokens_details);
      }
    }
  }
}

export class Delta {
  content?: string;
  reasoning_content?: string | null;
  reasoning?: string | null;

  constructor(data?: Partial<Delta>) {
    if (data) Object.assign(this, data);
  }
}

export class Choice {
  index?: number;
  delta?: Delta;
  logprobs?: any | null;
  finish_reason?: string;

  constructor(data?: Partial<Choice>) {
    if (data) {
      Object.assign(this, data);
      if (data.delta) this.delta = new Delta(data.delta);
    }
  }
}

export class LlmResModel {
  protocol_type: string = LLM_PROTOCOL.openai;
  id?: string;  
  object?: string; //openAI协议
  created?: number;//openai和ollama
  model?: string; //openai和ollama
  system_fingerprint?: string;
  choices?: Choice[]; //openAI协议
  usage?: Usage; //openAI协议
  message?: OllamaMessage; //ollama协议 
  done_reason?: string; //ollama协议 结束原因 stop or 其他 
  done?: boolean; //ollama协议,是否完结 false or true
  total_duration?: number; //ollama协议
  load_duration?: number; //ollama协议
  prompt_eval_count?: number; //ollama协议
  prompt_eval_duration?: number; //ollama协议
  eval_count?: number; //ollama协议
  eval_duration?: number; //ollama协议 
  


  constructor(data?: Partial<LlmResModel>) {
    if (data) {
      Object.assign(this, data);
      if (data.choices) {
        this.choices = data.choices.map(choice => new Choice(choice));
      }
      if (data.usage) {
        this.usage = new Usage(data.usage);
      }
    }
  }

  /**
   * 获取第一个choice的finish_reason
   * @returns finish_reason或undefined
   */
  getFinishReason(): string | undefined {
    return this.choices?.[0]?.finish_reason;
  }

  /**
   * 获取第一个choice的content
   * @returns content或undefined
   */
  getContent(): string | undefined {
    switch(this.protocol_type){
      case LLM_PROTOCOL.openai:
        return this.choices?.[0]?.delta?.content;
      case LLM_PROTOCOL.ollama:
        return this.message?.content;
    }
  }

  /**
   * 获取第一个choice的reasoning_content
   * @returns reasoning_content或undefined
   */
  getReasoningContent(): string | null | undefined {
    switch(this.protocol_type){
      case LLM_PROTOCOL.openai:
        const openRouter = this.choices?.[0]?.delta?.reasoning;
        const notOpenRouter = this.choices?.[0]?.delta?.reasoning_content;

        return openRouter || notOpenRouter;
      case LLM_PROTOCOL.ollama:
        return this.message?.thinking;
    }
     
  }

  /**
   * 从JSON字符串创建LlmResModel实例
   * @param jsonString JSON格式的字符串
   * @returns LlmResModel实例
   * @throws {SyntaxError} 如果JSON字符串无效则抛出异常
   */
  static fromJson(jsonString: string, protocol:string = LLM_PROTOCOL.openai): LlmResModel {
    const data = JSON.parse(jsonString);
    let result = new LlmResModel(data)
    result.protocol_type = protocol;
    switch(protocol){
      case LLM_PROTOCOL.openai:
        result.protocol_type = LLM_PROTOCOL.openai;
        break;
      case LLM_PROTOCOL.ollama:
        result.protocol_type = LLM_PROTOCOL.ollama;
        break;
    }
    return result;
  }

  /**
   * 从普通对象创建LlmResModel实例
   * @param obj 普通对象
   * @returns LlmResModel实例
   */
  static fromObject(obj: any, protocol:string): LlmResModel {
    let result = new LlmResModel(obj)
    result.protocol_type = protocol;
    return result;
  }
}