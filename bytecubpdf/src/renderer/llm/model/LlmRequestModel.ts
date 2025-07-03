export class LlmImageMessage {
  type: 'input_image' | 'text';
  image_url?: any;
  text?:string;

  constructor(data: string, type :'input_image' | 'text') {
    this.type = type;
    // console.log('type=====>', type, '\ndata',data)
    if('text' === type){
      this.text = data
      
    }else{
      this.image_url = data
    }
  }
}

export class LlmMessage {
  role: string;
  content: string | LlmImageMessage[];

  constructor(role: string, content: string | LlmImageMessage[]) {
    this.role = role;
    this.content = content;
  }
}

 
// 实现一个将 LlmMessageList 转化为 JSON 数组的方法
export class LlmMessageList extends Array<LlmMessage> {
  constructor(...items: (LlmMessage | Omit<LlmMessage, 'constructor'>)[]) {
    super(...items.map(item => item instanceof LlmMessage ? item : new LlmMessage(item.role, item.content)));
  }

  /**
   * 从普通对象数组创建LlmMessageList实例
   */
  static fromArray(items: (Omit<LlmMessage, 'constructor'>)[]): LlmMessageList {
    return new LlmMessageList(...items.map(item => new LlmMessage(item.role, item.content)));
  }
  /**实现从jsonArray转成本对象方法*/
  static fromJsonArray(jsonArray: any[]): LlmMessageList {
    return new LlmMessageList(...jsonArray.map(item => new LlmMessage(item.role, item.content)));
  }
  toJsonArray(): any[] {
    return this.map(message => {
      if (typeof message.content === 'string') {
        return {
          role: message.role,
          content: message.content
        };
      } else {
        return {
          role: message.role,
          content: message.content.map(imageMessage => ({
            type: imageMessage.type,
            image_url: imageMessage.image_url
          }))
        };
      }
    });
  }
}


export class LlmRequest {
  model: string;
  temperature: number;
  stream: boolean;
  stream_options?: {
    include_usage?: boolean;
  };
  max_tokens?: number;
  messages?: LlmMessageList;

  constructor(model: string, temperature: number, stream: boolean, stream_options?: {
    include_usage?: boolean;
  }, max_tokens?: number, messages?: LlmMessageList) {
    this.model = model;
    this.temperature = temperature;
    this.stream = stream;
    this.stream_options = stream_options;
    this.max_tokens = max_tokens;
    this.messages = messages;
  }
}

export class LlmRequestModel {
  public requestParam: LlmRequest;
  constructor(model: string, temperature: number, stream: boolean, maxTokens: number, messages: LlmMessageList) {
    this.requestParam = new LlmRequest(
      model,
      temperature,
      stream,
      {
        include_usage: true
      },
      maxTokens,
      messages
    );
  }

  buildString():string{
    return JSON.stringify(this.requestParam);
  }

  static buildMessage(role:string, content:string | LlmImageMessage[]): LlmMessage {
    return new LlmMessage(role, content);
  }

  static buildImageMessageContent(role:string, data: string, type:'input_image' | 'text'): LlmImageMessage {
    return new LlmImageMessage(data, type);
  }

  messageToString( ){
    return JSON.stringify(this.requestParam.messages);
  }
}