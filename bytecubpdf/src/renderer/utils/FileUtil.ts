import SparkMD5 from 'spark-md5';
export class FileUtil{
  //计算file的md5值
  /**
   * 计算文件的MD5哈希值
   * @param file 要计算的文件对象
   * @returns Promise<string> 解析为文件MD5哈希值的Promise
   * @throws 当文件读取失败时抛出错误
   */
  static async getFileMd5(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const chunkSize = 2 * 1024 * 1024; // 2MB
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();

      let cursor = 0;

      fileReader.onload = (e) => {
        try {
          spark.append(e.target?.result as ArrayBuffer);
          cursor += chunkSize;

          if (cursor < file.size) {
            loadNext();
          } else {
            resolve(spark.end());
          }
        } catch (error) {
          reject(new Error('Failed to process file chunk'));
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      function loadNext() {
        try {
          const slice = file.slice(cursor, cursor + chunkSize);
          fileReader.readAsArrayBuffer(slice);
        } catch (error) {
          reject(new Error('Failed to read file chunk'));
        }
      }

      loadNext();
    });
  }
}