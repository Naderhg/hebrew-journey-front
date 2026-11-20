import * as XLSX from "xlsx";

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

/** Build and download a multi-sheet .xlsx file. Sheet/column widths auto-fitted. */
export function exportToExcel(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    ws["!cols"] = sheet.headers.map((h, i) => ({
      wch: Math.max(
        h.length + 4,
        ...sheet.rows.slice(0, 200).map((r) => String(r[i] ?? "").length + 2),
        12,
      ),
    }));
    ws["!dir"] = "rtl";
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

const PAD = (n: number) => String(n).padStart(2, "0");
export function excelStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${PAD(d.getMonth() + 1)}-${PAD(d.getDate())}`;
}
