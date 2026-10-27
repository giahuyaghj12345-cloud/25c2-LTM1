import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { canWriteWarranty, warrantyApi, type BhInvoice, type BhQuote, type BhReceipt, type BhTicket, type BhWarehouse } from "../api";
import BhFlow from "../components/BhFlow";
import BhSuggest from "../components/BhSuggest";
import { day, LOAI_BH, MA_GD, money, TICKET_STATUS } from "../warranty";

type Trace = {
  serial: Record<string, string> | null;
  quotes: BhQuote[];
  tickets: BhTicket[];
  kho: BhWarehouse[];
  thu: BhReceipt[];
  hd: BhInvoice[];
  logs: { tinh_trang: string; ghi_chu?: string; changedAt?: string; changedBy?: string }[];
};

const SITUATIONS = ["Đang bảo hành", "Hết bảo hành", "Đang sửa chữa", "Đã thu BH", "Đã đổi 1-1", "Hủy"];

function daysLeft(to?: string) {
  if (!to) return "—";
  const end = new Date(to);
  if (Number.isNaN(end.getTime())) return "—";
  return String(Math.ceil((end.getTime() - Date.now()) / 86400000));
}

export default function WarrantyLookup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = canWriteWarranty(user);
  const [q, setQ] = useState("");
  const [serials, setSerials] = useState<{ so_serial: string; ten_sp?: string; ten_kh?: string }[]>([]);
  const [data, setData] = useState<Trace | null>(null);
  const [tinh, setTinh] = useState(SITUATIONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const serial = data?.serial;

  useEffect(() => {
    void warrantyApi.suggest().then((hints) => setSerials(hints.serials)).catch(() => undefined);
  }, []);

  const search = async (serialNo = q.trim()) => {
    setError("");
    const found = await warrantyApi.trace(serialNo);
    setData(found);
    if (found.serial?.tinh_trang) setTinh(found.serial.tinh_trang);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await search();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tra được");
    }
  };

  const change = async () => {
    if (!serial?.so_serial) return;
    try {
      await warrantyApi.situation({ so_serial: serial.so_serial, tinh_trang: tinh, ghi_chu: note });
      setNote("");
      await search(serial.so_serial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đổi được tình trạng");
    }
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Tra cứu serial</h1>
          <p className="desk-note">Nhật ký dịch vụ, lịch sử tình trạng, lập báo giá hoặc phiếu từ serial.</p>
        </div>
        <form className="desk-cmds" onSubmit={onSubmit}>
          <BhSuggest
            value={q}
            placeholder="Số serial"
            items={serials.map((item) => ({ value: item.so_serial, text: `${item.ten_sp || ""} ${item.ten_kh || ""}`.trim(), raw: item }))}
            onChange={setQ}
            onPick={(item) => { setQ(item.value); void search(item.value); }}
          />
          <button type="submit">Tra cứu</button>
          {canWrite && (
            <>
              <button type="button" disabled={!serial} onClick={() => navigate(`/warranty/quotes?serial=${encodeURIComponent(serial?.so_serial || "")}`)}>Báo giá</button>
              <button type="button" disabled={!serial} onClick={() => navigate(`/warranty/tickets?serial=${encodeURIComponent(serial?.so_serial || "")}`)}>Bảo hành</button>
            </>
          )}
        </form>
      </div>
      {error && <div className="alert">{error}</div>}
      {data && !serial && (
        <p className="desk-note">Không có serial này trong danh mục. Các chứng từ trùng chuỗi tìm kiếm (nếu có) vẫn hiện bên dưới.</p>
      )}
      {data && (
        <div className="desk-sheet">
          {serial && (
            <>
              <fieldset>
                <legend>Thông tin về serial</legend>
                <div className="desk-grid">
                  <span>Số serial</span><input readOnly value={serial.so_serial || ""} />
                  <span>Trạng thái</span><input readOnly value={serial.trang_thai || ""} />
                  <span>Mã SP</span><input readOnly value={serial.ma_sp || ""} />
                  <span>Tên SP</span><input readOnly value={serial.ten_sp || ""} />
                  <span>ĐVT</span><input readOnly value={serial.dvt || ""} />
                  <span>Số batch</span><input readOnly value={serial.so_batch || ""} />
                  <span>Ngày xuất</span><input readOnly value={day(serial.ngay_xuat)} />
                  <span>Số PX</span><input readOnly value={serial.so_px || ""} />
                  <span>Số đơn hàng</span><input readOnly value={serial.so_don_hang || ""} />
                  <span>Mã KH</span><input readOnly value={serial.ma_kh || ""} />
                  <span>Tên KH</span><input readOnly value={serial.ten_kh || ""} />
                  <span>Số ngày còn BH</span><input readOnly value={daysLeft(serial.ngay_bh_den)} />
                </div>
              </fieldset>
              <fieldset>
                <legend>Thông tin kích hoạt BH</legend>
                <div className="desk-grid">
                  <span>Ngày kích hoạt</span><input readOnly value={day(serial.ngay_kh_bh)} />
                  <span>KH kích hoạt</span><input readOnly value={serial.kh_kich_hoat || ""} />
                  <span>Email</span><input readOnly value={serial.email_kh_bh || ""} />
                  <span>Điện thoại</span><input readOnly value={serial.dt_kh_bh || ""} />
                  <span>Hết hạn BH</span><input readOnly value={day(serial.ngay_bh_den)} />
                  <span>Tình trạng</span><input readOnly value={serial.tinh_trang || ""} />
                  <span>Đại lý mua</span><input readOnly value={serial.dai_ly_mua || ""} />
                  <span>Địa chỉ đại lý</span><input readOnly value={serial.dia_chi_dl || ""} />
                  <span>Ngày mua</span><input readOnly value={day(serial.ngay_mua_dl)} />
                  <span>Ghi chú</span><input readOnly value={serial.ghi_chu_kh_bh || ""} />
                </div>
              </fieldset>
              {canWrite && (
              <fieldset>
                <legend>Thay đổi tình trạng serial</legend>
                <div className="desk-grid">
                  <span>Tình trạng mới</span>
                  <select value={tinh} onChange={(e) => setTinh(e.target.value)}>
                    {SITUATIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <span>Ghi chú</span><input value={note} onChange={(e) => setNote(e.target.value)} />
                  <span></span><button type="button" onClick={() => void change()}>Đổi tình trạng</button>
                </div>
              </fieldset>
              )}
            </>
          )}
          <fieldset>
            <legend>Nhật ký dịch vụ</legend>
            <table>
              <thead><tr><th>Chứng từ</th><th>Số</th><th>Ngày</th><th>Loại DV</th><th>Nội dung</th><th>KH</th><th>NV</th><th>Tiền</th></tr></thead>
              <tbody>
                {(data.quotes || []).map((item) => <tr key={item.id}><td>Báo giá</td><td>{item.so_ct}</td><td>{day(item.ngay_ct)}</td><td></td><td>{item.yeu_cau || item.dien_giai || ""}</td><td>{item.ten_kh}</td><td></td><td>{money(item.t_tien)}</td></tr>)}
                {(data.tickets || []).map((item) => <tr key={item.id}><td>Phiếu DV</td><td>{item.so_ct}</td><td>{day(item.ngay_ct)}</td><td>{LOAI_BH[Number(item.loai_bh) || 1]}</td><td>{item.yeu_cau || item.tu_van || TICKET_STATUS[item.status] || item.status}</td><td>{item.ten_kh}</td><td>{item.createdBy || ""}</td><td>{money(item.t_tt)}</td></tr>)}
                {(data.kho || []).map((item) => <tr key={item.id}><td>Kho BH</td><td>{item.so_ct}</td><td>{day(item.ngay_ct)}</td><td>{MA_GD[item.ma_gd] || item.ma_gd}</td><td>{item.loai_nx || ""}</td><td></td><td></td><td></td></tr>)}
                {(data.thu || []).map((item) => <tr key={item.id}><td>Phiếu thu</td><td>{item.so_ct}</td><td>{day(item.ngay_ct)}</td><td></td><td>{item.hinh_thuc}</td><td></td><td></td><td>{money(item.so_tien)}</td></tr>)}
                {(data.hd || []).map((item) => <tr key={item.id}><td>Hóa đơn</td><td>{item.so_ct}</td><td>{day(item.ngay_ct)}</td><td></td><td></td><td></td><td></td><td>{money(item.t_tien)}</td></tr>)}
                {!data.quotes?.length && !data.tickets?.length && !data.kho?.length && !data.thu?.length && !data.hd?.length && (
                  <tr><td colSpan={8} className="muted">Chưa có chứng từ liên quan</td></tr>
                )}
              </tbody>
            </table>
          </fieldset>
          {serial && (
            <fieldset>
              <legend>Lịch sử tình trạng serial</legend>
              <table>
                <thead><tr><th>Thời gian</th><th>Tình trạng</th><th>Ghi chú</th><th>Người đổi</th></tr></thead>
                <tbody>
                  {(data.logs || []).map((item, index) => (
                    <tr key={index}><td>{item.changedAt ? String(item.changedAt).replace("T", " ").slice(0, 16) : ""}</td><td>{item.tinh_trang}</td><td>{item.ghi_chu}</td><td>{item.changedBy}</td></tr>
                  ))}
                </tbody>
              </table>
            </fieldset>
          )}
        </div>
      )}
    </section>
  );
}
