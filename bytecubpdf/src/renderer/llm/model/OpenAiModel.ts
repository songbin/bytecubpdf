export interface OpenAiMessage {
  role:string;
  content: string;
}
export interface OpenAiMessageList extends Array<OpenAiMessage> {

}

export interface OpenAiRequest {
  model:string;
  temperature: number;
  stream: boolean;
  stream_options?: {
    include_usage?: boolean;
  };
  max_tokens?: number;
  messages?: OpenAiMessageList;
}

export class OpenAiCustomModel {
  private requestParam:OpenAiRequest;
  constructor(model:string, temperature:number, stream:boolean, maxTokens:number, messages:OpenAiMessageList) {
    this.requestParam = {
      model :model,
      temperature: temperature,
      stream: stream,
      stream_options: {
        include_usage: true
      },
      max_tokens: maxTokens,
      messages: messages
    };
  }

  buildString():string{
    return JSON.stringify(this.requestParam);
  }

  buildMessage(role:string, content:string):OpenAiMessage{
    return {
      role: role,
      content: content
    }
  }
}