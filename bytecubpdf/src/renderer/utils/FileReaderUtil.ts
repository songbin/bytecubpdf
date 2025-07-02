import mammoth from 'mammoth'
import PptxTemplater from 'docxtemplater'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'
import { mobi } from 'mobi'
import { parse,Slide } from 'pptxtojson'

// 配置 PDF.js Worker 路径
// (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '//cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js'

export class FileReaderUtil {
  /**
   * 解析 File 对象并返回文本内容（已转义）
   * @param file 浏览器上传的 File 对象
   * @returns 解析后的文本内容（已转义）
   * @throws 如果格式不支持或解析失败
   */
  public static async parseFile(file: File): Promise<string> {
    const ext = this.getFileExtension(file.name)
    const buffer = await this.readFileAsArrayBuffer(file)
    const rawText = await this._parseRawText(buffer, ext)
    return this.escapeForSQLite(rawText)
  }

  /**
   * 获取文件扩展名（不带点）
   */
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
  }

  /**
   * 将 File 读取为 ArrayBuffer
   */
  private static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 解析文件并返回原始文本内容（未转义）
   */
  private static async _parseRawText(buffer: ArrayBuffer, ext: string): Promise<string> {
    switch (ext) {
      // 文本文件
      case 'txt':
      case 'md':
      case 'json':
      case 'csv':
      case 'xml':
      case 'yml':
      case 'yaml':
      case 'toml':
      case 'opml':
      case 'log':
      case 'ini':
      case 'properties':
      case 'sql':
      case 'js':
      case 'ts':
      case 'py':
      case 'html':
      case 'css':
      case 'rtf':
        return new TextDecoder('utf-8').decode(new Uint8Array(buffer))

      // DOCX
      case 'docx':
        return await this.parseDOCX(buffer)

      // PPTX
      case 'pptx':
        return await this.parsePPTX(buffer)

      // XLS/XLSX
      case 'xls':
      case 'xlsx':
        return await this.parseXLS(buffer)

      // PDF
      case 'pdf':
        return await this.parsePDF(buffer)

      // MOBI（电子书）
      case 'mobi':
        return await this.parseMOBI(buffer)

      // EPUB（电子书）
      case 'epub':
        return await this.parseEPUB(buffer)

      // 不支持的格式
      default:
        throw new Error(`不支持的文件类型: .${ext}`)
    }
  }

  /**
   * 解析 PDF 文件
   */
  private static async parsePDF(buffer: ArrayBuffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    let text = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      text += textContent.items.map((item: any) => item.str).join(' ') + '\n'
    }

    return text
  }

  /**
   * 解析 DOCX 文件
   */
  private static async parseDOCX(buffer: ArrayBuffer): Promise<string> {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  }

  /**
   * 解析 PPTX 文件
   */
private static async parsePPTX(buffer: ArrayBuffer): Promise<string> {
  try {
    const json = await parse(buffer)
    let fullText = '';
    json.slides.forEach((slide:Slide, index:number) => {
      fullText += `幻灯片 ${index + 1}:\n`;
      
      // 提取文本内容
      slide.elements.forEach(element => {
        if ('content' in element) {
          fullText += `- ${element.content}\n`;
        }
      });
      
      fullText += '\n';
    });
    return fullText
  } catch (error) {
    console.error('PPTX解析错误:', error);
    throw new Error('无法解析 .pptx 文件');
  }
}

  /**
   * 解析 XLS/XLSX 文件（转换为 Markdown 表格）
   */
  private static async parseXLS(buffer: ArrayBuffer): Promise<string> {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<Array<any>>
    return this.jsonToMarkdownTable(json)
  }

  /**
   * 解析 EPUB 文件（提取 HTML 内容）
   */
  private static async parseEPUB(buffer: ArrayBuffer): Promise<string> {
    const zip = await JSZip.loadAsync(buffer)
    let htmlContent = ''

    for (const path in zip.files) {
      if (path.endsWith('.html') || path.endsWith('.xhtml')) {
        const content = await zip.file(path)?.async('string')
        if (content) {
          htmlContent += content + '\n\n'
        }
      }
    }

    return htmlContent.trim()
  }

  /**
   * 解析 MOBI 文件（提取文本内容）
   */
  private static async parseMOBI(buffer: ArrayBuffer): Promise<string> {
    const parsed = await mobi(buffer)
    return parsed.text
  }

  /**
   * JSON 数组转 Markdown 表格
   */
  private static jsonToMarkdownTable(json: Array<Array<any>>): string {
    if (json.length === 0) return ''

    let markdown = '| ' + json[0].join(' | ') + ' |\n'
    markdown += '| ' + Array(json[0].length).fill('---').join(' | ') + ' |\n'

    for (let i = 1; i < json.length; i++) {
      markdown += '| ' + json[i].join(' | ') + ' |\n'
    }

    return markdown
  }

  /**
   * SQLite 安全转义处理
   * @param text 原始文本
   * @returns 转义后的文本
   */
  public static escapeForSQLite(text: string): string {
    return text.replace(/'/g, "''")
  }
}