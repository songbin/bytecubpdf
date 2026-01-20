import * as XLSX from 'xlsx';
import type { Term } from '@/renderer/model/terms/terms';

export interface ExcelTermRow {
  源术语: string;
  翻译后: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportWarning {
  row: number;
  message: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  validRows: ExcelTermRow[];
  duplicateInFileRows: number[];
  conflictWithDbTerms: string[];
}

export interface ImportResult {
  successCount: number;
  skippedCount: number;
  failedCount: number;
  details: string[];
}

export enum ConflictResolutionStrategy {
  OVERWRITE_ALL = 'overwrite_all',
  SKIP_DUPLICATE = 'skip_duplicate',
  CANCEL = 'cancel'
}

export class TermsExcelService {
  private readonly MAX_ROWS = 5000;
  private readonly HEADERS = ['源术语', '翻译后'];

  async generateTemplate(): Promise<Blob> {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      this.HEADERS,
      ['示例术语', 'example term']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    const colWidths = [
      { wch: 30 },
      { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '术语导入模板');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async parseExcel(file: File): Promise<ExcelTermRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            reject(new Error('Excel文件没有数据行'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          if (!this.validateHeaders(headers)) {
            reject(new Error('Excel表头格式不正确，必须包含"源术语"和"翻译后"两列'));
            return;
          }
          
          const rows: ExcelTermRow[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.length >= 2 && row[0] !== undefined && row[1] !== undefined) {
              rows.push({
                源术语: String(row[0]).trim(),
                翻译后: String(row[1]).trim()
              });
            }
          }
          
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  validateExcelData(rows: ExcelTermRow[]): ImportValidationResult {
    const result: ImportValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validRows: [],
      duplicateInFileRows: [],
      conflictWithDbTerms: []
    };

    if (rows.length > this.MAX_ROWS) {
      result.isValid = false;
      result.errors.push({
        row: 0,
        field: '整体',
        message: `数据行数超过限制，最多允许${this.MAX_ROWS}条，当前${rows.length}条`
      });
      return result;
    }

    const sourceTermSet = new Set<string>();
    const sourceTermRowIndex = new Map<string, number>();

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (!row.源术语) {
        result.isValid = false;
        result.errors.push({
          row: rowNum,
          field: '源术语',
          message: '源术语不能为空'
        });
      }

      if (!row.翻译后) {
        result.isValid = false;
        result.errors.push({
          row: rowNum,
          field: '翻译后',
          message: '翻译后不能为空'
        });
      }

      if (row.源术语) {
        if (sourceTermSet.has(row.源术语)) {
          result.warnings.push({
            row: rowNum,
            message: `源术语"${row.源术语}"在文件中重复，第${sourceTermRowIndex.get(row.源术语)}行已存在`
          });
          result.duplicateInFileRows.push(rowNum);
        } else {
          sourceTermSet.add(row.源术语);
          sourceTermRowIndex.set(row.源术语, rowNum);
        }
      }
    });

    if (result.errors.length === 0 && result.duplicateInFileRows.length > 0) {
      result.isValid = false;
    }

    result.validRows = rows.filter((_, index) => !result.duplicateInFileRows.includes(index + 2));

    return result;
  }

  async exportTerms(terms: Term[]): Promise<Blob> {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      this.HEADERS,
      ...terms.map(term => [term.sourceTerm, term.translatedTerm])
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    const colWidths = [
      { wch: 30 },
      { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '术语');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private validateHeaders(headers: string[]): boolean {
    if (headers.length < 2) return false;
    
    const normalizedHeaders = headers.map(h => h?.trim() || '');
    
    return normalizedHeaders.includes('源术语') && normalizedHeaders.includes('翻译后');
  }
}

export const termsExcelService = new TermsExcelService();
