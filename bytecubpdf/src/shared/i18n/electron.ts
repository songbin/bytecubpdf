import { i18n } from './index'
import { app } from 'electron'

export function setupI18n() {
  // 根据系统语言设置默认语言
  const systemLocale = app.getLocale()
  // i18n.global.locale.value = systemLocale.includes('zh') ? 'zh-cn' : 'en-us'
  i18n.global.locale.value = 'zh-cn'
}

export function t(key: string) {
  return i18n.global.t(key)
}