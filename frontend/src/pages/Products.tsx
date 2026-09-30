import { useEffect, useState, type FormEvent } from "react";
import { catalogApi, type Product, type ProductPrice } from "../api";

const emptyPrice = (): ProductPrice => ({
  effectiveDate: "",
  price: 0,
  priceVat: 0,
  customerGroup: "",
  customerCode: "",
});

const emptyForm = (): Partial<Product> => ({
  code: "",
  searchCode: "",
  name: "",
  name2: "",
  unit: "",
  multiUnit: false,
  trackShelf: false,
  keepStock: true,
  trackLot: false,
  costMethod: 1,
  editStockAccount: 0,
  kind: "",
  stockAccount: "",
  taxRate: 0,
  revenueAccount: "",
  returnAccount: "",
  internalRevenueAccount: "",
  varianceAccount: "",
  cogsAccount: "",
  wipAccount: "",
  groupCode: "",
  groupCode2: "",
  groupCode3: "",
  minQty: 0,
  maxQty: 0,
  industryCode: "",
  note: "",
  status: "1",
  vatRate: 0,
  envTax: 0,
  discountCode: "",
  typeCode: "",
  hsCode: "",
  brand: "",
  family: "",
  color: "",
  carModel: "",
  modelYear: "",
  origin: "",
  prices: [emptyPrice()],
  quantity: 0,
});

export default function Products() {
  const [rows, setRows] = useState<Product[]>([]);
  const [form, setForm] = useState<Partial<Product>>(emptyForm);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const refresh = async () => {
    try {
      const items = await catalogApi.products();
      let qty = new Map<string, number>();
      try {
        const stock = await catalogApi.inventory();
        qty = new Map(stock.map((item) => [item.id, item.quantity]));
      } catch {
        qty = new Map();
      }
      setRows(items.map((item) => ({ ...item, quantity: qty.get(item.id) ?? 0 })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh mục sản phẩm");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const prices = form.prices?.length ? form.prices : [emptyPrice()];

  const setPrice = (index: number, patch: Partial<ProductPrice>) => {
    setForm((current) => {
      const next = [...(current.prices?.length ? current.prices : [emptyPrice()])];
      next[index] = { ...next[index], ...patch };
      return { ...current, prices: next };
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await catalogApi.saveProduct(form);
      setForm(emptyForm());
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };

  return (
    <section className="biz">
      <div className="page-head">
        <h1>Danh mục sản phẩm{editing ? " — đang sửa" : ""}</h1>
      </div>
      {error && <div className="alert">{error}</div>}
      <form className="card form-grid dmvt-form" onSubmit={onSubmit}>
        <label>
          Mã VT
          <input value={form.code || ""} readOnly placeholder="Hệ thống tự tạo" />
          <small className="sys-hint">Hệ thống tự tạo</small>
        </label>
        <label>
          Mã tra cứu
          <input value={form.searchCode || ""} readOnly placeholder="Hệ thống tự tạo" />
          <small className="sys-hint">Hệ thống tự tạo</small>
        </label>
        <label className="full">
          Tên sản phẩm, vật tư
          <input value={form.name || ""} onChange={(e) => setField("name", e.target.value)} required />
        </label>
        <label className="full">
          Tên 2
          <input value={form.name2 || ""} onChange={(e) => setField("name2", e.target.value)} />
        </label>
        <label>
          Đơn vị tính
          <input value={form.unit || ""} onChange={(e) => setField("unit", e.target.value)} />
        </label>
        <label>
          Nước xuất xứ
          <input value={form.origin || ""} onChange={(e) => setField("origin", e.target.value)} />
        </label>

        <div className="dmvt-checks">
          <label className="check-row">
            <input type="checkbox" checked={Boolean(form.multiUnit)} onChange={(e) => setField("multiUnit", e.target.checked)} />
            Nhiều đvt
          </label>
          <label className="check-row">
            <input type="checkbox" checked={Boolean(form.trackShelf)} onChange={(e) => setField("trackShelf", e.target.checked)} />
            Theo dõi theo kệ
          </label>
          <label className="check-row">
            <input type="checkbox" checked={form.keepStock !== false} onChange={(e) => setField("keepStock", e.target.checked)} />
            Theo dõi tồn kho
          </label>
          <label className="check-row">
            <input type="checkbox" checked={Boolean(form.trackLot)} onChange={(e) => setField("trackLot", e.target.checked)} />
            Theo dõi lô
          </label>
        </div>

        <label>
          Cách tính giá tồn kho
          <select value={String(form.costMethod ?? 1)} onChange={(e) => setField("costMethod", Number(e.target.value))}>
            <option value="0">0 - Thực tế đích danh</option>
            <option value="1">1 - Trung bình tháng</option>
            <option value="2">2 - Trung bình di động</option>
            <option value="3">3 - Nhập trước xuất trước</option>
          </select>
        </label>
        <label>
          Loại vật tư
          <input value={form.kind || ""} onChange={(e) => setField("kind", e.target.value)} />
        </label>
        <label>
          Tài khoản kho
          <input value={form.stockAccount || ""} onChange={(e) => setField("stockAccount", e.target.value)} />
        </label>
        <label>
          Thuế suất
          <input type="number" value={form.taxRate ?? 0} onChange={(e) => setField("taxRate", Number(e.target.value))} />
        </label>
        <label>
          Sửa tài khoản kho
          <select value={String(form.editStockAccount ?? 0)} onChange={(e) => setField("editStockAccount", Number(e.target.value))}>
            <option value="0">0 - Không</option>
            <option value="1">1 - Được</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select value={form.status || "1"} onChange={(e) => setField("status", e.target.value)}>
            <option value="0">0 - Không sử dụng</option>
            <option value="1">1 - Sử dụng</option>
          </select>
        </label>

        <label>
          Tài khoản doanh thu
          <input value={form.revenueAccount || ""} onChange={(e) => setField("revenueAccount", e.target.value)} />
        </label>
        <label>
          Tài khoản hàng bán bị trả lại
          <input value={form.returnAccount || ""} onChange={(e) => setField("returnAccount", e.target.value)} />
        </label>
        <label>
          Tài khoản doanh thu nội bộ
          <input value={form.internalRevenueAccount || ""} onChange={(e) => setField("internalRevenueAccount", e.target.value)} />
        </label>
        <label>
          Tài khoản chênh lệch giá vật tư
          <input value={form.varianceAccount || ""} onChange={(e) => setField("varianceAccount", e.target.value)} />
        </label>
        <label>
          Tài khoản giá vốn
          <input value={form.cogsAccount || ""} onChange={(e) => setField("cogsAccount", e.target.value)} />
        </label>
        <label>
          Tài khoản sản phẩm dở dang
          <input value={form.wipAccount || ""} onChange={(e) => setField("wipAccount", e.target.value)} />
        </label>

        <label>
          Số tồn
          <input className="stock-qty" value={Number(form.quantity || 0).toLocaleString("vi-VN", { minimumFractionDigits: 3 })} readOnly />
        </label>
        <label>
          Nhóm SP, vật tư 1
          <input value={form.groupCode || ""} onChange={(e) => setField("groupCode", e.target.value.toUpperCase())} />
          <small className="sys-hint">3 ký tự đầu dùng trong mã Serial (PART → PAR)</small>
        </label>
        <label>
          Số lượng tồn tối thiểu
          <input type="number" value={form.minQty ?? 0} onChange={(e) => setField("minQty", Number(e.target.value))} />
        </label>
        <label>
          Nhóm SP, vật tư 2
          <input value={form.groupCode2 || ""} onChange={(e) => setField("groupCode2", e.target.value)} />
        </label>
        <label>
          Số lượng tồn tối đa
          <input type="number" value={form.maxQty ?? 0} onChange={(e) => setField("maxQty", Number(e.target.value))} />
        </label>
        <label>
          Nhóm 3
          <input value={form.groupCode3 || ""} onChange={(e) => setField("groupCode3", e.target.value)} />
        </label>
        <label>
          Mã ngành
          <input value={form.industryCode || ""} onChange={(e) => setField("industryCode", e.target.value)} />
        </label>
        <label>
          Thuế GTGT
          <input type="number" value={form.vatRate ?? 0} onChange={(e) => setField("vatRate", Number(e.target.value))} />
        </label>
        <label>
          Thuế BVMT
          <input type="number" value={form.envTax ?? 0} onChange={(e) => setField("envTax", Number(e.target.value))} />
        </label>
        <label>
          Mã % CK (Sale Group)
          <input value={form.discountCode || ""} onChange={(e) => setField("discountCode", e.target.value)} />
        </label>
        <label>
          Loại mã (Type code)
          <input value={form.typeCode || ""} onChange={(e) => setField("typeCode", e.target.value)} />
        </label>
        <label>
          Mã HS code
          <input value={form.hsCode || ""} onChange={(e) => setField("hsCode", e.target.value)} />
        </label>
        <label>
          Thương hiệu
          <input value={form.brand || ""} onChange={(e) => setField("brand", e.target.value)} />
        </label>
        <label>
          Gia đình SP
          <input value={form.family || ""} onChange={(e) => setField("family", e.target.value)} />
        </label>
        <label>
          Màu sắc
          <input value={form.color || ""} onChange={(e) => setField("color", e.target.value)} />
        </label>
        <label>
          Mẫu xe
          <input value={form.carModel || ""} onChange={(e) => setField("carModel", e.target.value)} />
        </label>
        <label>
          Năm SX của mẫu xe
          <input value={form.modelYear || ""} onChange={(e) => setField("modelYear", e.target.value)} />
        </label>
        <label className="full">
          Ghi chú
          <input value={form.note || ""} onChange={(e) => setField("note", e.target.value)} />
        </label>

        <div className="full price-block">
          <div className="price-head">
            <strong>Giá bán</strong>
            <button type="button" className="ghost" onClick={() => setForm((c) => ({ ...c, prices: [...prices, emptyPrice()] }))}>
              Thêm dòng giá
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ngày hiệu lực</th>
                  <th>Giá</th>
                  <th>Giá có VAT</th>
                  <th>Nhóm khách hàng</th>
                  <th>Mã khách hàng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prices.map((row, index) => (
                  <tr key={row.id || index}>
                    <td>
                      <input type="date" value={row.effectiveDate || ""} onChange={(e) => setPrice(index, { effectiveDate: e.target.value })} />
                    </td>
                    <td>
                      <input type="number" value={row.price ?? 0} onChange={(e) => setPrice(index, { price: Number(e.target.value) })} />
                    </td>
                    <td>
                      <input type="number" value={row.priceVat ?? 0} onChange={(e) => setPrice(index, { priceVat: Number(e.target.value) })} />
                    </td>
                    <td>
                      <input value={row.customerGroup || ""} onChange={(e) => setPrice(index, { customerGroup: e.target.value })} />
                    </td>
                    <td>
                      <input value={row.customerCode || ""} onChange={(e) => setPrice(index, { customerCode: e.target.value })} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() =>
                          setForm((c) => ({
                            ...c,
                            prices: prices.filter((_, i) => i !== index).length ? prices.filter((_, i) => i !== index) : [emptyPrice()],
                          }))
                        }
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="actions">
          <button type="submit">Nhận</button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setForm(emptyForm());
              setEditing(false);
            }}
          >
            Hủy bỏ
          </button>
        </div>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên</th>
              <th>ĐVT</th>
              <th>Nhóm 1</th>
              <th>Tồn kho</th>
              <th>TT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.unit}</td>
                <td>{row.groupCode}</td>
                <td>{row.keepStock ? "Có" : "Không"}</td>
                <td>{row.status === "1" ? "Sử dụng" : "Ngưng"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setForm({
                          ...emptyForm(),
                          ...row,
                          prices: row.prices?.length
                            ? row.prices.map((price) => ({
                                ...price,
                                effectiveDate: price.effectiveDate ? String(price.effectiveDate).slice(0, 10) : "",
                              }))
                            : [emptyPrice()],
                        });
                        setEditing(true);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (confirm("Xóa dòng này?")) void catalogApi.deleteProduct(row.id).then(() => refresh());
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
