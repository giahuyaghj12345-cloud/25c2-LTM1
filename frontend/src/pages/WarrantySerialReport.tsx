import { type FormEvent, useEffect, useState } from "react";
import { warrantyApi } from "../api";
import BhFlow from "../components/BhFlow";
import { day } from "../warranty";

type Row = Record<string, string | number | null>;

export default function WarrantySerialReport() {
  const [q, setQ] = useState("");
  const [maKh, setMaKh] = useState("");
  const [maSp, setMaSp] = useState("");
  const [tinh, setTinh] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<{ tinh_trang: string; so_luong: number }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await warrantyApi.serialReport({
        q: q.trim(),
        ma_kh: maKh.trim(),
        ma_sp: maSp.trim(),
        tinh_trang: tinh.trim(),
        from: from || undefined,
        to: to || undefined,
      });
      setRows(data.rows || []);
      setSummary(data.summary || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được báo cáo");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void load();
  };

  return (
    <section className="desk">
      <BhFlow />
      <div className="desk-bar">
        <div>
          <h1>Báo cáo serial</h1>
          <p className="desk-note">Menu GGV 61.05.01 — lọc serial theo khách, sản phẩm, tình trạng, khoảng ngày.</p>
        </div>
      </div>

      <form className="desk-sheet report-filters" onSubmit={onSubmit}>
        <div className="desk-grid">
          <span>Từ khóa</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Serial / khách / SP" />
          <span>Mã KH</span>
          <input value={maKh} onChange={(e) => setMaKh(e.target.value.toUpperCase())} />
          <span>Mã SP</span>
          <input value={maSp} onChange={(e) => setMaSp(e.target.value.toUpperCase())} />
          <span>Tình trạng</span>
          <input value={tinh} onChange={(e) => setTinh(e.target.value)} placeholder="VD: Mới tạo" />
          <span>Từ ngày</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span>Đến ngày</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="desk-cmds" style={{ marginTop: 10 }}>
          <button type="submit" disabled={busy}>{busy ? "Đang lọc..." : "Lọc báo cáo"}</button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setQ("");
              setMaKh("");
              setMaSp("");
              setTinh("");
              setFrom("");
              setTo("");
              void warrantyApi.serialReport({}).then((data) => {
                setRows(data.rows || []);
                setSummary(data.summary || []);
              });
            }}
          >
            Xóa lọc
          </button>
        </div>
      </form>

      {error && <div className="alert">{error}</div>}

      <div className="bh-kpis" style={{ marginTop: 12 }}>
        {summary.slice(0, 6).map((item) => (
          <article key={item.tinh_trang} className="bh-kpi">
            <div>
              <span>{item.tinh_trang || "(trống)"}</span>
              <strong>{Number(item.so_luong) || 0}</strong>
            </div>
          </article>
        ))}
        {!summary.length && (
          <article className="bh-kpi">
            <div>
              <span>Tổng dòng</span>
              <strong>{rows.length}</strong>
            </div>
          </article>
        )}
      </div>

      <div className="card table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Serial</th>
              <th>Khách</th>
              <th>Sản phẩm</th>
              <th>PXK</th>
              <th>Ngày xuất</th>
              <th>Tình trạng</th>
              <th>BH từ</th>
              <th>BH đến</th>
              <th>Người tạo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.so_serial)}>
                <td>{String(row.so_serial || "")}</td>
                <td>{[row.ma_kh, row.ten_kh].filter(Boolean).join(" — ")}</td>
                <td>{[row.ma_sp, row.ten_sp].filter(Boolean).join(" — ")}</td>
                <td>{String(row.so_px || "")}</td>
                <td>{row.ngay_xuat ? day(String(row.ngay_xuat)) : ""}</td>
                <td>{String(row.tinh_trang || row.trang_thai || "")}</td>
                <td>{row.ngay_bh_tu ? day(String(row.ngay_bh_tu)) : ""}</td>
                <td>{row.ngay_bh_den ? day(String(row.ngay_bh_den)) : ""}</td>
                <td>{String(row.createdBy || "")}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="muted">Không có serial theo bộ lọc</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
