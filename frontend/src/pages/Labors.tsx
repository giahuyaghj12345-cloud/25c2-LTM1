import CatalogPage from "./CatalogPage";
import { catalogApi, type LaborCost } from "../api";

export default function Labors() {
  return (
    <CatalogPage<LaborCost>
      title="Danh mục tiền công"
      load={catalogApi.labors}
      save={catalogApi.saveLabor}
      remove={catalogApi.deleteLabor}
      empty={{ code: "", name: "", amount: 0, note: "" }}
      fields={[
        { key: "code", label: "Mã tiền công", wide: true },
        { key: "name", label: "Tên tiền công", wide: true },
        { key: "amount", label: "Đơn giá (VAT)", type: "number" },
        { key: "note", label: "Ghi chú", wide: true },
      ]}
      columns={[
        { key: "code", label: "Mã" },
        { key: "name", label: "Tên" },
        { key: "amount", label: "Số tiền", format: (row) => Number(row.amount).toLocaleString("vi-VN") },
        { key: "note", label: "Ghi chú" },
      ]}
    />
  );
}
