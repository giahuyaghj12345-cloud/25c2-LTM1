import type { BhLine } from "./api";

export const FLOW = [
  { to: "/warranty/quotes", label: "1. Báo giá" },
  { to: "/warranty/tickets", label: "2. Phiếu DV" },
  { to: "/warranty/warehouse", label: "3. Kho BH" },
  { to: "/warranty/receipts", label: "4. Thu tiền" },
  { to: "/warranty/invoices", label: "5. Hóa đơn" },
  { to: "/warranty/lookup", label: "6. Tra cứu" },
  { to: "/warranty/serial-report", label: "7. BC Serial" },
];

export const QUOTE_STATUS: Record<string, string> = {
  nhap: "Lập chứng từ",
  da_duyet: "Đã ghi sổ",
};

export const TICKET_STATUS: Record<string, string> = {
  nhap: "Lập chứng từ",
  ghi_so: "Đã ghi sổ",
  xac_nhan: "Đã ghi sổ",
  dang_sua: "Đang sửa",
  hoan_tat: "Hoàn tất sửa",
  da_giao: "Đã giao khách",
  huy: "Hủy",
};

export const LOAI_BH: Record<number, string> = {
  1: "1 - Sửa chữa",
  2: "2 - Sale 1 đổi 1",
  3: "3 - DV 1 đổi 1",
  4: "4 - Bảo dưỡng",
  5: "5 - Bảo hành",
  6: "6 - Lắp đặt",
};

/** Nhóm sửa chữa (GGV): MGD 10 nhập/xuất giao. Loại 2–3 dùng MGD 8/11. */
export function isRepairLoai(loai?: number) {
  const n = Number(loai) || 1;
  return n === 1 || n === 4 || n === 5 || n === 6;
}

export function isSwapLoai(loai?: number) {
  const n = Number(loai) || 1;
  return n === 2 || n === 3;
}

export const MA_GD: Record<number, string> = {
  7: "7 - Xuất kho phụ tùng BH",
  8: "8 - Xuất SP 1 đổi 1",
  10: "10 - Nhập/xuất sau BH",
  11: "11 - Nhập SP serial cũ",
};

export function money(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(Number(value) || 0));
}

export function lineMoney(line: BhLine) {
  const thanh = (Number(line.so_luong) || 0) * (Number(line.gia) || 0);
  const ck = thanh * (Number(line.tl_ck) || 0) / 100;
  const thue = (thanh - ck) * (Number(line.thue_suat) || 0) / 100;
  return { thanh, ck, thue, pay: thanh - ck + thue };
}

export function sumLines(lines: BhLine[]) {
  return lines.reduce(
    (acc, line) => {
      const row = lineMoney(line);
      const bag = line.loai === "tc" ? "tc" : "pt";
      acc[bag] += row.thanh;
      acc[`${bag}Ck`] += row.ck;
      acc.thue += row.thue;
      acc.pay += row.pay;
      return acc;
    },
    { tc: 0, tcCk: 0, pt: 0, ptCk: 0, thue: 0, pay: 0 }
  );
}

export function emptyLine(loai: "tc" | "pt"): BhLine {
  return { loai, ma: "", ten: "", dvt: "", so_luong: 1, gia: 0, tl_ck: 0, thue_suat: 0, ghi_chu: "", ma_km: "", ten_km: "", tk: "" };
}

export function day(value?: string) {
  if (!value) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.slice(0, 10)) && raw.length === 10) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export function printVoucher(title: string, html: string, copies = 1) {
  const view = window.open("", "_blank", "noopener,width=920,height=720");
  if (!view) return;
  const pages = Array.from({ length: Math.min(Math.max(copies, 1), 3) }, (_, index) => `<section class="lien"><p>Liên ${index + 1}</p>${html}</section>`).join("");
  view.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font:13px Segoe UI,sans-serif;color:#111;margin:28px}h1{font-size:18px;margin:0 0 12px}
    table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #888;padding:4px 6px;text-align:left}
    .meta{display:grid;grid-template-columns:140px 1fr 140px 1fr;gap:4px 8px}
    .lien{break-after:page}</style></head><body>
    <h1>${title}</h1>${pages}</body></html>`);
  view.document.close();
  view.focus();
  view.print();
}

export function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
