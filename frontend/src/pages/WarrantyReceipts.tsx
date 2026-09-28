import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { warrantyApi, type BhReceipt, type BhTicket } from "../api";
import BhFlow from "../components/BhFlow";
import BhSuggest from "../components/BhSuggest";
import { day, money, printVoucher } from "../warranty";

const posted = ["ghi_so", "xac_nhan", "dang_sua", "hoan_tat", "da_giao"];

type ThuLine = { so_serial: string; tk_no: string; ten_tk: string; so_tien: number; ghi_chu: string; so_ct_dv: string; ngay_ct_dv: string };

const seedLine = (found?: BhTicket): ThuLine => ({
  so_serial: found?.so_serial || "",
  tk_no: "131",
  ten_tk: "Phải thu khách hàng",
  so_tien: Number(found?.t_tt || 0),
  ghi_chu: "Thu bảo hành",
  so_ct_dv: found?.so_ct || "",
  ngay_ct_dv: found?.ngay_ct ? String(found.ngay_ct).slice(0, 10) : "",
});

export default function WarrantyReceipts() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<BhReceipt[]>([]);
  const [tickets, setTickets] = useState<BhTicket[]>([]);
  const [phieuId, setPhieuId] = useState(params.get("phieu") || "");
  const [soTien, setSoTien] = useState(0);
  const [hinhThuc, setHinhThuc] = useState("tm");
  const [nguoiNop, setNguoiNop] = useState("");
  const [lyDo, setLyDo] = useState("Thu tiền sửa chữa / phụ tùng BH");
  const [customers, setCustomers] = useState<{ ma_kh: string; ten_kh?: string; dia_chi?: string }[]>([]);
  const [maKh, setMaKh] = useState("");
  const [tenKh, setTenKh] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [lines, setLines] = useState<ThuLine[]>([]);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<BhReceipt | null>(null);
  const ticket = tickets.find((item) => item.id === phieuId);

  const refresh = async () => {
    const [list, phieu, suggest] = await Promise.all([warrantyApi.receipts(), warrantyApi.tickets(), warrantyApi.suggest()]);
    setCustomers(suggest.customers);
    const ready = phieu.filter((item) => posted.includes(item.status));
    setRows(list);
    setTickets(ready);
    const id = params.get("phieu");
    if (id) {
      const found = ready.find((item) => item.id === id);
      setPhieuId(id);
      setSoTien(Number(found?.t_tt || 0));
      setNguoiNop(found?.ten_kh || "");
      setMaKh(found?.ma_kh || "");
      setTenKh(found?.ten_kh || "");
      setDiaChi(found?.dia_chi || "");
      setLines([seedLine(found)]);
    }
  };

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Không tải phiếu thu"));
  }, [params]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const doc = await warrantyApi.saveReceipt({ phieuId, so_tien: lines.reduce((sum, line) => sum + Number(line.so_tien || 0), 0) || soTien, hinh_thuc: hinhThuc, nguoi_nop: nguoiNop, ly_do: lyDo, ma_kh: maKh, ten_kh: tenKh, dia_chi: diaChi, lines });
      setCurrent(doc);
      setRows(await warrantyApi.receipts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thu được");
    }
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Phiếu thu bảo hành</h1>
          <p className="desk-note">Loại phiếu thu 2 — Thu ngân · Quyển PTBH · TGGD VND</p>
        </div>
        <div className="desk-cmds">
          <button type="submit" form="pt-form">Lưu</button>
          <button type="button" disabled={!current} onClick={() => current && printVoucher(`Phiếu thu ${current.so_ct}`, `<p>${current.ten_kh || ""} nộp ${money(current.so_tien)} (${current.hinh_thuc})</p><p>${current.ly_do || ""}</p>`)}>In</button>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <form id="pt-form" className="desk-sheet" onSubmit={onSubmit}>
        <div className="desk-cols">
          <fieldset>
            <legend>Thông tin chung</legend>
            <div className="desk-grid">
              <span>Loại phiếu thu</span><input readOnly value="2 - Phiếu thu (Thu ngân)" />
              <span>Phiếu BH DV</span>
              <select required value={phieuId} onChange={(e) => {
                const found = tickets.find((item) => item.id === e.target.value);
                setPhieuId(e.target.value);
                setSoTien(Number(found?.t_tt || 0));
                setNguoiNop(found?.ten_kh || "");
                setMaKh(found?.ma_kh || "");
                setTenKh(found?.ten_kh || "");
                setDiaChi(found?.dia_chi || "");
                setLines([seedLine(found)]);
              }}>
                <option value="">Chọn phiếu đã ghi sổ</option>
                {tickets.map((item) => <option key={item.id} value={item.id}>{item.so_ct} — {item.ten_kh} — {money(item.t_tt)}</option>)}
              </select>
              <span>Mã khách</span>
              <BhSuggest
                value={maKh}
                placeholder="KH..."
                items={customers.map((item) => ({ value: item.ma_kh, text: item.ten_kh || "", raw: item }))}
                onChange={setMaKh}
                onPick={(item) => {
                  setMaKh(item.raw.ma_kh);
                  setTenKh(item.raw.ten_kh || "");
                  setDiaChi(item.raw.dia_chi || "");
                  setNguoiNop(item.raw.ten_kh || "");
                }}
              />
              <span>Tên khách</span><input value={tenKh} onChange={(e) => setTenKh(e.target.value)} />
              <span>Địa chỉ</span><input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
              <span>Người nộp</span><input value={nguoiNop} onChange={(e) => setNguoiNop(e.target.value)} />
              <span>Lý do nộp</span><input value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
              <span>Thanh toán</span>
              <select value={hinhThuc} onChange={(e) => setHinhThuc(e.target.value)}>
                <option value="tm">Tiền mặt</option>
                <option value="ck">Chuyển khoản</option>
              </select>
            </div>
          </fieldset>
          <fieldset>
            <legend>Chứng từ</legend>
            <div className="desk-grid">
              <span>Quyển số</span><input readOnly value="PTBH" />
              <span>Số phiếu thu</span><input readOnly value={current?.so_ct || ""} placeholder="Tự cấp khi lưu" />
              <span>Ngày</span><input readOnly value={day(current?.ngay_ct)} />
              <span>TGGD / tỷ giá</span><input readOnly value="VND · 1,00" />
              <span>Trạng thái</span><input readOnly value={current ? "Đã thu" : "Chưa lưu"} />
              <span>Số tiền</span><input type="number" min={0} value={soTien} onChange={(e) => setSoTien(Number(e.target.value))} />
              <span>Phải thu phiếu</span><input readOnly value={money(ticket?.t_tt)} />
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend>Chi tiết thu</legend>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Serial</th><th>Tk nợ</th><th>Tên tài khoản</th><th>Tiền</th><th>Diễn giải</th><th>Số phiếu BH</th><th></th></tr></thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td><input value={line.so_serial} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, so_serial: e.target.value } : item))} /></td>
                    <td><input value={line.tk_no} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, tk_no: e.target.value } : item))} /></td>
                    <td><input value={line.ten_tk} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, ten_tk: e.target.value } : item))} /></td>
                    <td><input type="number" min={0} value={line.so_tien} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, so_tien: Number(e.target.value) } : item))} /></td>
                    <td><input value={line.ghi_chu} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, ghi_chu: e.target.value } : item))} /></td>
                    <td><input value={line.so_ct_dv} onChange={(e) => setLines(lines.map((item, i) => i === index ? { ...item, so_ct_dv: e.target.value } : item))} /></td>
                    <td><button type="button" className="ghost" onClick={() => setLines(lines.filter((_, i) => i !== index))}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" style={{ marginTop: 8 }} onClick={() => setLines([...lines, seedLine(ticket)])}>Thêm dòng</button>
          <p className="desk-note">Tổng tiền {money(lines.reduce((sum, line) => sum + Number(line.so_tien || 0), 0))}</p>
        </fieldset>
      </form>
      <div className="desk-browse table-wrap">
        <table>
          <thead><tr><th>Số PT</th><th>Ngày</th><th>Phiếu DV</th><th>Khách</th><th>Số tiền</th><th>Hình thức</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => void warrantyApi.receipt(row.id).then((doc) => { setCurrent(doc); setPhieuId(doc.phieuId || ""); setSoTien(Number(doc.so_tien)); setNguoiNop(doc.nguoi_nop || ""); setLyDo(doc.ly_do || ""); setLines((doc.lines || []).map((line) => ({ so_serial: line.so_serial || "", tk_no: line.tk_no || "", ten_tk: line.ten_tk || "", so_tien: Number(line.so_tien || 0), ghi_chu: line.ghi_chu || "", so_ct_dv: line.so_ct_dv || "", ngay_ct_dv: line.ngay_ct_dv ? String(line.ngay_ct_dv).slice(0, 10) : "" }))); })}>
                <td>{row.so_ct}</td><td>{day(row.ngay_ct)}</td><td>{row.so_phieu}</td><td>{row.ten_kh}</td><td>{money(row.so_tien)}</td><td>{row.hinh_thuc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
