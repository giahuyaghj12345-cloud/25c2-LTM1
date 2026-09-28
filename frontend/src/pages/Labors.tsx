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
        { key: "code", label: "Mã" },
        { key: "name", label: "Tên tiền công" },
        { key: "amount", label: "Số tiền", type: "number" },
        { key: "note", label: "Ghi chú" },
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
