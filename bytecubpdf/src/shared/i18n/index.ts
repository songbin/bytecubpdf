import { createI18n } from 'vue-i18n'
import enCommon from './locales/en-us/common.json'
import enPdfts from './locales/en-us/pdfts.json'
import zhCommon from './locales/zh-cn/common.json'
import zhPdfts from './locales/zh-cn/pdfts.json'
import zhSettingsLeftside from './locales/zh-cn/settings/leftside.json'
import zhSettingsStorage from './locales/zh-cn/settings/storage.json'
import zhSettingsModel from './locales/zh-cn/settings/model.json'
import enSettingsLeftside from './locales/en-us/settings/leftside.json'
import enSettingsStorage from './locales/en-us/settings/storage.json'
import enSettingsModel from './locales/en-us/settings/model.json'



export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-cn',
  messages: {
    'en-us': {
      common: enCommon,
      pdfts: enPdfts,
      settings: {
        leftside:enSettingsLeftside,
        storage: enSettingsStorage,
        model: enSettingsModel
      }
    },
    'zh-cn': {
      common: zhCommon,
      pdfts: zhPdfts,
      settings: {
        leftside:zhSettingsLeftside,
        storage: zhSettingsStorage,
        model: zhSettingsModel
      }
    }
  }
})