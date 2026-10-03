import Papa from "papaparse";

export function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve({
        rows: results.data,
        errors: results.errors ?? [],
        meta: results.meta ?? {}
      }),
      error: reject
    });
  });
}
