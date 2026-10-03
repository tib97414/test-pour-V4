import * as XLSX from "xlsx";

export async function parseExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Aucune feuille Excel trouvée.");
  }

  const sheet = workbook.Sheets[sheetName];
  return {
    sheetName,
    rows: XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })
  };
}
