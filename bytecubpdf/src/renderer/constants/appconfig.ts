/**大模型协议定义*/
export const LLM_PROTOCOL = {
    openai: 'openai',
    azure: 'azure',
    ollama: 'ollama' 
}
/**支持的第三方大模型协议*/
export const PROTOCOL_CAN_LLM = [
    {label: 'OpenAI', value: LLM_PROTOCOL.openai}
]

export const VERSION = {
    "version" : '0.2.0',
    "buildNumber" : 20240417
}
  
//   // 定义类型
//   export type AppConfig = typeof APP_CONFIG;
//   export default APP_CONFIG;