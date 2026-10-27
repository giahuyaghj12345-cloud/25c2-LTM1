import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { catalogApi, warrantyApi, type BhLine, type BhQuote, type LaborCost, type Product } from "../api";
import BhFlow from "../components/BhFlow";
import BhLines from "../components/BhLines";
import BhSuggest from "../components/BhSuggest";
import BhTotals from "../components/BhTotals";
import { day, localNow, money, printVoucher, QUOTE_STATUS, sumLines } from "../warranty";

const blank = (): Partial<BhQuote> & { lines: BhLine[] } => ({
  ngay_ct: day(),
  status: "nhap",
  xuat_hd: 0,
  lay_pt_cu: 0,
  tg_tiep_nhan: localNow(),
  dien_giai: "Báo giá bảo hành",
  lines: [],
});

export default function WarrantyQuotes() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [rows, setRows] = useState<BhQuote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [labors, setLabors] = useState<LaborCost[]>([]);
  const [customers, setCustomers] = useState<{ ma_kh: string; ten_kh?: string; dia_chi?: string; dien_thoai?: string; email?: string; mst?: string; cccd?: string }[]>([]);
  const [serials, setSerials] = useState<{ so_serial: string; ma_kh?: string; ten_kh?: string; ma_sp?: string; ten_sp?: string; so_batch?: string }[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState("");
  const locked = form.status === "da_duyet";
  const disabled = !editing || locked;
  const sum = sumLines(form.lines);
  const set = (part: Partial<BhQuote>) => setForm({ ...form, ...part });

  const refresh = async () => {
    const [list, items, costs, hints] = await Promise.all([warrantyApi.quotes(), catalogApi.products(), catalogApi.labors(), warrantyApi.suggest()]);
    setRows(list);
    setProducts(items);
    setLabors(costs);
    setCustomers(hints.customers);
    setSerials(hints.serials);
  };

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Không tải báo giá"));
    const serial = params.get("serial");
    if (!serial) return;
    void warrantyApi.serial(serial).then((info) => setForm((current) => ({
      ...current,
      so_serial: String(info.so_serial || serial),
      ma_kh: info.ma_kh || current.ma_kh,
      ten_kh: info.ten_kh || current.ten_kh,
      ma_sp: info.ma_sp || current.ma_sp,
      ten_sp: info.ten_sp || current.ten_sp,
      lo_sx: info.so_batch || current.lo_sx,
    }))).catch((err) => setError(err instanceof Error ? err.message : "Không thấy serial"));
  }, [params]);

  const load = async (id: string) => {
    const doc = await warrantyApi.quote(id);
    setForm({ ...doc, ngay_ct: day(doc.ngay_ct), lines: doc.lines || [] });
    setEditing(false);
    setError("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const saved = await warrantyApi.saveQuote(form);
      setForm({ ...saved, ngay_ct: day(saved.ngay_ct), lines: saved.lines || [] });
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };

  const printDoc = () => {
    printVoucher(`Báo giá ${form.so_ct || ""}`, `
      <div class="meta">
        <b>Số</b><span>${form.so_ct || ""}</span><b>Ngày</b><span>${day(form.ngay_ct)}</span>
        <b>Khách</b><span>${form.ma_kh || ""} ${form.ten_kh || ""}</span><b>Serial</b><span>${form.so_serial || ""}</span>
        <b>Sản phẩm</b><span>${form.ma_sp || ""} ${form.ten_sp || ""}</span><b>Xe</b><span>${form.hang_xe || ""} ${form.ten_xe || ""} ${form.bien_so || ""}</span>
      </div>
      <table><thead><tr><th>Loại</th><th>Mã</th><th>Tên</th><th>KM</th><th>Tk</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Ghi chú</th></tr></thead>
      <tbody>${form.lines.map((line) => `<tr><td>${line.loai === "tc" ? "Tiền công" : "Phụ tùng"}</td><td>${line.ma}</td><td>${line.ten}</td><td>${line.ten_km || ""}</td><td>${line.tk || ""}</td><td>${line.so_luong}</td><td>${money(line.gia)}</td><td>${money(line.so_luong * line.gia)}</td><td>${line.ghi_chu || ""}</td></tr>`).join("")}</tbody></table>
      <p><b>Thanh toán: ${money(sum.pay)}</b></p>`, Number(window.prompt("Số liên in (1-3)", "1") || 1));
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Báo giá bảo hành</h1>
          <p className="desk-note">{form.so_ct || "Chưa cấp số"} · {QUOTE_STATUS[form.status || "nhap"] || form.status}</p>
        </div>
        <div className="desk-cmds">
          <button type="button" onClick={() => { setForm(blank()); setEditing(true); }}>Mới</button>
          <button type="button" disabled={!form.id || locked} onClick={() => setEditing(true)}>Sửa</button>
          <button type="submit" form="bg-form" disabled={disabled}>Lưu</button>
          <button type="button" disabled={!form.id || locked} onClick={() => void warrantyApi.postQuote(form.id!).then(async (doc) => { setForm({ ...doc, ngay_ct: day(doc.ngay_ct), lines: doc.lines || [] }); await refresh(); }).catch((err) => setError(err.message))}>Ghi sổ</button>
          <button type="button" disabled={!form.id || form.status !== "da_duyet"} onClick={() => navigate(`/warranty/tickets?bg=${encodeURIComponent(form.id!)}`)}>Lập phiếu BH</button>
          <button type="button" disabled={!form.id} onClick={printDoc}>In</button>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <form id="bg-form" className="desk-sheet" onSubmit={onSubmit}>
        <div className="desk-cols">
          <fieldset>
            <legend>Thông tin chung</legend>
            <div className="desk-grid">
              <span>Mã khách</span>
              <BhSuggest
                disabled={disabled}
                value={form.ma_kh || ""}
                items={customers.map((item) => ({ value: item.ma_kh, text: item.ten_kh || "", raw: item }))}
                onChange={(ma_kh) => setForm((c) => ({ ...c, ma_kh }))}
                onPick={(item) => setForm((c) => ({ ...c, ma_kh: item.value, ten_kh: item.raw.ten_kh || c.ten_kh, dia_chi: item.raw.dia_chi || c.dia_chi, dien_thoai: item.raw.dien_thoai || c.dien_thoai, email: item.raw.email || c.email, mst: item.raw.mst || c.mst, cccd: item.raw.cccd || c.cccd }))}
              />
              <span>Tên khách</span><input disabled={disabled} value={form.ten_kh || ""} onChange={(e) => set({ ten_kh: e.target.value })} />
              <span>MST</span><input disabled={disabled} value={form.mst || ""} onChange={(e) => set({ mst: e.target.value })} />
              <span>CCCD</span><input disabled={disabled} value={form.cccd || ""} onChange={(e) => set({ cccd: e.target.value })} />
              <span>Địa chỉ</span><input disabled={disabled} value={form.dia_chi || ""} onChange={(e) => set({ dia_chi: e.target.value })} />
              <span>Email</span><input disabled={disabled} value={form.email || ""} onChange={(e) => set({ email: e.target.value })} />
              <span>Điện thoại</span><input disabled={disabled} value={form.dien_thoai || ""} onChange={(e) => set({ dien_thoai: e.target.value })} />
              <span>Tiếp nhận</span><input disabled={disabled} type="datetime-local" value={(form.tg_tiep_nhan || "").slice(0, 16)} onChange={(e) => set({ tg_tiep_nhan: e.target.value })} />
              <span>Hoàn trả DK</span><input disabled={disabled} type="datetime-local" value={(form.tg_hoan_tra_dk || "").slice(0, 16)} onChange={(e) => set({ tg_hoan_tra_dk: e.target.value })} />
              <span>Xuất HĐ</span>
              <select disabled={disabled} value={form.xuat_hd ? 1 : 0} onChange={(e) => set({ xuat_hd: Number(e.target.value) })}>
                <option value={0}>Không</option><option value={1}>Có</option>
              </select>
              <span>Yêu cầu KH</span><input disabled={disabled} value={form.yeu_cau || ""} onChange={(e) => set({ yeu_cau: e.target.value })} />
              <span>Tư vấn SC</span><input disabled={disabled} value={form.tu_van || ""} onChange={(e) => set({ tu_van: e.target.value })} />
            </div>
          </fieldset>
          <fieldset>
            <legend>Chứng từ</legend>
            <div className="desk-grid">
              <span>Số báo giá</span><input readOnly value={form.so_ct || ""} placeholder="Tự cấp khi lưu" />
              <span>Ngày</span><input disabled={disabled} type="date" value={day(form.ngay_ct)} onChange={(e) => set({ ngay_ct: e.target.value })} />
              <span>Trạng thái</span><input readOnly value={QUOTE_STATUS[form.status || "nhap"] || form.status} />
              <span>Diễn giải</span><input disabled={disabled} value={form.dien_giai || ""} onChange={(e) => set({ dien_giai: e.target.value })} />
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend>Thông tin SP bảo hành</legend>
          <div className="desk-grid">
            <span>Hãng xe</span><input disabled={disabled} value={form.hang_xe || ""} onChange={(e) => set({ hang_xe: e.target.value })} />
            <span>Tên xe</span><input disabled={disabled} value={form.ten_xe || ""} onChange={(e) => set({ ten_xe: e.target.value })} />
            <span>Năm SX</span><input disabled={disabled} value={form.nam_sx || ""} onChange={(e) => set({ nam_sx: e.target.value })} />
            <span>ODO</span><input disabled={disabled} value={form.odo || ""} onChange={(e) => set({ odo: e.target.value })} />
            <span>Biển số</span><input disabled={disabled} value={form.bien_so || ""} onChange={(e) => set({ bien_so: e.target.value })} />
            <span>Loại SP</span><input disabled={disabled} value={form.loai_sp || ""} onChange={(e) => set({ loai_sp: e.target.value })} />
            <span>Mã SP</span>
            <BhSuggest
              disabled={disabled}
              value={form.ma_sp || ""}
              items={products.map((item) => ({ value: item.code, text: item.name, raw: item }))}
              onChange={(ma_sp) => setForm((c) => ({ ...c, ma_sp }))}
              onPick={(item) => setForm((c) => ({ ...c, ma_sp: item.value, ten_sp: item.raw.name }))}
            />
            <span>Tên SP</span><input disabled={disabled} value={form.ten_sp || ""} onChange={(e) => set({ ten_sp: e.target.value })} />
            <span>Lô SX</span><input disabled={disabled} value={form.lo_sx || ""} onChange={(e) => set({ lo_sx: e.target.value })} />
            <span>Serial</span>
            <BhSuggest
              disabled={disabled}
              value={form.so_serial || ""}
              items={serials.map((item) => ({ value: item.so_serial, text: `${item.ten_sp || ""} ${item.ten_kh || ""}`.trim(), raw: item }))}
              onChange={(so_serial) => setForm((c) => ({ ...c, so_serial }))}
              onPick={(item) => setForm((c) => ({
                ...c,
                so_serial: item.value,
                ma_kh: item.raw.ma_kh || c.ma_kh,
                ten_kh: item.raw.ten_kh || c.ten_kh,
                ma_sp: item.raw.ma_sp || c.ma_sp,
                ten_sp: item.raw.ten_sp || c.ten_sp,
                lo_sx: item.raw.so_batch || c.lo_sx,
              }))}
            />
            <span>TG sử dụng</span><input disabled={disabled} value={form.tg_sd || ""} onChange={(e) => set({ tg_sd: e.target.value })} />
            <span>Nguồn gốc</span><input disabled={disabled} value={form.nguon_goc || ""} onChange={(e) => set({ nguon_goc: e.target.value })} />
            <span>Tình trạng</span><input disabled={disabled} value={form.tt_sp || ""} onChange={(e) => set({ tt_sp: e.target.value })} />
            <label className="desk-check"><input type="checkbox" disabled={disabled} checked={Number(form.lay_pt_cu) === 1} onChange={(e) => set({ lay_pt_cu: e.target.checked ? 1 : 0 })} /> Xác nhận lấy lại phụ tùng cũ</label>
          </div>
        </fieldset>
        <BhLines title="Dịch vụ" loai="tc" lines={form.lines} disabled={disabled} ngay={form.ngay_ct} products={products} labors={labors} onChange={(lines) => setForm({ ...form, lines })} />
        <BhLines title="SP phụ tùng" loai="pt" lines={form.lines} disabled={disabled} ngay={form.ngay_ct} products={products} labors={labors} onChange={(lines) => setForm({ ...form, lines })} />
        <fieldset>
          <legend>Tổng tiền</legend>
          <BhTotals {...sum} />
        </fieldset>
      </form>
      <div className="desk-browse table-wrap">
        <table>
          <thead><tr><th>Số BG</th><th>Ngày</th><th>Khách</th><th>Serial</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === form.id ? "is-current" : ""} onClick={() => void load(row.id)}>
                <td>{row.so_ct}</td><td>{day(row.ngay_ct)}</td><td>{row.ten_kh}</td><td>{row.so_serial}</td><td>{money(row.t_tien)}</td><td>{QUOTE_STATUS[row.status] || row.status}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}>Chưa có báo giá</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
