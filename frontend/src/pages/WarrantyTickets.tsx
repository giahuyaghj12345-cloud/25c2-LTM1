import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { catalogApi, warrantyApi, type BhLine, type BhQuote, type BhTicket, type LaborCost, type Product } from "../api";
import { useAuth } from "../auth";
import BhFlow from "../components/BhFlow";
import BhLines from "../components/BhLines";
import BhSuggest from "../components/BhSuggest";
import BhTotals from "../components/BhTotals";
import { day, LOAI_BH, localNow, money, printVoucher, sumLines, TICKET_STATUS } from "../warranty";

const blank = (): Partial<BhTicket> & { lines: BhLine[] } => ({
  ngay_ct: day(),
  status: "nhap",
  loai_bh: 1,
  xuat_hd: 0,
  lay_pt_cu: 0,
  tg_tiep_nhan: localNow(),
  lines: [],
});

const posted = ["ghi_so", "xac_nhan", "dang_sua", "hoan_tat", "da_giao"];

export default function WarrantyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [rows, setRows] = useState<BhTicket[]>([]);
  const [quotes, setQuotes] = useState<BhQuote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [labors, setLabors] = useState<LaborCost[]>([]);
  const [customers, setCustomers] = useState<{ ma_kh: string; ten_kh?: string; dia_chi?: string; dien_thoai?: string; email?: string; mst?: string; cccd?: string }[]>([]);
  const [serials, setSerials] = useState<{ so_serial: string; ma_kh?: string; ten_kh?: string; ma_sp?: string; ten_sp?: string; so_batch?: string }[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState("");
  const locked = form.status !== "nhap" || Number(form.hoan_tat) === 1;
  const disabled = !editing || locked;
  const sum = sumLines(form.lines);
  const set = (part: Partial<BhTicket>) => setForm({ ...form, ...part });
  const loai = Number(form.loai_bh) || 1;
  const loai11 = loai === 2 || loai === 3;
  const finished = Number(form.hoan_tat) === 1 || form.status === "hoan_tat" || form.status === "da_giao";
  const canKho = Boolean(form.id) && posted.includes(form.status || "") && !finished;

  const refresh = async () => {
    const [list, bg, items, costs, hints] = await Promise.all([
      warrantyApi.tickets(), warrantyApi.quotes(), catalogApi.products(), catalogApi.labors(), warrantyApi.suggest(),
    ]);
    setRows(list);
    setQuotes(bg.filter((item) => item.status === "da_duyet"));
    setProducts(items);
    setLabors(costs);
    setCustomers(hints.customers);
    setSerials(hints.serials);
  };

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Không tải phiếu"));
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

  const open = async (id: string) => {
    const doc = await warrantyApi.ticket(id);
    setForm({
      ...doc,
      ngay_ct: day(doc.ngay_ct),
      lines: doc.lines || [],
      tg_tiep_nhan: doc.tg_tiep_nhan ? String(doc.tg_tiep_nhan).slice(0, 16) : "",
      tg_hoan_tra_dk: doc.tg_hoan_tra_dk ? String(doc.tg_hoan_tra_dk).slice(0, 16) : "",
      tg_hoan_tra_tt: doc.tg_hoan_tra_tt ? String(doc.tg_hoan_tra_tt).slice(0, 16) : "",
    });
    setEditing(false);
  };

  const pullQuote = async (id: string) => {
    const quote = await warrantyApi.quote(id);
    setForm({
      ...blank(),
      bg_id: quote.id,
      so_bg: quote.so_ct,
      ma_kh: quote.ma_kh,
      ten_kh: quote.ten_kh,
      dia_chi: quote.dia_chi,
      dien_thoai: quote.dien_thoai,
      email: quote.email,
      mst: quote.mst,
      cccd: quote.cccd,
      so_serial: quote.so_serial,
      ma_sp: quote.ma_sp,
      ten_sp: quote.ten_sp,
      hang_xe: quote.hang_xe,
      ten_xe: quote.ten_xe,
      nam_sx: quote.nam_sx,
      odo: quote.odo,
      bien_so: quote.bien_so,
      lo_sx: quote.lo_sx,
      tg_sd: quote.tg_sd,
      nguon_goc: quote.nguon_goc,
      lay_pt_cu: quote.lay_pt_cu,
      yeu_cau: quote.yeu_cau,
      tu_van: quote.tu_van,
      tt_sp: quote.tt_sp,
      xuat_hd: quote.xuat_hd,
      hd_ten: quote.ten_kh,
      hd_dia_chi: quote.dia_chi,
      hd_mst: quote.mst,
      hd_cccd: quote.cccd,
      hd_dt: quote.dien_thoai,
      hd_email: quote.email,
      lines: quote.lines || [],
    });
    setEditing(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const saved = await warrantyApi.saveTicket(form);
      setForm({ ...saved, ngay_ct: day(saved.ngay_ct), lines: saved.lines || [] });
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };

  const act = async (job: Promise<BhTicket>) => {
    try {
      const doc = await job;
      setForm({ ...doc, ngay_ct: day(doc.ngay_ct), lines: doc.lines || [] });
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thực hiện được");
    }
  };

  const kho = (ma: number, nx = "xuat") => {
    if (!form.id) return;
    navigate(`/warranty/warehouse?phieu=${form.id}&mgd=${ma}&nx=${nx}`);
  };

  const printDoc = () => {
    printVoucher(`Phiếu bảo hành ${form.so_ct || ""}`, `
      <div class="meta">
        <b>Số phiếu</b><span>${form.so_ct || ""}</span><b>Loại</b><span>${LOAI_BH[Number(form.loai_bh) || 1]}</span>
        <b>Khách</b><span>${form.ten_kh || ""}</span><b>Serial</b><span>${form.so_serial || ""}</span>
        <b>Yêu cầu</b><span>${form.yeu_cau || ""}</span><b>Tư vấn</b><span>${form.tu_van || ""}</span>
      </div>
      <table><thead><tr><th>Loại</th><th>Mã</th><th>Tên</th><th>KM</th><th>Tk</th><th>SL</th><th>Thành tiền</th><th>Ghi chú</th></tr></thead>
      <tbody>${form.lines.map((line) => `<tr><td>${line.loai === "tc" ? "Tiền công" : "Phụ tùng"}</td><td>${line.ma}</td><td>${line.ten}</td><td>${line.ten_km || ""}</td><td>${line.tk || ""}</td><td>${line.so_luong}</td><td>${money(line.so_luong * line.gia)}</td><td>${line.ghi_chu || ""}</td></tr>`).join("")}</tbody></table>
      <p><b>Tổng thanh toán: ${money(sum.pay)}</b></p>`, Number(window.prompt("Số liên in (1-3)", "1") || 1));
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Phiếu bảo hành dịch vụ</h1>
          <p className="desk-note">{form.so_ct || "Chưa cấp số"} · {TICKET_STATUS[form.status || "nhap"] || form.status}</p>
        </div>
        <div className="desk-cmds">
          <button type="button" onClick={() => { setForm(blank()); setEditing(true); }}>Mới</button>
          <button type="button" disabled={!form.id || locked} onClick={() => setEditing(true)}>Sửa</button>
          <button type="submit" form="ph-form" disabled={disabled}>Lưu</button>
          <button type="button" disabled={!form.id || form.status !== "nhap"} onClick={() => void act(warrantyApi.postTicket(form.id!))}>Ghi sổ</button>
          <button type="button" disabled={!editing} onClick={() => set({ tg_tiep_nhan: localNow() })}>Nhận</button>
          <button type="button" disabled={!form.id || Number(form.hoan_tat) === 1 || !posted.includes(form.status || "")} onClick={() => void act(warrantyApi.completeTicket(form.id!))}>Hoàn tất SC</button>
          <button type="button" disabled={!form.id} onClick={printDoc}>In phiếu</button>
          <button type="button" disabled={!form.id || !posted.includes(form.status || "") || Number(form.xuat_hd) !== 1} onClick={() => navigate(`/warranty/invoices?phieu=${form.id}`)}>Xuất HĐ GTGT</button>
          {user?.role === "admin" && <button type="button" className="danger" disabled={!form.id || Number(form.hoan_tat) === 1} onClick={() => void act(warrantyApi.cancelTicket(form.id!))}>Hủy phiếu</button>}
          <select disabled={!editing} defaultValue="" onChange={(e) => { if (e.target.value) void pullQuote(e.target.value); e.target.value = ""; }}>
            <option value="">Chọn báo giá đã ghi sổ</option>
            {quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.so_ct} — {quote.ten_kh}</option>)}
          </select>
        </div>
      </div>
      {Boolean(form.id) && posted.includes(form.status || "") && (
        <div className="desk-ops" style={{ marginBottom: 8 }}>
          {canKho && <button type="button" onClick={() => kho(7)}>Xuất kho PT BH</button>}
          {canKho && <button type="button" disabled={!loai11} onClick={() => kho(8)}>Xuất SP 1 đổi 1</button>}
          {canKho && <button type="button" disabled={!loai11} onClick={() => kho(11, "nhap")}>Nhập SP serial cũ</button>}
          {canKho && <button type="button" disabled={Number(form.da_nhap) === 1 || Number(form.da_giao) === 1} onClick={() => kho(10, "nhap")}>Nhập kho SP sau BH</button>}
          {canKho && <button type="button" disabled={loai11 || Number(form.da_nhap) !== 1 || Number(form.da_giao) === 1} onClick={() => kho(10, "xuat")}>Xuất kho giao KH</button>}
          <button type="button" onClick={() => navigate(`/warranty/receipts?phieu=${form.id}`)}>Thu ngân thu tiền</button>
        </div>
      )}
      {error && <div className="alert">{error}</div>}
      <form id="ph-form" className="desk-sheet" onSubmit={onSubmit}>
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
              <span>Số báo giá</span><input readOnly value={form.so_bg || ""} />
              <span>Loại BH DV</span>
              <select disabled={disabled} value={form.loai_bh || 1} onChange={(e) => set({ loai_bh: Number(e.target.value) })}>
                <option value={1}>1 - Sửa chữa</option>
                <option value={2}>2 - Sale 1 đổi 1</option>
                <option value={3}>3 - DV 1 đổi 1</option>
              </select>
              <span>Tiếp nhận</span><input disabled={disabled} type="datetime-local" value={(form.tg_tiep_nhan || "").slice(0, 16)} onChange={(e) => set({ tg_tiep_nhan: e.target.value })} />
              <span>Hoàn trả DK</span><input disabled={disabled} type="datetime-local" value={(form.tg_hoan_tra_dk || "").slice(0, 16)} onChange={(e) => set({ tg_hoan_tra_dk: e.target.value })} />
              <span>Hoàn trả TT</span><input readOnly value={(form.tg_hoan_tra_tt || "").replace("T", " ").slice(0, 16)} />
              <span>Yêu cầu KH</span><input disabled={disabled} value={form.yeu_cau || ""} onChange={(e) => set({ yeu_cau: e.target.value })} />
              <span>Tư vấn SC</span><input disabled={disabled} value={form.tu_van || ""} onChange={(e) => set({ tu_van: e.target.value })} />
              <span>Xuất hóa đơn</span>
              <select disabled={disabled} value={form.xuat_hd ? 1 : 0} onChange={(e) => set({ xuat_hd: Number(e.target.value) })}>
                <option value={0}>Không</option><option value={1}>Có</option>
              </select>
            </div>
          </fieldset>
          <fieldset>
            <legend>Chứng từ</legend>
            <div className="desk-grid">
              <span>Số phiếu</span><input readOnly value={form.so_ct || ""} placeholder="Tự cấp khi lưu" />
              <span>Ngày</span><input disabled={disabled} type="date" value={day(form.ngay_ct)} onChange={(e) => set({ ngay_ct: e.target.value })} />
              <span>Trạng thái</span><input readOnly value={TICKET_STATUS[form.status || "nhap"] || form.status || ""} />
              <span>Quyển số</span><input readOnly value="PBDV" />
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
            <span>Mã SP</span>
            <BhSuggest
              disabled={disabled}
              value={form.ma_sp || ""}
              items={products.map((item) => ({ value: item.code, text: item.name, raw: item }))}
              onChange={(ma_sp) => setForm((c) => ({ ...c, ma_sp }))}
              onPick={(item) => setForm((c) => ({ ...c, ma_sp: item.value, ten_sp: item.raw.name }))}
            />
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
            <span>Tên SP</span><input disabled={disabled} value={form.ten_sp || ""} onChange={(e) => set({ ten_sp: e.target.value })} />
            <span>Lô SX</span><input disabled={disabled} value={form.lo_sx || ""} onChange={(e) => set({ lo_sx: e.target.value })} />
            <span>TG sử dụng</span><input disabled={disabled} value={form.tg_sd || ""} onChange={(e) => set({ tg_sd: e.target.value })} />
            <span>Nguồn gốc</span><input disabled={disabled} value={form.nguon_goc || ""} onChange={(e) => set({ nguon_goc: e.target.value })} />
            <span>Tình trạng</span><input disabled={disabled} value={form.tt_sp || ""} onChange={(e) => set({ tt_sp: e.target.value })} />
            <label className="desk-check"><input type="checkbox" disabled={disabled} checked={Number(form.lay_pt_cu) === 1} onChange={(e) => set({ lay_pt_cu: e.target.checked ? 1 : 0 })} /> Xác nhận lấy lại phụ tùng cũ</label>
          </div>
        </fieldset>
        <BhLines title="Dịch vụ" loai="tc" lines={form.lines} disabled={disabled} ngay={form.ngay_ct} products={products} labors={labors} onChange={(lines) => setForm({ ...form, lines })} />
        <BhLines title="SP phụ tùng" loai="pt" lines={form.lines} disabled={disabled} ngay={form.ngay_ct} products={products} labors={labors} onChange={(lines) => setForm({ ...form, lines })} />
        {Number(form.xuat_hd) === 1 && (
          <fieldset>
            <legend>Thông tin xuất hóa đơn</legend>
            <div className="desk-grid">
              <span>Tên đơn vị</span><input disabled={disabled} value={form.hd_ten || ""} onChange={(e) => set({ hd_ten: e.target.value })} />
              <span>Địa chỉ</span><input disabled={disabled} value={form.hd_dia_chi || ""} onChange={(e) => set({ hd_dia_chi: e.target.value })} />
              <span>MST</span><input disabled={disabled} value={form.hd_mst || ""} onChange={(e) => set({ hd_mst: e.target.value })} />
              <span>CCCD</span><input disabled={disabled} value={form.hd_cccd || ""} onChange={(e) => set({ hd_cccd: e.target.value })} />
              <span>Điện thoại</span><input disabled={disabled} value={form.hd_dt || ""} onChange={(e) => set({ hd_dt: e.target.value })} />
              <span>Email</span><input disabled={disabled} value={form.hd_email || ""} onChange={(e) => set({ hd_email: e.target.value })} />
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend>Tổng tiền</legend>
          <BhTotals {...sum} />
        </fieldset>
      </form>
      <div className="desk-browse table-wrap">
        <table>
          <thead><tr><th>Số phiếu</th><th>Ngày</th><th>Loại</th><th>Khách</th><th>Serial</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === form.id ? "is-current" : ""} onClick={() => void open(row.id)}>
                <td>{row.so_ct}</td><td>{day(row.ngay_ct)}</td><td>{LOAI_BH[Number(row.loai_bh) || 1]}</td><td>{row.ten_kh}</td><td>{row.so_serial}</td><td>{TICKET_STATUS[row.status] || row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
