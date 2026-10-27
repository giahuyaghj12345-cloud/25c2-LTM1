import CatalogPage from "./CatalogPage";
import { useAuth } from "../auth";
import { canWriteCatalog, catalogApi, type LaborCost } from "../api";

export default function Labors() {
  const { user } = useAuth();
  return (
    <CatalogPage<LaborCost>
      title="Danh mục tiền công"
      canWrite={canWriteCatalog(user)}
      importMode="labors"
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
