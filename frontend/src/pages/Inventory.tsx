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
    <section>
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
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.unit}</td>
                <td>{Number(row.quantity).toLocaleString("vi-VN")}</td>
                <td>{Number(row.minQty || 0).toLocaleString("vi-VN")}</td>
                <td>{Number(row.maxQty || 0).toLocaleString("vi-VN")}</td>
                <td>{row.status === "1" ? "Sử dụng" : "Ngưng"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
