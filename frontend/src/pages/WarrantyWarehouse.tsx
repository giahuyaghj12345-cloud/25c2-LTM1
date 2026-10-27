import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { warrantyApi, type BhTicket, type BhWarehouse } from "../api";
import BhFlow from "../components/BhFlow";
import BhSuggest from "../components/BhSuggest";
import { day, MA_GD, money, printVoucher } from "../warranty";

/** Chỉ phiếu còn thao tác kho được (backend từ chối hoan_tat). */
const posted = ["ghi_so", "xac_nhan", "dang_sua"];

const blank = (): Partial<BhWarehouse> => ({
  ma_gd: 7,
  loai_nx: "xuat",
  status: "nhap",
  quyen_so: "PXBH",
  lines: [],
});

export default function WarrantyWarehouse() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<BhWarehouse[]>([]);
  const [tickets, setTickets] = useState<BhTicket[]>([]);
  const [customers, setCustomers] = useState<{ ma_kh: string; ten_kh?: string; dia_chi?: string }[]>([]);
  const [form, setForm] = useState(blank());
  const [error, setError] = useState("");
  const locked = form.status === "xac_nhan";
  const tongSl = (form.lines || []).reduce((n, line) => n + Number(line.so_luong || 0), 0);
  const tongTien = (form.lines || []).reduce((n, line) => n + Number(line.so_luong || 0) * Number(line.gia || 0), 0);

  const applyTicket = (ticket: BhTicket | undefined, maGd: number, nx: string) => {
    if (!ticket) return;
    setForm({
      ...blank(),
      phieuId: ticket.id,
      so_phieu: ticket.so_ct,
      so_serial: ticket.so_serial,
      ma_kh: ticket.ma_kh,
      ten_kh: ticket.ten_kh,
      dia_chi: ticket.dia_chi,
      nguoi_nhan: ticket.ten_kh,
      ma_gd: maGd,
      loai_nx: nx,
      quyen_so: "PXBH",
    });
  };

  const refresh = async () => {
    const [list, phieu, suggest] = await Promise.all([warrantyApi.warehouses(), warrantyApi.tickets(), warrantyApi.suggest()]);
    setCustomers(suggest.customers);
    const ready = phieu.filter((item) => posted.includes(item.status) && Number(item.hoan_tat) !== 1);
    setRows(list);
    setTickets(ready);
    const phieuId = params.get("phieu");
    if (phieuId) {
      applyTicket(ready.find((item) => item.id === phieuId), Number(params.get("mgd") || 7), params.get("nx") || "xuat");
    }
  };

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Không tải kho BH"));
  }, [params]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const saved = await warrantyApi.saveWarehouse(form);
      setForm(saved);
      const list = await warrantyApi.warehouses();
      setRows(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };

  const makeSerial = async () => {
    if (!form.so_serial) return setError("Phiếu chưa có serial cũ.");
    try {
      const created = await warrantyApi.replaceSerial(form.so_serial);
      setForm((c) => ({ ...c, serial_moi: created.so_serial }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được serial mới");
    }
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Kho bảo hành</h1>
          <p className="desk-note">{form.so_ct || "Phiếu xuất / nhập"} · {form.status === "xac_nhan" ? "Đã ghi sổ" : "Lập chứng từ"}</p>
        </div>
        <div className="desk-cmds">
          <button type="button" onClick={() => setForm(blank())}>Mới</button>
          <button type="submit" form="kho-form" disabled={locked}>Lưu</button>
          <button type="button" disabled={!form.id || locked} onClick={() => void warrantyApi.postWarehouse(form.id!).then(async (doc) => { setForm(doc); setRows(await warrantyApi.warehouses()); }).catch((err) => setError(err.message))}>Ghi sổ</button>
          <button type="button" disabled={!form.id} onClick={() => printVoucher(`Phiếu kho ${form.so_ct || ""}`, `<p>${MA_GD[Number(form.ma_gd)] || ""} · ${form.ten_kh || ""} · Serial ${form.so_serial || ""}</p><p>Tổng SL ${tongSl} · Tổng tiền ${money(tongTien)}</p>`)}>In</button>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <form id="kho-form" className="desk-sheet" onSubmit={onSubmit}>
        <div className="desk-cols">
          <fieldset>
            <legend>Thông tin chung</legend>
            <div className="desk-grid">
              <span>Phiếu BH DV</span>
              <select disabled={locked} value={form.phieuId || ""} onChange={(e) => applyTicket(tickets.find((item) => item.id === e.target.value), Number(form.ma_gd) || 7, form.loai_nx || "xuat")}>
                <option value="">Chọn phiếu đã ghi sổ</option>
                {tickets.map((item) => <option key={item.id} value={item.id}>{item.so_ct} — {item.ten_kh}</option>)}
              </select>
              <span>Mã giao dịch</span>
              <select disabled={locked} value={form.ma_gd || 7} onChange={(e) => setForm({ ...form, ma_gd: Number(e.target.value) })}>
                <option value={7}>7 - Xuất kho phụ tùng BH</option>
                <option value={8}>8 - Xuất SP 1 đổi 1</option>
                <option value={11}>11 - Nhập SP serial cũ</option>
                <option value={10}>10 - Nhập/xuất sau BH</option>
              </select>
              {Number(form.ma_gd) === 10 && (
                <>
                  <span>Nhập / xuất</span>
                  <select disabled={locked} value={form.loai_nx || "xuat"} onChange={(e) => setForm({ ...form, loai_nx: e.target.value })}>
                    <option value="nhap">Nhập kho SP sau BH</option>
                    <option value="xuat">Xuất kho giao khách</option>
                  </select>
                </>
              )}
              <span>Mã khách</span>
              <BhSuggest
                disabled={locked}
                value={form.ma_kh || ""}
                placeholder="KH..."
                items={customers.map((item) => ({ value: item.ma_kh, text: item.ten_kh || "", raw: item }))}
                onChange={(value) => setForm({ ...form, ma_kh: value })}
                onPick={(item) => setForm({ ...form, ma_kh: item.raw.ma_kh, ten_kh: item.raw.ten_kh || "", dia_chi: item.raw.dia_chi || "", nguoi_nhan: item.raw.ten_kh || "" })}
              />
              <span>Tên khách</span><input disabled={locked} value={form.ten_kh || ""} onChange={(e) => setForm({ ...form, ten_kh: e.target.value })} />
              <span>Địa chỉ</span><input disabled={locked} value={form.dia_chi || ""} onChange={(e) => setForm({ ...form, dia_chi: e.target.value })} />
              <span>Người nhận</span><input disabled={locked} value={form.nguoi_nhan || ""} onChange={(e) => setForm({ ...form, nguoi_nhan: e.target.value })} />
              <span>Diễn giải</span><input disabled={locked} value={form.dien_giai || ""} onChange={(e) => setForm({ ...form, dien_giai: e.target.value })} />
              <span>NV bán hàng</span><input disabled={locked} value={form.nv_ban || ""} onChange={(e) => setForm({ ...form, nv_ban: e.target.value })} />
              {Number(form.ma_gd) === 8 && (
                <>
                  <span>Serial mới</span>
                  <div className="desk-split">
                    <input disabled={locked} value={form.serial_moi || ""} onChange={(e) => setForm({ ...form, serial_moi: e.target.value })} />
                    <button type="button" disabled={locked} onClick={() => void makeSerial()}>Tạo serial mới</button>
                  </div>
                </>
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend>Chứng từ</legend>
            <div className="desk-grid">
              <span>Quyển số</span><input disabled={locked} value={form.quyen_so || "PXBH"} onChange={(e) => setForm({ ...form, quyen_so: e.target.value })} />
              <span>Số phiếu</span><input readOnly value={form.so_ct || ""} placeholder="Tự cấp khi lưu" />
              <span>Ngày</span><input readOnly value={day(form.ngay_ct)} />
              <span>TGGD</span><input readOnly value="VND" />
              <span>Tỷ giá</span><input readOnly value="1,00" />
              <span>Trạng thái</span><input readOnly value={form.status === "xac_nhan" ? "Đã ghi sổ" : "Chưa ghi sổ"} />
              <span>Số phiếu BH</span><input readOnly value={form.so_phieu || ""} />
              <span>Serial cũ</span><input readOnly value={form.so_serial || ""} />
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend>Hạch toán</legend>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>Mã kho</th><th>Tồn PT BH</th><th>Tk nợ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Serial</th></tr></thead>
              <tbody>
                {(form.lines || []).map((line, index) => (
                  <tr key={index}>
                    <td>{line.ma}</td><td>{line.ten}</td><td>{line.dvt}</td>
                    <td><input disabled={locked} value={line.ma_kho || ""} onChange={(e) => setForm({ ...form, lines: (form.lines || []).map((item, i) => i === index ? { ...item, ma_kho: e.target.value } : item) })} /></td>
                    <td>{line.ton ?? ""}</td>
                    <td><input disabled={locked} value={line.tk_no || ""} onChange={(e) => setForm({ ...form, lines: (form.lines || []).map((item, i) => i === index ? { ...item, tk_no: e.target.value } : item) })} /></td>
                    <td>{line.so_luong}</td><td>{money(line.gia)}</td><td>{money(Number(line.so_luong) * Number(line.gia))}</td><td>{line.so_serial}</td>
                  </tr>
                ))}
                {(form.lines || []).length === 0 && <tr><td colSpan={10}>Dòng hàng được lấy khi lưu: MGD 7 lấy phụ tùng trên phiếu, các mã khác lấy sản phẩm của phiếu.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="desk-note" style={{ marginTop: 8 }}>Số lượng {tongSl} · Tổng tiền {money(tongTien)}</p>
        </fieldset>
      </form>
      <div className="desk-browse table-wrap">
        <table>
          <thead><tr><th>Số</th><th>Ngày</th><th>Giao dịch</th><th>Phiếu DV</th><th>Serial</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === form.id ? "is-current" : ""} onClick={() => void warrantyApi.warehouse(row.id).then(setForm)}>
                <td>{row.so_ct}</td><td>{day(row.ngay_ct)}</td><td>{MA_GD[row.ma_gd] || row.ma_gd}</td><td>{row.so_phieu}</td><td>{row.so_serial}</td><td>{row.status === "xac_nhan" ? "Đã ghi sổ" : "Nháp"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
