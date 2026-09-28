import { type FormEvent, useEffect, useState } from "react";
import { warrantyApi, type BhKm, type BhKmLine } from "../api";
import { day } from "../warranty";

const STATUS: Record<number, string> = { 0: "Chưa duyệt", 1: "Đã duyệt", 2: "Từ chối", 3: "Hủy duyệt" };

const empty = (): Partial<BhKm> => ({
  ma_km: "",
  ten_km: "",
  ngay_hl1: day(),
  ngay_hl2: day(),
  trang_thai: 0,
  ghi_chu: "",
  lines: [{ loai: "tc", ma: "", tl_km: 0, tien_km: 0 }],
});

export default function WarrantyPromotions() {
  const [rows, setRows] = useState<BhKm[]>([]);
  const [form, setForm] = useState(empty());
  const [error, setError] = useState("");
  const locked = Number(form.trang_thai) === 1;

  const refresh = async () => setRows(await warrantyApi.kmList());

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Không tải KM"));
  }, []);

  const lines = form.lines || [];
  const patchLine = (index: number, part: Partial<BhKmLine>) => {
    setForm({ ...form, lines: lines.map((line, i) => (i === index ? { ...line, ...part } : line)) });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const saved = await warrantyApi.saveKm(form);
      setForm({ ...saved, ngay_hl1: day(saved.ngay_hl1), ngay_hl2: day(saved.ngay_hl2), lines: saved.lines || [] });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };

  const decide = async (status: number) => {
    if (!form.id) return;
    const note = window.prompt("Ghi chú duyệt", form.ghi_chu_duyet || "") || "";
    try {
      const saved = await warrantyApi.kmStatus(form.id, status, note);
      setForm({ ...saved, ngay_hl1: day(saved.ngay_hl1), ngay_hl2: day(saved.ngay_hl2), lines: saved.lines || [] });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không duyệt được");
    }
  };

  return (
    <section className="desk">
      <div className="desk-bar">
        <div>
          <h1>Chương trình khuyến mãi bảo hành</h1>
          <p className="desk-note">{STATUS[Number(form.trang_thai) || 0]} · Chiết khấu trên dòng chỉ lấy từ KM đã duyệt</p>
        </div>
        <div className="desk-cmds">
          <button type="button" onClick={() => setForm(empty())}>Mới</button>
          <button type="submit" form="km-form" disabled={locked}>Lưu</button>
          <button type="button" disabled={!form.id || locked} onClick={() => void decide(1)}>Duyệt</button>
          <button type="button" disabled={!form.id || locked} onClick={() => void decide(2)}>Từ chối</button>
          <button type="button" disabled={!form.id || !locked} onClick={() => void decide(3)}>Hủy duyệt</button>
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <form id="km-form" className="desk-sheet" onSubmit={onSubmit}>
        <div className="desk-grid">
          <span>Mã KM</span><input disabled={locked} required value={form.ma_km || ""} onChange={(e) => setForm({ ...form, ma_km: e.target.value.toUpperCase() })} />
          <span>Tên KM</span><input disabled={locked} required value={form.ten_km || ""} onChange={(e) => setForm({ ...form, ten_km: e.target.value })} />
          <span>Hiệu lực từ</span><input disabled={locked} type="date" value={day(form.ngay_hl1)} onChange={(e) => setForm({ ...form, ngay_hl1: e.target.value })} />
          <span>Hiệu lực đến</span><input disabled={locked} type="date" value={day(form.ngay_hl2)} onChange={(e) => setForm({ ...form, ngay_hl2: e.target.value })} />
          <span>Ghi chú</span><input disabled={locked} value={form.ghi_chu || ""} onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })} />
          <span>Ghi chú duyệt</span><input readOnly value={form.ghi_chu_duyet || ""} />
        </div>
        <fieldset>
          <legend>Áp dụng cho tiền công / phụ tùng</legend>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Loại</th><th>Mã</th><th>CK %</th><th>Tiền KM</th><th></th></tr></thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <select disabled={locked} value={line.loai} onChange={(e) => patchLine(index, { loai: e.target.value })}>
                        <option value="tc">Tiền công</option>
                        <option value="pt">Phụ tùng</option>
                      </select>
                    </td>
                    <td><input disabled={locked} value={line.ma} onChange={(e) => patchLine(index, { ma: e.target.value })} /></td>
                    <td><input disabled={locked} type="number" min={0} value={line.tl_km || 0} onChange={(e) => patchLine(index, { tl_km: Number(e.target.value) })} /></td>
                    <td><input disabled={locked} type="number" min={0} value={line.tien_km || 0} onChange={(e) => patchLine(index, { tien_km: Number(e.target.value) })} /></td>
                    <td><button type="button" className="ghost" disabled={locked} onClick={() => setForm({ ...form, lines: lines.filter((_, i) => i !== index) })}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" disabled={locked} style={{ marginTop: 8 }} onClick={() => setForm({ ...form, lines: [...lines, { loai: "tc", ma: "", tl_km: 0, tien_km: 0 }] })}>Thêm dòng</button>
        </fieldset>
      </form>
      <div className="desk-browse table-wrap">
        <table>
          <thead><tr><th>Mã</th><th>Tên</th><th>Từ</th><th>Đến</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => void warrantyApi.km(row.id).then((doc) => setForm({ ...doc, ngay_hl1: day(doc.ngay_hl1), ngay_hl2: day(doc.ngay_hl2), lines: doc.lines || [] }))}>
                <td>{row.ma_km}</td><td>{row.ten_km}</td><td>{day(row.ngay_hl1)}</td><td>{day(row.ngay_hl2)}</td><td>{STATUS[Number(row.trang_thai) || 0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
