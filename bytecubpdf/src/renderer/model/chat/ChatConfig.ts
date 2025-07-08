export class ChatRole{
    static USER = 'user'
    static ASSISTANT = 'assistant'
    static SYSTEM = 'system'
    
}
export class FileGroup{
    static FILE = 'file'
    static IMAGE = 'image'
    static OTHER = 'other'
}
export class AcceptFileType {
    static FILE_TYPE = [
      '.docx', '.xlsx', '.pptx', '.pdf', '.txt', '.md', '.json', '.csv', '.xml',
      '.yml', '.yaml', '.toml', '.opml', '.log', '.ini', '.properties', '.sql',
      '.js', '.ts', '.py', '.html', '.css', '.rtf'
    ]
    static IMAGE_TYPE = ['.png', '.jpg', '.jpeg']
    static ALL_TYPE = [...this.FILE_TYPE, ...this.IMAGE_TYPE]
    //写个静态方法，把FILE_TYPE转化为字符串，每个后缀使用英文逗号隔开
    static getTypeString() {
        return this.ALL_TYPE.join(',')
    }
    //检查后缀在不在范围内
    static checkType(fileType: string) {
        return this.ALL_TYPE.includes(fileType)
    }
    //检查是否是文件类型
    static checkFileType(fileType: string) {
        return this.FILE_TYPE.includes(fileType)
    }
    //检查是否是图片类型
    static checkImageType(fileType: string) {
        return this.IMAGE_TYPE.includes(fileType)
    }

    static groupType(fileType: string) {
        if (this.checkFileType(fileType)) {
            return FileGroup.FILE
        }
        if (this.checkImageType(fileType)) {
            return FileGroup.IMAGE
        }
        return FileGroup.OTHER
    }

    static groupTypeByFileName(fileName: string) {
        const fileType = fileName.substring(fileName.lastIndexOf('.'))
        return this.groupType(fileType)
    }
}


export enum ModelFlag {
    TEXT = 'text',
    VISION = 'vision',
    EMBEDDED = 'embedded',
    MULTI = 'multi'
}

export type ModelType = ModelFlag

export class LLMChatConfig {
    isOnlyFileChat?:boolean;//是否仅限文件对话
    platformId?:string;
    modelId?:string;
    modelType?:ModelType;
    maxTokens?:number;
    temperature?:number;
    topP?:number;
    frequencyPenalty?:number;
    presencePenalty?:number;
    public static buildSmallConfig(platformId:string,modelId:string,isOnlyFileChat:boolean){
        const config = new LLMChatConfig()
        config.platformId = platformId
        config.modelId = modelId
        config.isOnlyFileChat = isOnlyFileChat
        return config
    }
    public static buildConfig(platformId:string,modelId:string,modelType:ModelType,maxTokens:number,temperature:number,topP:number,frequencyPenalty:number,presencePenalty:number,isOnlyFileChat:boolean){
        const config = new LLMChatConfig()
        config.platformId = platformId
        config.modelId = modelId
        config.modelType = modelType
        config.maxTokens = maxTokens
        config.temperature = temperature
        config.topP = topP
        config.frequencyPenalty = frequencyPenalty
        config.presencePenalty = presencePenalty
        config.isOnlyFileChat = isOnlyFileChat
        return config
    }
 
}

