import { ChatOpenAI,OpenAI } from "@langchain/openai";
import type { MessageContent } from "@langchain/core/messages";
export class CustomOpenAI {
     private llm: ChatOpenAI;
    // private llm: OpenAI; // 替换为 OpenAI 类型的 llm 成员变量

    constructor(baseUrl: string, apiKey: string, modelName: string) {
        this.llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            apiKey: apiKey,
            model: modelName,
            temperature: 0.7,
            streaming: false,
            maxTokens: 5,
            configuration: {
                baseURL: baseUrl
            },
        });
    }



   async call(prompt: string) {
        try {
            const result = await this.llm.invoke(prompt);
            
            return result;
        } catch (error) {
            console.error("OpenAI API 错误详情:", (error as Error).message || String(error));
            console.error("完整错误对象:", error);
            throw error;
        }
    }
}

export default CustomOpenAI;
