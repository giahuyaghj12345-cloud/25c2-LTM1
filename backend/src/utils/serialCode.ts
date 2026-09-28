export function vietnamNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toYmd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function serialTimePrefix(date: Date) {
  return `${pad2(date.getHours())}${pad2(date.getDate())}${pad2(date.getMonth() + 1)}${String(date.getFullYear()).slice(-2)}`;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}`;
}

export function threeCode(raw: string, fallback = "XXX") {
  const cleaned = String(raw || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  if (!cleaned) return fallback;
  return cleaned.slice(0, 3).padEnd(3, "X");
}

export function addWarrantyEnd(start: Date, customerGroup: string) {
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  end.setFullYear(end.getFullYear() + 2);
  if (customerGroup !== "retail") end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);
  return end;
}

export function warrantyNote(customerGroup: string) {
  return customerGroup === "retail" ? "2 năm" : "2 năm 3 tháng";
}
