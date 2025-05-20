/**大模型协议定义*/
export const LLM_PROTOCOL = {
    openai: 'openai',
    azure: 'azure',
    ollama: 'ollama' 
}
/**支持的第三方大模型协议*/
export const PROTOCOL_CAN_LLM = [
    {label: 'OpenAI', value: LLM_PROTOCOL.openai},
    {label: 'ollama', value: LLM_PROTOCOL.ollama}
]
 
export const VERSION = {
    "version" : 'v0.4.0', //以后版本号前面要加个v，和version文件保持一致
    "buildNumber" : 20250052001
}
export const UPLOAD_BIZ = {
    "ocr" : "ocr",
    "translate" : "translate",
}
//   // 定义类型
//   export type AppConfig = typeof APP_CONFIG;
//   export default APP_CONFIG;