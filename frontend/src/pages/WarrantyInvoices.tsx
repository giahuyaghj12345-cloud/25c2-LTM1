import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { warrantyApi, type BhInvoice, type BhTicket } from "../api";
import BhFlow from "../components/BhFlow";
import BhSuggest from "../components/BhSuggest";
import BhTotals from "../components/BhTotals";
import { day, money, printVoucher, sumLines } from "../warranty";

export default function WarrantyInvoices() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<BhInvoice[]>([]);
  const [tickets, setTickets] = useState<BhTicket[]>([]);
  const [current, setCurrent] = useState<BhInvoice | null>(null);
  const [phieuId, setPhieuId] = useState(params.get("phieu") || "");
  const [customers, setCustomers] = useState<{ ma_kh: string; ten_kh?: string; dia_chi?: string }[]>([]);
  const [maKh, setMaKh] = useState("");
  const [tenKh, setTenKh] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [error, setError] = useState("");
  const sum = sumLines(current?.lines || []);

  const refresh = async () => {
    const [list, phieu, suggest] = await Promise.all([warrantyApi.invoices(), warrantyApi.tickets(), warrantyApi.suggest()]);
    setRows(list);
    setCustomers(suggest.customers);
    const ready = phieu.filter((item) => Number(item.xuat_hd) === 1 && item.status !== "nhap" && item.status !== "huy");
    setTickets(ready);
    const id = params.get("phieu");
    if (id) {
      const found = ready.find((item) => item.id === id);
      setPhieuId(id);
      setMaKh(found?.ma_kh || "");
      setTenKh(found?.hd_ten || found?.ten_kh || "");
      setDiaChi(found?.hd_dia_chi || found?.dia_chi || "");
    }
  };

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Không tải hóa đơn"));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const doc = await warrantyApi.saveInvoice({ phieuId, ma_kh: maKh, ten_kh: tenKh, dia_chi: diaChi });
      setCurrent(doc);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lập được hóa đơn");
    }
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Hóa đơn GTGT bảo hành</h1>
          <p className="desk-note">Mã giao dịch 9 · {current?.so_ct || "Chưa lập"} · {current?.status === "ghi_so" ? "Đã ghi sổ" : "Lập chứng từ"}</p>
        </div>
        <div className="desk-cmds">
          <button type="submit" form="hd-form" disabled={Boolean(current?.id)}>Lưu</button>
          <button type="button" disabled={!current?.id || current.status === "ghi_so"} onClick={() => void warrantyApi.postInvoice(current!.id).then(async (doc) => { setCurrent(doc); await refresh(); }).catch((err) => setError(err.message))}>Ghi sổ</button>
          <button type="button" disabled={!current} onClick={() => current && printVoucher(`Hóa đơn ${current.so_ct}`, `<p>${current.ten_kh || ""} · MST ${current.mst || ""}</p><p>Tổng ${money(current.t_tien)}</p>`)}>In</button>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <form id="hd-form" className="desk-sheet" onSubmit={onSubmit}>
        <div className="desk-cols">
          <fieldset>
            <legend>Thông tin chung</legend>
            <div className="desk-grid">
              <span>Mã giao dịch</span><input readOnly value="9 - Hóa đơn GTGT bảo hành" />
              <span>Phiếu BH DV</span>
              <select required value={phieuId} onChange={(e) => {
                const found = tickets.find((item) => item.id === e.target.value);
                setPhieuId(e.target.value);
                setCurrent(null);
                setMaKh(found?.ma_kh || "");
                setTenKh(found?.hd_ten || found?.ten_kh || "");
                setDiaChi(found?.hd_dia_chi || found?.dia_chi || "");
              }}>
                <option value="">Chọn phiếu có xuất hóa đơn</option>
                {tickets.map((item) => <option key={item.id} value={item.id}>{item.so_ct} — {item.ten_kh}</option>)}
              </select>
              <span>Mã khách</span>
              <BhSuggest
                disabled={Boolean(current?.id)}
                value={current?.ma_kh || maKh}
                placeholder="KH..."
                items={customers.map((item) => ({ value: item.ma_kh, text: item.ten_kh || "", raw: item }))}
                onChange={setMaKh}
                onPick={(item) => {
                  setMaKh(item.raw.ma_kh);
                  setTenKh(item.raw.ten_kh || "");
                  setDiaChi(item.raw.dia_chi || "");
                }}
              />
              <span>Tên trên HĐ</span><input disabled={Boolean(current?.id)} value={current?.ten_kh || tenKh} onChange={(e) => setTenKh(e.target.value)} />
              <span>Địa chỉ</span><input disabled={Boolean(current?.id)} value={current?.dia_chi || diaChi} onChange={(e) => setDiaChi(e.target.value)} />
              <span>MST</span><input readOnly value={current?.mst || ""} />
            </div>
          </fieldset>
          <fieldset>
            <legend>Chứng từ</legend>
            <div className="desk-grid">
              <span>Số hóa đơn</span><input readOnly value={current?.so_ct || ""} placeholder="Tự cấp khi lưu" />
              <span>Ngày lập</span><input readOnly value={day(current?.ngay_ct)} />
              <span>Số phiếu BH</span><input readOnly value={current?.so_phieu || ""} />
              <span>Trạng thái</span><input readOnly value={current?.status === "ghi_so" ? "Đã ghi sổ" : current ? "Chưa ghi sổ" : ""} />
              <span>Điện thoại</span><input readOnly value={current?.dien_thoai || ""} />
              <span>Email</span><input readOnly value={current?.email || ""} />
              <span>CCCD</span><input readOnly value={current?.cccd || ""} />
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend>Dịch vụ và phụ tùng</legend>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Loại</th><th>Mã</th><th>Tên</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {(current?.lines || []).map((line, index) => (
                  <tr key={index}><td>{line.loai === "tc" ? "Tiền công" : "Phụ tùng"}</td><td>{line.ma}</td><td>{line.ten}</td><td>{line.so_luong}</td><td>{money(line.gia)}</td><td>{money(line.tien)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
        <fieldset>
          <legend>Tổng cộng</legend>
          <BhTotals {...sum} />
        </fieldset>
      </form>
      <div className="desk-browse table-wrap">
        <table>
          <thead><tr><th>Số HĐ</th><th>Ngày</th><th>Phiếu</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => void warrantyApi.invoice(row.id).then((doc) => { setCurrent(doc); setPhieuId(doc.phieuId || ""); })}>
                <td>{row.so_ct}</td><td>{day(row.ngay_ct)}</td><td>{row.so_phieu}</td><td>{row.ten_kh}</td><td>{money(row.t_tien)}</td><td>{row.status === "ghi_so" ? "Đã ghi sổ" : "Chưa ghi sổ"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
