import { Ollama } from "@langchain/ollama";

export class CustomOllamaAi {
    private llm: Ollama;

    constructor(baseUrl: string, modelName: string) {
        this.llm = new Ollama({
            baseUrl: baseUrl,  // 确保格式是 "http://localhost:11434"
            model: modelName,   // 例如 "llama3"
            temperature: 0.7  ,
            numPredict: 5,//相当于maxTokens
        });
    }

   
    // 普通调用（非流式）
    async call(prompt: string): Promise<string> {
        try {
            return await this.llm.invoke(prompt);
        } catch (error) {
            console.error("调用失败:", error);
            throw error;
        }
    }

    // 流式调用（逐段接收结果）
    async *stream(prompt: string): AsyncGenerator<string> {
        const stream = await this.llm._streamResponseChunks(prompt, {});
        for await (const chunk of stream) {
            yield chunk.text;  // 逐段返回文本 [[4]]
        }
    }
}

export default CustomOllamaAi;


// const ollama = new CustomOllamaAi("http://localhost:11434", "llama3");

// // 普通调用
// const result = await ollama.call("解释量子力学");
// console.log("最终结果:", result);

// // 流式调用
// for await (const chunk of ollama.stream("写一首诗")) {
//     process.stdout.write(chunk);  // 逐字符输出
// }