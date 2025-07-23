export const calcMaxTokens = (modelName: string, maxTokens: number) => {
    if (modelName.toLowerCase().includes('glm-4v')) {
        //GLM-V模型限制如果大于1024就设置为1024
        if (maxTokens > 1024) {
            return 1024
        }

    }
    return maxTokens
}
//验证是否支持思考开关
export const checkEnableThinkSwitch = (modelName: string) => {
     const models = [ 'qwen-plus',
        'qwen-plus-latest',
        'qwen-plus-0428',
        'qwen-plus-2025-04-28',
        'qwen-turbo',
        'qwen-turbo-latest',
        'qwen-turbo-0428',
        'qwen-turbo-2025-04-28']
    //如果modelName字符串包含models里任意一个字符串，则返回true
    let supportThinking = false
    if (models.some(item => modelName.toLowerCase().includes(item))) {
        supportThinking =  true
    }
    return supportThinking
}
export const buildThinkingEnableQwen = (modelName: string, stream:boolean, thinking:boolean) => {
    let supportThinking = checkEnableThinkSwitch(modelName)
    if(!supportThinking){
        return {}
    }
    if(!stream){
        return {
            enable_thinking:false
        }
    }
    return {
        enable_thinking:thinking
    }
    
}
 