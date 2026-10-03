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
    // With header: 1, SheetJS otherwise includes blank rows inside the
    // worksheet's used range. Excel files can have formatting down to row 1000.
    rows: XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false
    })
  };
}
