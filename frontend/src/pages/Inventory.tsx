import { useEffect, useState } from "react";
import { catalogApi, type Product } from "../api";

type InventoryRow = Product & { quantity: number };

export default function Inventory() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    catalogApi
      .inventory()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Không tải được tồn kho"));
  }, []);

  return (
    <section className="biz">
      <div className="page-head">
        <h1>Tồn kho sản phẩm</h1>
        <p className="muted">Các sản phẩm được đánh dấu theo dõi tồn kho</p>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên sản phẩm</th>
              <th>ĐVT</th>
              <th>Tồn hiện tại</th>
              <th>SL min</th>
              <th>SL max</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Chưa có sản phẩm theo dõi tồn kho
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const qty = Number(row.quantity) || 0;
              const min = Number(row.minQty) || 0;
              const max = Number(row.maxQty) || 0;
              const stockState =
                min > 0 && qty <= min ? "Thiếu" : max > 0 && qty >= max ? "Dư" : "Ổn định";
              return (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.unit}</td>
                <td>{qty.toLocaleString("vi-VN")}</td>
                <td>{min.toLocaleString("vi-VN")}</td>
                <td>{max.toLocaleString("vi-VN")}</td>
                <td>{stockState} · {row.status === "1" ? "Sử dụng" : "Ngưng"}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
