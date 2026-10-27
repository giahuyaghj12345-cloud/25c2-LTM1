import CatalogPage from "./CatalogPage";
import { useAuth } from "../auth";
import { canWriteCatalog, catalogApi, type Customer } from "../api";

const GROUP: Record<string, string> = { dealer: "Đại lý", retail: "Khách lẻ" };

export default function Customers() {
  const { user } = useAuth();
  return (
    <CatalogPage<Customer>
      title="Danh mục khách hàng"
      canWrite={canWriteCatalog(user)}
      importMode="customers"
      load={catalogApi.customers}
      save={(item) => catalogApi.saveCustomer({ ...item, code: String(item.code || "").trim().toUpperCase() })}
      remove={catalogApi.deleteCustomer}
      empty={{ code: "", name: "", address: "", phone: "", email: "", taxCode: "", idCard: "", customerGroup: "dealer", note: "" }}
      fields={[
        { key: "code", label: "Mã khách" },
        { key: "name", label: "Tên khách", wide: true },
        { key: "customerGroup", label: "Nhóm khách", type: "select", options: [
          { value: "dealer", label: "Đại lý (BH 2 năm 3 tháng)" },
          { value: "retail", label: "Khách lẻ (BH 2 năm)" },
        ] },
        { key: "phone", label: "Điện thoại" },
        { key: "email", label: "Email" },
        { key: "taxCode", label: "MST" },
        { key: "idCard", label: "CCCD" },
        { key: "address", label: "Địa chỉ", wide: true },
        { key: "note", label: "Ghi chú", wide: true },
      ]}
      columns={[
        { key: "code", label: "Mã" },
        { key: "name", label: "Tên khách" },
        { key: "customerGroup", label: "Nhóm", format: (row) => GROUP[row.customerGroup] || row.customerGroup },
        { key: "phone", label: "Điện thoại" },
        { key: "address", label: "Địa chỉ" },
      ]}
    />
  );
}
