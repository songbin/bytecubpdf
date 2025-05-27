import { VERSION } from '@/shared/constants/dfconstants';
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
 


export const STATISTICS = {
    BASE_URL: 'https://api.docfable.com/tongji/client',
    getUrl: (pageName: string) => `${STATISTICS.BASE_URL}/tj${VERSION.version}.html?page=${pageName}`
}
export const UPLOAD_BIZ = {
    "ocr" : "ocr",
    "translate" : "translate",
}
//   // 定义类型
//   export type AppConfig = typeof APP_CONFIG;
//   export default APP_CONFIG;