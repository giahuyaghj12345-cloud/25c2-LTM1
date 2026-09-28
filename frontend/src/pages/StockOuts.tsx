import { type FormEvent, useEffect, useMemo, useState } from "react";
import { catalogApi, warrantyApi, type Product, type StockOut, type StockOutLine } from "../api";
import BhSuggest from "../components/BhSuggest";
import { useAuth } from "../auth";

const emptyLine = (): StockOutLine => ({
  materialId: "",
  quantity: 1,
  unit: "",
  warehouseCode: "",
  lotCode: "",
  batchNo: "",
  shelfCode: "",
  hsCode: "",
  note: "",
});

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  id: "",
  number: "",
  date: today(),
  postingDate: today(),
  bookNumber: "PX001",
  currency: "VND",
  exchangeRate: 1,
  receiver: "",
  reason: "",
  remark: "",
  kind: "sale",
  status: "draft",
  customerCode: "",
  customerName: "",
  customerAddress: "",
  customerPhone: "",
  customerEmail: "",
  customerGroup: "dealer",
  salesStaff: "",
  deliveryStaff: "",
  deliveryAddress: "",
  orderNumber: "",
  orderDate: "",
  lines: [emptyLine()],
});

type FormState = ReturnType<typeof emptyForm>;

function serialBadge(row: StockOut) {
  if (row.serialLocked) return "Đã khóa";
  if (row.serialCreated) return "Đã tạo Serial";
  return "Chưa tạo Serial";
}

function statusLabel(status?: string) {
  if (status === "posted" || status === "locked") return "Đã ghi sổ cái";
  return "Lập chứng từ";
}

function toForm(row: StockOut): FormState {
  return {
    id: row.id,
    number: row.number || "",
    date: String(row.date || today()).slice(0, 10),
    postingDate: String(row.postingDate || row.date || today()).slice(0, 10),
    bookNumber: row.bookNumber || "PX001",
    currency: row.currency || "VND",
    exchangeRate: Number(row.exchangeRate || 1),
    receiver: row.receiver || "",
    reason: row.reason || "",
    remark: row.remark || "",
    kind: row.kind || "sale",
    status: row.status || "draft",
    customerCode: row.customerCode || "",
    customerName: row.customerName || "",
    customerAddress: row.customerAddress || "",
    customerPhone: row.customerPhone || "",
    customerEmail: row.customerEmail || "",
    customerGroup: row.customerGroup || "dealer",
    salesStaff: row.salesStaff || "",
    deliveryStaff: row.deliveryStaff || "",
    deliveryAddress: row.deliveryAddress || row.customerAddress || "",
    orderNumber: row.orderNumber || "",
    orderDate: row.orderDate ? String(row.orderDate).slice(0, 10) : "",
    lines: (row.lines || []).length
      ? (row.lines || []).map((line) => ({
          materialId: line.product?.id || line.materialId || "",
          quantity: Number(line.quantity),
          unit: line.unit || line.product?.unit || "",
          warehouseCode: line.warehouseCode || "",
          lotCode: line.lotCode || "",
          batchNo: line.batchNo || "",
          shelfCode: line.shelfCode || "",
          hsCode: line.hsCode || line.product?.hsCode || "",
          note: line.note,
        }))
      : [emptyLine()],
  };
}

export default function StockOuts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<StockOut[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<{ ma_kh: string; ten_kh?: string; dia_chi?: string; dien_thoai?: string; email?: string; nhom?: string }[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);

  const locked = useMemo(() => {
    const current = rows.find((row) => row.id === form.id);
    return Boolean(current?.serialLocked || current?.serialCreated);
  }, [rows, form.id]);

  const index = rows.findIndex((row) => row.id === form.id);
  const totalQty = form.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);

  const refresh = async () => {
    try {
      const [list, items, suggest] = await Promise.all([
        catalogApi.stockOuts(),
        catalogApi.products(),
        warrantyApi.suggest().catch(() => ({ customers: [] as { ma_kh: string; ten_kh?: string; dia_chi?: string; dien_thoai?: string; email?: string; nhom?: string }[] })),
      ]);
      setRows(list);
      setProducts(items);
      setCustomers(suggest.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được phiếu xuất");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setLine = (lineIndex: number, patch: Partial<StockOutLine>) => {
    setForm((current) => {
      const lines = [...current.lines];
      lines[lineIndex] = { ...lines[lineIndex], ...patch };
      return { ...current, lines };
    });
  };

  const loadRow = (row: StockOut) => {
    setForm(toForm(row));
    setEditing(false);
    setError("");
  };

  const onNew = () => {
    setForm(emptyForm());
    setEditing(true);
    setError("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setError("");
    try {
      const saved = await catalogApi.saveStockOut({
        ...form,
        id: form.id || undefined,
        deliveryAddress: form.deliveryAddress || form.customerAddress,
      });
      setForm(toForm(saved));
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được phiếu");
    }
  };

  const go = (nextIndex: number) => {
    const row = rows[nextIndex];
    if (row) loadRow(row);
  };

  const disabled = !editing || locked;

  return (
    <section className="voucher-page">
      <div className="voucher-titlebar">
        <h1>Phiếu xuất kho</h1>
        <p className="muted">
          Đơn vị: GGV · Người sửa: {user?.username || "—"}
          {form.number ? ` · ${form.number}` : ""}
        </p>
      </div>

      <div className="voucher-toolbar">
        <button type="button" className="ghost" onClick={onNew}>Mới</button>
        <button type="button" className="ghost" disabled={!form.id || locked} onClick={() => setEditing(true)}>Sửa</button>
        <button type="submit" form="pxk-form" disabled={disabled}>Lưu</button>
        <button
          type="button"
          className="ghost"
          disabled={!editing}
          onClick={() => {
            if (form.id && rows[index]) loadRow(rows[index]);
            else onNew();
          }}
        >
          Hủy
        </button>
        <button
          type="button"
          className="danger"
          disabled={!form.id || locked}
          onClick={() => {
            if (form.id && confirm("Xóa phiếu này?")) {
              void catalogApi.deleteStockOut(form.id).then(() => { onNew(); return refresh(); }).catch((err) => setError(err instanceof Error ? err.message : "Không xóa được"));
            }
          }}
        >
          Xóa
        </button>
        <span className="voucher-nav">
          <button type="button" className="ghost" disabled={index <= 0} onClick={() => go(0)}>|&lt;</button>
          <button type="button" className="ghost" disabled={index <= 0} onClick={() => go(index - 1)}>&lt;</button>
          <button type="button" className="ghost" disabled={index < 0 || index >= rows.length - 1} onClick={() => go(index + 1)}>&gt;</button>
          <button type="button" className="ghost" disabled={rows.length === 0 || index === rows.length - 1} onClick={() => go(rows.length - 1)}>&gt;|</button>
        </span>
      </div>

      {error && <div className="alert">{error}</div>}
      {locked && <div className="alert success">Phiếu đã tạo Serial / khóa — chỉ xem, không sửa xóa.</div>}

      <form id="pxk-form" className="card voucher" onSubmit={onSubmit}>
        <div className="voucher-head">
          <fieldset className="voucher-frame">
            <legend>Thông tin chung</legend>
            <label className="field-row">
              <span>Mã giao dịch</span>
              <select disabled={disabled} value={form.kind} onChange={(e) => setForm((c) => ({ ...c, kind: e.target.value }))}>
                <option value="sale">Xuất bán</option>
                <option value="warranty_parts">Bán phụ tùng bảo hành</option>
              </select>
            </label>
            <label className="field-row">
              <span>Mã khách</span>
              <div className="field-split">
                <BhSuggest
                  disabled={disabled}
                  value={form.customerCode}
                  placeholder="KH009"
                  items={customers.map((item) => ({ value: item.ma_kh, text: item.ten_kh || "", raw: item }))}
                  onChange={(value) => setForm((c) => ({ ...c, customerCode: value.toUpperCase() }))}
                  onPick={(item) => setForm((c) => ({
                    ...c,
                    customerCode: item.raw.ma_kh,
                    customerName: item.raw.ten_kh || "",
                    customerAddress: item.raw.dia_chi || "",
                    customerPhone: item.raw.dien_thoai || c.customerPhone,
                    customerEmail: item.raw.email || c.customerEmail,
                    customerGroup: item.raw.nhom === "retail" ? "retail" : item.raw.nhom === "dealer" ? "dealer" : c.customerGroup,
                    receiver: item.raw.ten_kh || c.receiver,
                    deliveryAddress: item.raw.dia_chi || c.deliveryAddress,
                  }))}
                />
                <input disabled={disabled} value={form.customerName} onChange={(e) => setForm((c) => ({ ...c, customerName: e.target.value, receiver: c.receiver || e.target.value }))} placeholder="Tên khách" />
              </div>
            </label>
            <label className="field-row">
              <span>Địa chỉ</span>
              <input disabled={disabled} value={form.customerAddress} onChange={(e) => setForm((c) => ({ ...c, customerAddress: e.target.value, deliveryAddress: c.deliveryAddress || e.target.value }))} />
            </label>
            <label className="field-row">
              <span>Ng. nhận hàng</span>
              <input disabled={disabled} value={form.receiver} onChange={(e) => setForm((c) => ({ ...c, receiver: e.target.value }))} />
            </label>
            <label className="field-row">
              <span>Diễn giải</span>
              <input disabled={disabled} value={form.reason} onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))} />
            </label>
            <label className="field-row">
              <span>NV bán / giao</span>
              <div className="field-split">
                <input disabled={disabled} value={form.salesStaff} onChange={(e) => setForm((c) => ({ ...c, salesStaff: e.target.value }))} placeholder="NV bán hàng" />
                <input disabled={disabled} value={form.deliveryStaff} onChange={(e) => setForm((c) => ({ ...c, deliveryStaff: e.target.value }))} placeholder="NV giao hàng" />
              </div>
            </label>
            <label className="field-row">
              <span>Địa chỉ giao</span>
              <input disabled={disabled} value={form.deliveryAddress} onChange={(e) => setForm((c) => ({ ...c, deliveryAddress: e.target.value }))} />
            </label>
            <label className="field-row">
              <span>SĐT / Email</span>
              <div className="field-split">
                <input disabled={disabled} value={form.customerPhone} onChange={(e) => setForm((c) => ({ ...c, customerPhone: e.target.value }))} />
                <input disabled={disabled} type="email" value={form.customerEmail} onChange={(e) => setForm((c) => ({ ...c, customerEmail: e.target.value }))} />
              </div>
            </label>
            <label className="field-row">
              <span>Nhóm khách</span>
              <select disabled={disabled} value={form.customerGroup} onChange={(e) => setForm((c) => ({ ...c, customerGroup: e.target.value }))}>
                <option value="dealer">Đại lý (BH 2 năm 3 tháng)</option>
                <option value="retail">Khách lẻ (BH 2 năm)</option>
              </select>
            </label>
          </fieldset>

          <fieldset className="voucher-frame">
            <legend>Chứng từ</legend>
            <label className="field-row">
              <span>Ngày ht</span>
              <input disabled={disabled} type="date" value={form.postingDate} onChange={(e) => setForm((c) => ({ ...c, postingDate: e.target.value }))} />
            </label>
            <label className="field-row">
              <span>Ngày lập PX</span>
              <input disabled={disabled} type="date" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value, postingDate: c.postingDate || e.target.value }))} />
            </label>
            <label className="field-row">
              <span>Quyển số</span>
              <input disabled={disabled} value={form.bookNumber} onChange={(e) => setForm((c) => ({ ...c, bookNumber: e.target.value }))} />
            </label>
            <label className="field-row">
              <span>Số phiếu xuất</span>
              <input value={form.number || "(tự cấp khi lưu)"} readOnly />
            </label>
            <label className="field-row">
              <span>Tỷ giá</span>
              <div className="field-split">
                <input disabled={disabled} value={form.currency} onChange={(e) => setForm((c) => ({ ...c, currency: e.target.value }))} />
                <input disabled={disabled} type="number" step="0.01" value={form.exchangeRate} onChange={(e) => setForm((c) => ({ ...c, exchangeRate: Number(e.target.value) }))} />
              </div>
            </label>
            <label className="field-row">
              <span>Trạng thái</span>
              <select disabled={disabled} value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}>
                <option value="draft">Lập chứng từ</option>
                <option value="posted">Đã ghi sổ cái</option>
              </select>
            </label>
            <label className="field-row">
              <span>Ngày đơn hàng</span>
              <input disabled={disabled} type="date" value={form.orderDate} onChange={(e) => setForm((c) => ({ ...c, orderDate: e.target.value }))} />
            </label>
            <label className="field-row">
              <span>Số đơn hàng</span>
              <input disabled={disabled} value={form.orderNumber} onChange={(e) => setForm((c) => ({ ...c, orderNumber: e.target.value }))} />
            </label>
            {form.id && (
              <p className="muted" style={{ marginTop: 8 }}>
                {statusLabel(form.status)} · {serialBadge(rows.find((row) => row.id === form.id) || ({} as StockOut))}
              </p>
            )}
          </fieldset>
        </div>

        <div className="voucher-tab">1. Hạch toán</div>
        <div className="table-wrap voucher-grid">
          <table>
            <thead>
              <tr>
                <th>Stt</th>
                <th>Mã SP/vật tư</th>
                <th>Tên SP/vật tư</th>
                <th>Đvt</th>
                <th>Mã hs</th>
                <th>Mã kho</th>
                <th>Mã kệ</th>
                <th>Mã lô</th>
                <th>Mã batch</th>
                <th>Số lượng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, lineIndex) => {
                const product = products.find((item) => item.id === (line.materialId || line.product?.id));
                return (
                  <tr key={lineIndex}>
                    <td>{lineIndex + 1}</td>
                    <td>
                      <select
                        disabled={disabled}
                        value={line.materialId || ""}
                        onChange={(e) => {
                          const next = products.find((item) => item.id === e.target.value);
                          setLine(lineIndex, {
                            materialId: e.target.value,
                            unit: next?.unit || "",
                            hsCode: next?.hsCode || "",
                          });
                        }}
                      >
                        <option value="">Chọn</option>
                        {products.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{product?.name || line.materialName || ""}</td>
                    <td>
                      <input disabled={disabled} value={line.unit || ""} onChange={(e) => setLine(lineIndex, { unit: e.target.value })} />
                    </td>
                    <td>
                      <input disabled={disabled} value={line.hsCode || ""} onChange={(e) => setLine(lineIndex, { hsCode: e.target.value })} />
                    </td>
                    <td>
                      <input disabled={disabled} value={line.warehouseCode || ""} onChange={(e) => setLine(lineIndex, { warehouseCode: e.target.value })} />
                    </td>
                    <td>
                      <input disabled={disabled} value={line.shelfCode || ""} onChange={(e) => setLine(lineIndex, { shelfCode: e.target.value })} />
                    </td>
                    <td>
                      <input disabled={disabled} value={line.lotCode || ""} onChange={(e) => setLine(lineIndex, { lotCode: e.target.value })} />
                    </td>
                    <td>
                      <input disabled={disabled} value={line.batchNo || ""} onChange={(e) => setLine(lineIndex, { batchNo: e.target.value })} />
                    </td>
                    <td>
                      <input disabled={disabled} type="number" min="1" step="1" value={line.quantity} onChange={(e) => setLine(lineIndex, { quantity: Number(e.target.value) })} />
                    </td>
                    <td>
                      <button type="button" className="ghost" disabled={disabled} onClick={() => setForm((c) => ({ ...c, lines: c.lines.filter((_, i) => i !== lineIndex) }))}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="actions" style={{ marginTop: 8 }}>
          <button type="button" className="ghost" disabled={disabled} onClick={() => setForm((c) => ({ ...c, lines: [...c.lines, emptyLine()] }))}>
            Thêm dòng
          </button>
        </div>

        <div className="voucher-foot">
          <label>
            Tổng số lượng
            <input value={totalQty.toLocaleString("vi-VN")} readOnly />
          </label>
          <label className="full">
            Ghi chú
            <input disabled={disabled} value={form.remark} onChange={(e) => setForm((c) => ({ ...c, remark: e.target.value }))} />
          </label>
        </div>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Số phiếu</th>
              <th>Ngày</th>
              <th>Khách hàng</th>
              <th>Trạng thái</th>
              <th>Serial</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === form.id ? "is-current" : ""} onClick={() => loadRow(row)}>
                <td>{row.number}</td>
                <td>{String(row.date).slice(0, 10)}</td>
                <td>{row.customerCode} {row.customerName || row.receiver}</td>
                <td>{statusLabel(row.status)}</td>
                <td>{serialBadge(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
