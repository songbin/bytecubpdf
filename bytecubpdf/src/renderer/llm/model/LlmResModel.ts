// LLM响应模型定义
// 转换为class并实现字段获取方法

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
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  system_fingerprint?: string;
  choices?: Choice[];
  usage?: Usage;

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
    return this.choices?.[0]?.delta?.content;
  }

  /**
   * 获取第一个choice的reasoning_content
   * @returns reasoning_content或undefined
   */
  getReasoningContent(): string | null | undefined {
    return this.choices?.[0]?.delta?.reasoning_content;
  }

  /**
   * 从JSON字符串创建LlmResModel实例
   * @param jsonString JSON格式的字符串
   * @returns LlmResModel实例
   * @throws {SyntaxError} 如果JSON字符串无效则抛出异常
   */
  static fromJson(jsonString: string): LlmResModel {
    const data = JSON.parse(jsonString);
    return new LlmResModel(data);
  }

  /**
   * 从普通对象创建LlmResModel实例
   * @param obj 普通对象
   * @returns LlmResModel实例
   */
  static fromObject(obj: any): LlmResModel {
    return new LlmResModel(obj);
  }
}