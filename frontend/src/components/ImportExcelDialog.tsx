import { useMemo, useRef, useState } from "react";
import { catalogApi, type ImportMode, type ImportParseResult } from "../api";

const HINTS: Record<ImportMode, string> = {
  products: "Cột bắt buộc: ma_sp / Mã SP. Gợi ý: ten_sp, dvt, sl_ton, vt_ton_kho",
  labors: "Cột bắt buộc: ma_tcong / Mã tiền công. Gợi ý: ten_tcong, don_gia, status",
  customers: "Cột bắt buộc: ma_kh / Mã KH. Gợi ý: ten_kh, dien_thoai, dia_chi",
};

const TITLES: Record<ImportMode, string> = {
  products: "Import Excel — Sản phẩm",
  labors: "Import Excel — Tiền công",
  customers: "Import Excel — Khách hàng",
};

type Props = {
  mode: ImportMode;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
};

export default function ImportExcelDialog({ mode, open, onClose, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ImportParseResult | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const sheet = useMemo(
    () => parsed?.sheets.find((item) => item.name === sheetName) || parsed?.sheets[0],
    [parsed, sheetName]
  );

  const previewRows = sheet?.rows.slice(0, 80) || [];
  const headers = sheet?.headers?.length
    ? sheet.headers
    : previewRows[0]
      ? Object.keys(previewRows[0])
      : [];

  if (!open) return null;

  const reset = () => {
    setFileName("");
    setParsed(null);
    setSheetName("");
    setBusy(false);
    setError("");
    setResult("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    reset();
    onClose();
  };

  const onBrowse = async (file: File | null) => {
    if (!file) return;
    setError("");
    setResult("");
    setBusy(true);
    setFileName(file.name);
    try {
      const data = await catalogApi.parseImport(file);
      setParsed(data);
      setSheetName(data.sheets[0]?.name || "");
    } catch (err) {
      setParsed(null);
      setError(err instanceof Error ? err.message : "Không đọc được file");
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    const rows = sheet?.allRows?.length ? sheet.allRows : sheet?.rows || [];
    if (!rows.length) {
      setError("Không có dòng dữ liệu để import");
      return;
    }
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await catalogApi.commitImport(mode, rows);
      setResult(data.message);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import thất bại");
    } finally {
      setBusy(false);
    }
  };

  const onTemplate = async () => {
    try {
      await catalogApi.downloadImportTemplate(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được mẫu");
    }
  };

  return (
    <div className="picker-overlay" role="dialog" aria-modal="true">
      <div className="picker-modal card import-excel-modal">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 18 }}>{TITLES[mode]}</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Chọn file → xem trước → Import (thêm mới / cập nhật theo mã) — giống AA_ImportExcel (STHINK)
          </p>
        </div>

        <div className="import-excel-top">
          <label className="import-file-label">
            Chọn file Excel:
            <input
              type="text"
              readOnly
              value={fileName}
              placeholder="Chưa chọn file..."
              onClick={() => inputRef.current?.click()}
            />
          </label>
          <button type="button" className="ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
            Duyệt...
          </button>
          <button type="button" className="ghost" disabled={busy} onClick={() => void onTemplate()}>
            Tải mẫu
          </button>
          <label className="import-sheet-label">
            Chọn Sheet:
            <select
              value={sheet?.name || ""}
              disabled={!parsed?.sheets.length || busy}
              onChange={(e) => setSheetName(e.target.value)}
            >
              {(parsed?.sheets || []).map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} ({item.rowCount} dòng)
                </option>
              ))}
            </select>
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            hidden
            onChange={(e) => void onBrowse(e.target.files?.[0] || null)}
          />
        </div>

        <p className="muted import-hint">{HINTS[mode]}</p>
        {error && <div className="alert">{error}</div>}
        {result && <div className="alert success">{result}</div>}

        <div className="card table-wrap import-preview">
          <table>
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
                {!headers.length && <th>Chưa có dữ liệu preview</th>}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((h) => (
                    <td key={h}>{row[h] ?? ""}</td>
                  ))}
                </tr>
              ))}
              {!previewRows.length && (
                <tr>
                  <td colSpan={Math.max(headers.length, 1)} className="muted">
                    Chọn file Excel/CSV để xem trước
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="actions" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <button type="button" className="ghost" disabled={busy} onClick={close}>
            Hủy bỏ
          </button>
          <button type="button" disabled={busy || !sheet?.rowCount} onClick={() => void onImport()}>
            {busy ? "Đang xử lý..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
