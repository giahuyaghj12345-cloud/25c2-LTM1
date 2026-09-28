import { useEffect, useMemo, useState } from "react";
import { serialApi, type SerialItem, type StockOut } from "../api";

function dmy(value?: string) {
  const raw = String(value || "").slice(0, 10);
  const [year, month, day] = raw.split("-");
  if (!year || !month || !day) return "";
  return `${day}-${month}-${year}`;
}

function when(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return dmy(value);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function serialStateLabel(voucher?: StockOut | null) {
  if (!voucher) return "Chưa chọn phiếu";
  if (voucher.serialLocked) return "Đã hoàn tất / khóa phiếu";
  if (voucher.serialCreated) return "Đã tạo Serial — chờ hoàn tất";
  return "Chưa tạo Serial";
}

export default function CreateSerial() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [blockedBy, setBlockedBy] = useState("");
  const [hasLock, setHasLock] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [vouchers, setVouchers] = useState<StockOut[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [voucher, setVoucher] = useState<StockOut | null>(null);
  const [serials, setSerials] = useState<SerialItem[]>([]);

  const step = useMemo(() => {
    if (!voucher) return 1;
    if (!voucher.serialCreated) return 2;
    if (!voucher.serialLocked) return 3;
    return 4;
  }, [voucher]);

  const acquire = async () => {
    setError("");
    try {
      await serialApi.acquire();
      setHasLock(true);
      setBlockedBy("");
    } catch (err) {
      setHasLock(false);
      setBlockedBy(err instanceof Error ? err.message : "Tính năng đang bị người khác sử dụng");
    }
  };

  useEffect(() => {
    void acquire();
    return () => {
      void serialApi.release().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!hasLock) return;
    const timer = window.setInterval(() => {
      void serialApi.heartbeat().catch(() => {
        setHasLock(false);
        setBlockedBy("Mất quyền sử dụng tính năng tạo Serial. Thử lại.");
      });
    }, 20000);
    const onLeave = () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      void fetch("/api/catalog/serials/lock", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      });
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [hasLock]);

  const loadVoucher = async (id: string) => {
    const data = await serialApi.voucher(id);
    setVoucher(data.voucher);
    setSerials(data.serials || []);
  };

  const openPicker = async () => {
    setError("");
    setBusy(true);
    try {
      const rows = await serialApi.vouchers();
      setVouchers(rows);
      setSelectedId(voucher?.id || rows[0]?.id || "");
      setPickerOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được phiếu xuất kho");
    } finally {
      setBusy(false);
    }
  };

  const confirmPicker = async () => {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      await loadVoucher(selectedId);
      setPickerOpen(false);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không chọn được phiếu");
    } finally {
      setBusy(false);
    }
  };

  const createSerials = async () => {
    if (!voucher) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await serialApi.create(voucher.id);
      setVoucher(data.voucher);
      setSerials(data.serials || []);
      setMessage(`Đã tạo ${data.serials.length} số Serial. Phiếu được đánh dấu ĐÃ TẠO SERIAL.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được số Serial");
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!voucher) return;
    setBusy(true);
    setError("");
    try {
      const data = await serialApi.complete(voucher.id);
      setVoucher(data.voucher);
      setSerials(data.serials || []);
      setMessage("Đã hoàn tất. Phiếu xuất kho bị khóa, không sửa hoặc xóa được nữa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không hoàn tất được");
    } finally {
      setBusy(false);
    }
  };

  if (blockedBy && !hasLock) {
    return (
      <section>
        <div className="page-head">
          <h1>Tạo số Serial</h1>
          <p className="muted">Chỉ một người dùng được vào màn hình này tại một thời điểm</p>
        </div>
        <div className="alert">{blockedBy}</div>
        <button type="button" onClick={() => void acquire()} disabled={busy}>
          Thử lại
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="page-head">
        <h1>Tạo số Serial</h1>
        <p className="muted">Bắt buộc theo thứ tự: chọn phiếu xuất kho → tạo serial → hoàn tất</p>
      </div>

      <div className="serial-steps">
        <span className={step >= 1 ? "active" : ""}>1. Chọn phiếu xuất kho</span>
        <span className={step >= 2 ? "active" : ""}>2. Tạo số serial</span>
        <span className={step >= 3 ? "active" : ""}>3. Hoàn tất</span>
      </div>

      {error && <div className="alert">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="actions" style={{ marginBottom: 16 }}>
        <button type="button" onClick={() => void openPicker()} disabled={busy || Boolean(voucher?.serialCreated && !voucher.serialLocked)}>
          Chọn phiếu xuất kho
        </button>
        <button type="button" onClick={() => void createSerials()} disabled={busy || !voucher || Boolean(voucher.serialCreated)}>
          Tạo số serial
        </button>
        <button type="button" onClick={() => void complete()} disabled={busy || !voucher?.serialCreated || Boolean(voucher.serialLocked)}>
          Hoàn tất
        </button>
      </div>

      {!voucher && <p className="muted">Chưa chọn phiếu. Nhấn «Chọn phiếu xuất kho» để lấy phiếu xuất bán / bán phụ tùng bảo hành chưa khóa.</p>}

      {voucher && (
        <>
          <div className="card">
            <div className="page-head">
              <h2>Thông tin phiếu {voucher.number}</h2>
              <p className="muted">{serialStateLabel(voucher)} · {voucher.kindLabel || "Xuất bán"}</p>
            </div>
            <div className="info-grid">
              <div><small>Mã khách</small><strong>{voucher.customerCode || "—"}</strong></div>
              <div><small>Tên khách</small><strong>{voucher.customerName || voucher.receiver || "—"}</strong></div>
              <div><small>Địa chỉ</small><strong>{voucher.customerAddress || "—"}</strong></div>
              <div><small>Số điện thoại</small><strong>{voucher.customerPhone || "—"}</strong></div>
              <div><small>Email</small><strong>{voucher.customerEmail || "—"}</strong></div>
              <div><small>Nhóm khách</small><strong>{voucher.customerGroupLabel || "—"}</strong></div>
              <div><small>Số đơn hàng</small><strong>{voucher.orderNumber || "—"}</strong></div>
              <div><small>Ngày xuất kho</small><strong>{dmy(String(voucher.date))}</strong></div>
              <div><small>Số phiếu xuất</small><strong>{voucher.number}</strong></div>
            </div>
          </div>

          <div className="card table-wrap">
            <h2>Dòng sản phẩm</h2>
            <table>
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên SP</th>
                  <th>ĐVT</th>
                  <th>Nhóm SP</th>
                  <th>Mã kho</th>
                  <th>Mã lô</th>
                  <th>Số batch</th>
                  <th>Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {(voucher.lines || []).map((line) => (
                  <tr key={line.id || `${line.product?.id}-${line.materialName}`}>
                    <td>{line.product?.code}</td>
                    <td>{line.product?.name || line.materialName}</td>
                    <td>{line.unit || line.product?.unit}</td>
                    <td>{line.product?.groupCode}</td>
                    <td>{line.warehouseCode}</td>
                    <td>{line.lotCode}</td>
                    <td>{line.batchNo}</td>
                    <td>{line.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {serials.length > 0 && (
        <div className="card table-wrap">
          <h2>Số serial đã tạo</h2>
          <table>
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Số serial</th>
                <th>Ngày BH từ</th>
                <th>Ngày BH đến</th>
                <th>Thời gian BH</th>
                <th>Tình trạng</th>
                <th>Thời gian tạo</th>
                <th>Người tạo</th>
              </tr>
            </thead>
            <tbody>
              {serials.map((row) => (
                <tr key={row.id}>
                  <td>{row.productCode}</td>
                  <td><strong>{row.serialNo}</strong></td>
                  <td>{dmy(row.warrantyFrom)}</td>
                  <td>{dmy(row.warrantyTo)}</td>
                  <td>{row.warrantyNote}</td>
                  <td>{row.situation}</td>
                  <td>{when(row.createdAt)}</td>
                  <td>{row.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pickerOpen && (
        <div className="picker-overlay" onClick={() => setPickerOpen(false)}>
          <div className="picker-modal card" onClick={(event) => event.stopPropagation()}>
            <div className="page-head">
              <h2>Chọn phiếu xuất kho</h2>
              <p className="muted">Xuất bán hoặc bán phụ tùng bảo hành — mỗi lần một phiếu</p>
            </div>
            {vouchers.length === 0 && (
              <p className="muted">Không còn phiếu chưa khóa. Hãy tạo phiếu xuất kho (đủ mã khách, nhóm SP) trước.</p>
            )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Số phiếu</th>
                    <th>Ngày</th>
                    <th>Loại</th>
                    <th>Mã / tên khách</th>
                    <th>Trạng thái Serial</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="radio"
                          name="pxk"
                          checked={selectedId === row.id}
                          onChange={() => setSelectedId(row.id)}
                        />
                      </td>
                      <td>{row.number}</td>
                      <td>{dmy(String(row.date))}</td>
                      <td>{row.kindLabel}</td>
                      <td>{row.customerCode} {row.customerName || row.receiver}</td>
                      <td>{serialStateLabel(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions">
              <button type="button" onClick={() => void confirmPicker()} disabled={!selectedId || busy}>
                Chọn phiếu này
              </button>
              <button type="button" className="ghost" onClick={() => setPickerOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
