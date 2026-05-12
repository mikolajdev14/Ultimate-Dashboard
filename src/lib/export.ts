import Papa from "papaparse";

export function toCsv<T extends Record<string, unknown>>(rows: T[]) {
  return Papa.unparse(rows);
}

export function toJson<T>(value: T) {
  return JSON.stringify(value, null, 2);
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
