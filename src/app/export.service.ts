import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  public exportArrayToExcel(rows: string[][], fileName: string): void {
    console.time('excel sheet generation')
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(rows);
    // generate workbook and add the worksheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
    // save to file
    XLSX.writeFile(workbook, `${fileName}${EXCEL_EXTENSION}`);
    console.timeEnd('excel sheet generation')
  }
}
