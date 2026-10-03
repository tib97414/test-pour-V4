import { parseCsv } from "./csv";
import { parseExcel } from "./excel";
import { parseJson } from "./json";

export async function parseInputFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return { format: "csv", data: await parseCsv(file) };
    case "xlsx":
    case "xls":
      return { format: "excel", data: await parseExcel(file) };
    case "json":
      return { format: "json", data: await parseJson(file) };
    default:
      throw new Error(`Format non supporté pour le moment : .${extension ?? "?"}`);
  }
}
