import * as XLSX from "xlsx";

export type SheetPayload = {
  name: string;
  rows: Record<string, string>[];
};

function normalizeKey(key: string) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ");
}

export function cell(row: Record<string, string>, ...aliases: string[]) {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    map.set(normalizeKey(key), String(value ?? "").trim());
  }
  for (const alias of aliases) {
    const hit = map.get(normalizeKey(alias));
    if (hit !== undefined && hit !== "") return hit;
  }
  return "";
}

export function parseNumber(text: string) {
  if (!text) return 0;
  const n = Number(String(text).replace(/,/g, "").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseBool(text: string, defaultTrue = true) {
  if (!text) return defaultTrue;
  const v = text.trim().toLowerCase();
  if (["0", "false", "no", "khong", "không", "n"].includes(v)) return false;
  if (["1", "true", "yes", "co", "có", "y"].includes(v)) return true;
  return defaultTrue;
}

export function parseWorkbook(buffer: Buffer, originalName = ""): SheetPayload[] {
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".csv")) {
    const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
    const name = wb.SheetNames[0] || "CSV";
    return [{ name: "CSV", rows: sheetToRows(wb.Sheets[name]) }];
  }
  const wb = XLSX.read(buffer, { type: "buffer" });
  return wb.SheetNames.map((name) => ({
    name,
    rows: sheetToRows(wb.Sheets[name]),
  }));
}

function sheetToRows(sheet: XLSX.WorkSheet | undefined): Record<string, string>[] {
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return raw.map((row) => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      out[String(key).trim()] = String(value ?? "").trim();
    }
    return out;
  });
}

export function templateRows(mode: "products" | "labors" | "customers"): Record<string, string | number>[] {
  if (mode === "products") {
    return [{ ma_sp: "SP000010", ten_sp: "Phu tung demo Excel", dvt: "Cai", sl_ton: 20, vt_ton_kho: 1 }];
  }
  if (mode === "labors") {
    return [{ ma_tcong: "TC0002", ten_tcong: "Cong thay nhot", don_gia: 150000, status: "1" }];
  }
  return [{ ma_kh: "KHDEMO", ten_kh: "Khach demo Excel", dien_thoai: "0900000002", dia_chi: "TP.HCM" }];
}

export function templateCsv(mode: "products" | "labors" | "customers") {
  const rows = templateRows(mode);
  const headers = Object.keys(rows[0] || {});
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => String(row[h] ?? "")).join(",")),
  ];
  return lines.join("\n") + "\n";
}

/** File Excel mẫu (.xlsx) — cùng cột với WinForms mau_import_*.xls */
export function templateXlsx(mode: "products" | "labors" | "customers"): Buffer {
  const rows = templateRows(mode);
  const sheetName = mode === "products" ? "DMSP" : mode === "labors" ? "TienCong" : "DMKH";
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function templateFileName(mode: "products" | "labors" | "customers", ext: "xlsx" | "csv" = "xlsx") {
  const base =
    mode === "products" ? "mau_import_dmsp" : mode === "labors" ? "mau_import_tiencong" : "mau_import_dmkh";
  return `${base}.${ext}`;
}
