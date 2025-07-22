export interface SettingLLMModel {
    auto_id?: number;
    /** 模型唯一标识 */
    id: string;
    /** 平台ID */
    platformId: string;
    /** 模型名称 */
    name: string;
    /** 支持的模型类型 */
    types: Array<'text' | 'vision' | 'embedded' | 'multi'>;
    /** 计费类型 */
    pricingType?: string;
    /** 是否支持工具 */
    supportTools?: boolean;
    /** 模型分组 */
    groupName?: string;
    /** 是否启用 */
    isEnabled?: boolean;
    /** 扩展字段1-8 */
    ext1?: string;
    ext2?: string;
    ext3?: string;
    ext4?: string;
    ext5?: string;
    ext6?: string;
    ext7?: string;
    ext8?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
    isFree?: boolean;
}

export interface SettingLLMPlatform {
    /** 平台唯一标识 */
    id: string;
    /** 平台名称 */
    platformName: string;
    /** 协议类型 */
    protocolType: string;
    /** API密钥 */
    apiKey: string;
    /** API地址 */
    apiUrl: string;
    /** 是否激活 */
    isActive: boolean;
    /** 扩展字段1-8 */
    ext1?: string;
    ext2?: string;
    ext3?: string;
    ext4?: string;
    ext5?: string;
    ext6?: string;
    ext7?: string;
    ext8?: string;
    /** 创建时间 */
    createdAt?: string;
    /** 更新时间 */
    updatedAt?: string;
    /** 包含的模型列表 */
    models: SettingLLMModel[];
}

import { useI18n } from 'vue-i18n'

export const getTypeLabels = () => {
    const { t } = useI18n()
    return {
        text: t('settings.model.types.text'),
        vision: t('settings.model.types.vision'),
        embedded: t('settings.model.types.embedded'),
        multi: t('settings.model.types.multi')
    } as const
}