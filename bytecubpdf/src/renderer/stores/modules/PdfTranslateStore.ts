import { defineStore } from 'pinia'
import { UploadFileInfo } from 'naive-ui'

export const usePdfTranslateStore = defineStore('pdfTranslate', {
  state: () => ({
    // 状态字段（不含表单数据）
    statusClass: '' as string,
    progressPercentage: 0 as number,
    statusMessage: '' as string,
    isLoading: false as boolean,
    progressVisible: false as boolean,
    isTranslationCompleted: false as boolean,
    fileList: [] as UploadFileInfo[],
    translatedText: '' as string,
    errorMessage: '' as string,
    abortController: null as AbortController | null,
    startTime: 0 as number,
    startCheckTime: 0 as number
  }),
  actions: {
    // 设置 statusClass
    setStatusClass(value: string) {
      this.statusClass = value
    },
    // 设置 progressPercentage
    setProgressPercentage(value: number) {
      this.progressPercentage = value
    },
    // 设置 statusMessage
    setStatusMessage(value: string) {
      this.statusMessage = value
    },
    // 设置 isLoading
    setIsLoading(value: boolean) {
      this.isLoading = value
    },
    // 设置 progressVisible
    setProgressVisible(value: boolean) {
      this.progressVisible = value
    },
    // 设置 isTranslationCompleted
    setIsTranslationCompleted(value: boolean) {
      this.isTranslationCompleted = value
    },
    // 设置 fileList
    setFileList(value: UploadFileInfo[]) {
      this.fileList = value
    },
    // 设置 translatedText
    setTranslatedText(value: string) {
      this.translatedText = value
    },
    // 设置 errorMessage
    setErrorMessage(value: string) {
      this.errorMessage = value
    },
    // 设置 abortController
    setAbortController(value: AbortController | null) {
      this.abortController = value
    },
    // 设置 startTime
    setStartTime(value: number) {
      this.startTime = value
    },
    // 设置 startCheckTime
    setStartCheckTime(value: number) {
      this.startCheckTime = value
    },
    // 重置状态
    resetState() {
      this.$reset()
    }
  }
})