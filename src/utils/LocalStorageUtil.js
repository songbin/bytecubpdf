// src/utils/LocalStorageUtil.js
class LocalStorageUtil {
    // 设置待翻译的文件路径
    static setPendingTranslation(file_path) {
      try {
        localStorage.setItem('pendingTranslation', file_path);
        console.log('文件路径已保存到 localStorage:', file_path);
      } catch (error) {
        console.error('保存文件路径到 localStorage 失败:', error);
        throw new Error('文件路径保存失败');
      }
    }
  
    // 获取待翻译的文件路径
    static getPendingTranslation() {
      const file_path = localStorage.getItem('pendingTranslation');
      if (file_path) {
        console.log('当前待翻译的文件路径:', file_path);
        return file_path;
      } else {
        console.log('没有待翻译的文件');
        return null;
      }
    }
  
    // 清除待翻译的文件路径
    static clearPendingTranslation() {
      localStorage.removeItem('pendingTranslation');
      console.log('待翻译的文件路径已清除');
    }
  
    // 设置左侧选项框内容
    static setFormData(formData) {
      try {
        localStorage.setItem('formData', JSON.stringify(formData));
        console.log('左侧选项框内容已保存到 localStorage:', formData);
      } catch (error) {
        console.error('保存左侧选项框内容到 localStorage 失败:', error);
        throw new Error('左侧选项框内容保存失败');
      }
    }
  
    // 获取左侧选项框内容
    static getFormData() {
      const formData = localStorage.getItem('formData');
      if (formData) {
        console.log('当前左侧选项框内容:', formData);
        return JSON.parse(formData);
      } else {
        console.log('没有保存的左侧选项框内容');
        return null;
      }
    }
  
    // 清除左侧选项框内容
    static clearFormData() {
      localStorage.removeItem('formData');
      console.log('左侧选项框内容已清除');
    }
  }
  
  export default LocalStorageUtil;