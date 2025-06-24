export interface ClientConfig{
    baseUrl: string;
    apiKey: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    platformId: string,
    protocolType:string,
    useStream:boolean,
}
export interface ChatRequestMessage{
    role: string;
    content: string;
}

export interface ChatRquestMessageList{
    messages: ChatRequestMessage[];
}