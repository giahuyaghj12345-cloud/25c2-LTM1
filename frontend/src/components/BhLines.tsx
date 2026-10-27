import { useState } from "react";
import { warrantyApi, type BhLine, type LaborCost, type Product } from "../api";
import BhSuggest from "./BhSuggest";
import { lineMoney, money } from "../warranty";

type Props = {
  title: string;
  loai: "tc" | "pt";
  lines: BhLine[];
  disabled: boolean;
  ngay?: string;
  products: Product[];
  labors: LaborCost[];
  onChange: (lines: BhLine[]) => void;
};

function KmCell({ line, loai, ngay, disabled, onApply }: { line: BhLine; loai: "tc" | "pt"; ngay?: string; disabled: boolean; onApply: (part: Partial<BhLine>) => void }) {
  const [items, setItems] = useState<{ ma_km: string; ten_km: string; tl_km: number; tien_km: number }[]>([]);
  const load = () => {
    if (!line.ma) return;
    void warrantyApi.matchKm(loai, line.ma, ngay).then(setItems).catch(() => setItems([]));
  };
  return (
    <select
      disabled={disabled || !line.ma}
      value={line.ma_km || ""}
      onFocus={load}
      onChange={(e) => {
        const found = items.find((item) => item.ma_km === e.target.value);
        if (!found) onApply({ ma_km: "", ten_km: "", tl_ck: 0 });
        else onApply({ ma_km: found.ma_km, ten_km: found.ten_km, tl_ck: Number(found.tl_km || 0) });
      }}
    >
      <option value="">Không KM</option>
      {line.ma_km && !items.some((item) => item.ma_km === line.ma_km) && <option value={line.ma_km}>{line.ten_km || line.ma_km}</option>}
      {items.map((item) => <option key={item.ma_km} value={item.ma_km}>{item.ma_km} — {item.ten_km} ({item.tl_km}%)</option>)}
    </select>
  );
}

export default function BhLines({ title, loai, lines, disabled, ngay, products, labors, onChange }: Props) {
  const rows = lines.filter((line) => line.loai === loai);
  const others = lines.filter((line) => line.loai !== loai);

  const write = (next: BhLine[]) => onChange([...others, ...next]);

  const patch = (index: number, part: Partial<BhLine>) => {
    const next = rows.map((line, i) => (i === index ? { ...line, ...part } : line));
    write(next);
  };

  const pickCode = (index: number, code: string) => {
    if (loai === "tc") {
      const labor = labors.find((item) => item.code === code);
      patch(index, { ma: code, ten: labor?.name || "", gia: Number(labor?.amount || 0), dvt: "Lần" });
      return;
    }
    const product = products.find((item) => item.code === code);
    const price = product?.prices?.[0]?.price || 0;
    patch(index, { ma: code, ten: product?.name || "", dvt: product?.unit || "", gia: Number(price) });
  };

  return (
    <fieldset className="voucher-frame">
      <legend>{title}</legend>
      <div className="table-wrap voucher-grid">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>ĐVT</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
              <th>KM</th>
              <th>CK %</th>
              <th>Thuế %</th>
              <th>Tk</th>
              <th>Ghi chú</th>
              <th>Phải trả</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((line, index) => {
              const calc = lineMoney(line);
              return (
                <tr key={`${loai}-${index}`}>
                  <td>
                    <BhSuggest
                      disabled={disabled}
                      value={line.ma}
                      items={(loai === "tc" ? labors : products).map((item) => ({ value: item.code, text: item.name, raw: item }))}
                      onChange={(code) => pickCode(index, code)}
                      onPick={(item) => pickCode(index, item.value)}
                    />
                  </td>
                  <td><input disabled value={line.ten} readOnly /></td>
                  <td><input disabled={disabled} value={line.dvt || ""} onChange={(e) => patch(index, { dvt: e.target.value })} /></td>
                  <td><input disabled={disabled} type="number" min={0} step="0.01" value={line.so_luong} onChange={(e) => patch(index, { so_luong: Number(e.target.value) })} /></td>
                  <td><input disabled={disabled} type="number" min={0} value={line.gia} onChange={(e) => patch(index, { gia: Number(e.target.value) })} /></td>
                  <td>{money(calc.thanh)}</td>
                  <td><KmCell line={line} loai={loai} ngay={ngay} disabled={disabled} onApply={(part) => patch(index, part)} /></td>
                  <td><input disabled={disabled || Boolean(line.ma_km)} type="number" min={0} max={100} value={line.tl_ck || 0} onChange={(e) => patch(index, { tl_ck: Number(e.target.value) })} /></td>
                  <td><input disabled={disabled} type="number" min={0} value={line.thue_suat || 0} onChange={(e) => patch(index, { thue_suat: Number(e.target.value) })} /></td>
                  <td><input disabled={disabled} value={line.tk || ""} onChange={(e) => patch(index, { tk: e.target.value })} /></td>
                  <td><input disabled={disabled} value={line.ghi_chu || ""} onChange={(e) => patch(index, { ghi_chu: e.target.value })} /></td>
                  <td>{money(calc.pay)}</td>
                  <td>
                    <button type="button" className="ghost" disabled={disabled} onClick={() => write(rows.filter((_, i) => i !== index))}>Xóa</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="ghost" disabled={disabled} onClick={() => write([...rows, { loai, ma: "", ten: "", dvt: "", so_luong: 1, gia: 0, tl_ck: 0, thue_suat: 0 }])}>
        Thêm dòng
      </button>
    </fieldset>
  );
}
