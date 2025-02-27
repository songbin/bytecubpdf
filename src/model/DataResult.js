// src/models/dataResult.js
export default class DataResult {
    constructor(code, data, msg) {
      this.code = code; // 状态码
      this.data = data; // 返回的数据
      this.msg = msg;   // 提示信息
    }
  
    // 成功的响应
    static success(data, msg = 'success') {
      return new DataResult(200, data, msg);
    }
  
    // 失败的响应
    static fail(msg, code = 400) {
      return new DataResult(code, null, msg);
    }
  
    // 错误的响应
    static error(msg, code = 500) {
      return new DataResult(code, null, msg);
    }
  
    // 判断是否成功
    isSuccess() {
      return this.code === 200;
    }
  
    // 判断是否失败
    isFail() {
      return this.code !== 200;
    }
  }