export type Role = "admin" | "warehouse" | "warranty" | "sales" | "user";
export type UserStatus = "active" | "blocked" | "suspended";

export type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone: string;
  address: string;
  cccd: string;
  avatar: string;
  canCreateSerial?: boolean;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: string;
  message: string;
  actorName?: string;
  createdAt: string;
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  warehouse: "Quản lý kho",
  warranty: "Kỹ thuật bảo hành",
  sales: "Nhân viên bán hàng",
  user: "Người dùng",
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Hoạt động",
  blocked: "Đã chặn",
  suspended: "Tạm ngừng",
};

export function canUseSerial(user?: Pick<User, "role" | "canCreateSerial"> | null) {
  return Boolean(user && (user.canCreateSerial || user.role === "admin"));
}

/** Menu / route access by role (admin luôn full). */
export function canAccessCatalog(user?: Pick<User, "role"> | null) {
  const role = user?.role;
  return role === "admin" || role === "warehouse" || role === "warranty" || role === "sales" || role === "user";
}

export function canAccessWarehouse(user?: Pick<User, "role"> | null) {
  const role = user?.role;
  return role === "admin" || role === "warehouse" || role === "sales";
}

export function canAccessWarranty(user?: Pick<User, "role"> | null) {
  const role = user?.role;
  return role === "admin" || role === "warranty" || role === "sales" || role === "user";
}

export function canWriteCatalog(user?: Pick<User, "role"> | null) {
  const role = user?.role;
  return role === "admin" || role === "warehouse" || role === "sales";
}

export function canWriteWarehouse(user?: Pick<User, "role"> | null) {
  const role = user?.role;
  return role === "admin" || role === "warehouse" || role === "sales";
}

export function canWriteWarranty(user?: Pick<User, "role"> | null) {
  const role = user?.role;
  return role === "admin" || role === "warranty" || role === "sales";
}

const API = "/api/auth";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("Không kết nối được máy chủ. Hãy chạy lại backend.");
  }
  const data = await res.json().catch(() => ({} as { message?: string }));
  if (!res.ok) {
    throw new Error(data.message || `Không tải được dữ liệu (${res.status})`);
  }
  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User; message: string }>(`${API}/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (username: string, email: string, password: string) =>
    request<{ token: string; user: User; message: string }>(`${API}/register`, {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  profile: () => request<User>(`${API}/profile`),
  updateProfile: (form: FormData) =>
    request<{ message: string; user: User }>(`${API}/profile`, {
      method: "PUT",
      body: form,
    }),
  users: () => request<User[]>(`${API}/users`),
  updateRole: (id: string, role: Role) =>
    request<{ message: string; user: User }>(`${API}/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  updateStatus: (id: string, status: UserStatus) =>
    request<{ message: string; user: User }>(`${API}/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateSerialAccess: (id: string, canCreateSerial: boolean) =>
    request<{ message: string; user: User }>(`${API}/users/${id}/serial-access`, {
      method: "PATCH",
      body: JSON.stringify({ canCreateSerial }),
    }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`${API}/users/${id}`, { method: "DELETE" }),
  notifications: () => request<{ items: AppNotification[] }>(`${API}/notifications`),
};

export type ProductPrice = {
  id?: string;
  effectiveDate?: string;
  price: number;
  priceVat: number;
  customerGroup?: string;
  customerCode?: string;
};

export type Product = {
  id: string;
  code: string;
  partNo?: string;
  searchCode?: string;
  name: string;
  name2?: string;
  unit: string;
  multiUnit: boolean;
  trackShelf: boolean;
  keepStock: boolean;
  trackLot: boolean;
  costMethod: number;
  editStockAccount: number;
  kind?: string;
  stockAccount?: string;
  taxRate: number;
  revenueAccount?: string;
  returnAccount?: string;
  internalRevenueAccount?: string;
  varianceAccount?: string;
  cogsAccount?: string;
  wipAccount?: string;
  groupCode?: string;
  groupCode2?: string;
  groupCode3?: string;
  minQty: number;
  maxQty: number;
  stockQty?: number;
  industryCode?: string;
  vatRate: number;
  envTax: number;
  discountCode?: string;
  typeCode?: string;
  hsCode?: string;
  manufacturer?: string;
  brand?: string;
  family?: string;
  color?: string;
  carModel?: string;
  modelYear?: string;
  origin?: string;
  spec?: string;
  note?: string;
  status: string;
  prices?: ProductPrice[];
  quantity?: number;
};

export type LaborCost = {
  id: string;
  code: string;
  name: string;
  amount: number;
  note?: string;
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  idCard?: string;
  customerGroup: string;
  note?: string;
};

export type StockOutLine = {
  id?: string;
  materialId?: string;
  product?: Product;
  materialName?: string;
  quantity: number;
  unit?: string;
  warehouseCode?: string;
  lotCode?: string;
  batchNo?: string;
  shelfCode?: string;
  hsCode?: string;
  note?: string;
};

export type StockOut = {
  id: string;
  number: string;
  date: string;
  postingDate?: string;
  bookNumber?: string;
  currency?: string;
  exchangeRate?: number;
  receiver?: string;
  reason?: string;
  remark?: string;
  kind?: string;
  kindLabel?: string;
  customerCode?: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGroup?: string;
  customerGroupLabel?: string;
  salesStaff?: string;
  deliveryStaff?: string;
  deliveryAddress?: string;
  orderNumber?: string;
  orderDate?: string;
  serialCreated?: boolean;
  serialLocked?: boolean;
  serialState?: string;
  status: string;
  createdBy?: string;
  updatedAt?: string;
  lines: StockOutLine[];
};

export type SerialItem = {
  id: string;
  serialNo: string;
  customerCode?: string;
  customerName?: string;
  orderNumber?: string;
  stockOutDate?: string;
  stockOutNumber?: string;
  productCode?: string;
  productName?: string;
  unit?: string;
  productGroup?: string;
  warehouseCode?: string;
  lotCode?: string;
  batchNo?: string;
  status: string;
  situation: string;
  note?: string;
  warrantyFrom?: string;
  warrantyTo?: string;
  warrantyNote?: string;
  createdAt: string;
  createdBy?: string;
  changedAt?: string;
  changedBy?: string;
};

const CAT = "/api/catalog";

export type ImportMode = "products" | "labors" | "customers";

export type ImportSheet = {
  name: string;
  rowCount: number;
  headers: string[];
  rows: Record<string, string>[];
  allRows: Record<string, string>[];
};

export type ImportParseResult = {
  fileName: string;
  sheets: ImportSheet[];
};

export type ImportCommitResult = {
  message: string;
  inserted: number;
  updated: number;
  skipped: number;
};

export const catalogApi = {
  products: () => request<Product[]>(`${CAT}/products`),
  saveProduct: (item: Partial<Product>) =>
    request<Product>(item.id ? `${CAT}/products/${item.id}` : `${CAT}/products`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(item),
    }),
  deleteProduct: (id: string) => request<{ message: string }>(`${CAT}/products/${id}`, { method: "DELETE" }),
  labors: () => request<LaborCost[]>(`${CAT}/labors`),
  saveLabor: (item: Partial<LaborCost>) =>
    request<LaborCost>(item.id ? `${CAT}/labors/${item.id}` : `${CAT}/labors`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(item),
    }),
  deleteLabor: (id: string) => request<{ message: string }>(`${CAT}/labors/${id}`, { method: "DELETE" }),
  customers: () => request<Customer[]>(`${CAT}/customers`),
  saveCustomer: (item: Partial<Customer>) =>
    request<Customer>(item.id ? `${CAT}/customers/${item.id}` : `${CAT}/customers`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(item),
    }),
  deleteCustomer: (id: string) => request<{ message: string }>(`${CAT}/customers/${id}`, { method: "DELETE" }),
  parseImport: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ImportParseResult>(`${CAT}/import/parse`, { method: "POST", body: form });
  },
  commitImport: (mode: ImportMode, rows: Record<string, string>[]) =>
    request<ImportCommitResult>(`${CAT}/import/${mode}`, {
      method: "POST",
      body: JSON.stringify({ rows }),
    }),
  downloadImportTemplate: async (mode: ImportMode) => {
    const token = getToken();
    const res = await fetch(`${CAT}/import/template/${mode}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({} as { message?: string }));
      throw new Error(data.message || "Không tải được mẫu");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      mode === "products" ? "mau_import_dmsp.xlsx" : mode === "labors" ? "mau_import_tiencong.xlsx" : "mau_import_dmkh.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },
  inventory: () => request<(Product & { quantity: number })[]>(`${CAT}/inventory`),
  stockOuts: () => request<StockOut[]>(`${CAT}/stock-outs`),
  stockOut: (id: string) => request<StockOut>(`${CAT}/stock-outs/${id}`),
  saveStockOut: (item: Partial<StockOut> & { lines?: StockOutLine[] }) =>
    request<StockOut>(item.id ? `${CAT}/stock-outs/${item.id}` : `${CAT}/stock-outs`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify({
        ...item,
        lines: (item.lines || []).map((line) => ({
          materialId: line.materialId || line.product?.id,
          materialName: line.materialName,
          quantity: line.quantity,
          unit: line.unit,
          warehouseCode: line.warehouseCode,
          lotCode: line.lotCode,
          batchNo: line.batchNo,
          shelfCode: line.shelfCode,
          hsCode: line.hsCode,
          note: line.note,
        })),
      }),
    }),
  deleteStockOut: (id: string) => request<{ message: string }>(`${CAT}/stock-outs/${id}`, { method: "DELETE" }),
};

export type BhLine = {
  id?: string;
  stt?: number;
  loai: "tc" | "pt" | string;
  ma: string;
  ten: string;
  dvt?: string;
  so_luong: number;
  gia: number;
  tien?: number;
  tl_ck?: number;
  tien_ck?: number;
  thue_suat?: number;
  tien_thue?: number;
  ghi_chu?: string;
  so_serial?: string;
  ma_km?: string;
  ten_km?: string;
  tk?: string;
  ma_kho?: string;
  tk_no?: string;
  ton?: number;
};

export type BhQuote = {
  id: string;
  so_ct: string;
  ngay_ct: string;
  status: string;
  ma_kh?: string;
  ten_kh?: string;
  dia_chi?: string;
  dien_thoai?: string;
  email?: string;
  mst?: string;
  cccd?: string;
  so_serial?: string;
  ma_sp?: string;
  ten_sp?: string;
  hang_xe?: string;
  ten_xe?: string;
  bien_so?: string;
  nam_sx?: string;
  odo?: string;
  loai_sp?: string;
  lo_sx?: string;
  tg_sd?: string;
  nguon_goc?: string;
  lay_pt_cu?: number;
  tg_tiep_nhan?: string;
  tg_hoan_tra_dk?: string;
  xuat_hd?: number;
  tu_van?: string;
  yeu_cau?: string;
  tt_sp?: string;
  dien_giai?: string;
  t_tien?: number;
  t_tcong?: number;
  t_ck_tc?: number;
  t_phutung?: number;
  t_ck_pt?: number;
  t_thue?: number;
  lines?: BhLine[];
};

export type BhTicket = BhQuote & {
  loai_bh?: number;
  nam_sx?: string;
  odo?: string;
  tu_van?: string;
  ngay_hen?: string;
  ghi_chu?: string;
  lo_sx?: string;
  tg_sd?: string;
  nguon_goc?: string;
  lay_pt_cu?: number;
  tg_tiep_nhan?: string;
  tg_hoan_tra_dk?: string;
  tg_hoan_tra_tt?: string;
  xuat_hd?: number;
  hd_ten?: string;
  hd_dia_chi?: string;
  hd_mst?: string;
  hd_cccd?: string;
  hd_dt?: string;
  hd_email?: string;
  hoan_tat?: number;
  da_xuat?: number;
  da_nhap?: number;
  da_giao?: number;
  da_thu?: number;
  da_hd?: number;
  nv_tiep_nhan?: string;
  nv_ktv?: string;
  nv_ketoan?: string;
  createdBy?: string;
  bg_id?: string;
  so_bg?: string;
  t_tt?: number;
};

export type BhWarehouse = {
  id: string;
  so_ct: string;
  ngay_ct: string;
  ma_gd: number;
  loai_nx?: string;
  status: string;
  so_serial?: string;
  serial_moi?: string;
  dien_giai?: string;
  phieuId?: string;
  so_phieu?: string;
  ma_kh?: string;
  ten_kh?: string;
  dia_chi?: string;
  nguoi_nhan?: string;
  nv_ban?: string;
  quyen_so?: string;
  lines?: BhLine[];
};

export type BhReceipt = {
  id: string;
  so_ct: string;
  ngay_ct: string;
  so_tien: number;
  hinh_thuc?: string;
  status?: string;
  ten_kh?: string;
  ma_kh?: string;
  dia_chi?: string;
  nguoi_nop?: string;
  ly_do?: string;
  phieuId?: string;
  so_phieu?: string;
  t_tt?: number;
  quyen_so?: string;
  lines?: { stt?: number; so_serial?: string; tk_no?: string; ten_tk?: string; so_tien: number; ghi_chu?: string; so_ct_dv?: string; ngay_ct_dv?: string }[];
};

export type BhInvoice = {
  id: string;
  so_ct: string;
  ngay_ct: string;
  status?: string;
  ten_kh?: string;
  ma_kh?: string;
  t_tien?: number;
  so_phieu?: string;
  phieuId?: string;
  dia_chi?: string;
  mst?: string;
  dien_thoai?: string;
  email?: string;
  cccd?: string;
  lines?: BhLine[];
};

export type BhKmLine = { loai: "tc" | "pt" | string; ma: string; tl_km?: number; tien_km?: number };
export type BhKm = {
  id: string;
  ma_km: string;
  ten_km: string;
  ngay_hl1?: string;
  ngay_hl2?: string;
  trang_thai?: number;
  ghi_chu?: string;
  ghi_chu_duyet?: string;
  lines?: BhKmLine[];
};

export type BhBoard = {
  sua: number;
  sale: number;
  dv: number;
  months: { label: string; sua: number; sale: number; dv: number }[];
  steps: { label: string; count: number }[];
  tickets: { so_ct: string; ngay: string; loai_bh?: number; ten_kh?: string; so_serial?: string; status?: string; t_tt?: number }[];
};

const BH = "/api/catalog/warranty";

export const warrantyApi = {
  quotes: () => request<BhQuote[]>(`${BH}/quotes`),
  quote: (id: string) => request<BhQuote>(`${BH}/quotes/${id}`),
  saveQuote: (item: Partial<BhQuote>) =>
    request<BhQuote>(item.id ? `${BH}/quotes/${item.id}` : `${BH}/quotes`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(item),
    }),
  postQuote: (id: string) => request<BhQuote>(`${BH}/quotes/${id}/post`, { method: "POST" }),
  serial: (serial: string) => request<Record<string, string>>(`${BH}/serial?serial=${encodeURIComponent(serial)}`),
  suggest: () => request<{
    customers: { ma_kh: string; ten_kh?: string; dia_chi?: string; dien_thoai?: string; email?: string; mst?: string; cccd?: string; nhom?: string }[];
    serials: { so_serial: string; ma_kh?: string; ten_kh?: string; ma_sp?: string; ten_sp?: string; so_batch?: string }[];
    staff: { username: string; role: string }[];
  }>(`${BH}/suggest`),
  serialReport: (params: {
    q?: string;
    ma_kh?: string;
    ma_sp?: string;
    tinh_trang?: string;
    from?: string;
    to?: string;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) qs.set(key, value);
    });
    return request<{
      rows: Record<string, string | number | null>[];
      summary: { tinh_trang: string; so_luong: number }[];
      total: number;
    }>(`${BH}/serial-report?${qs.toString()}`);
  },
  kmList: () => request<BhKm[]>(`${BH}/km`),
  km: (id: string) => request<BhKm>(`${BH}/km/${id}`),
  saveKm: (item: Partial<BhKm>) =>
    request<BhKm>(item.id ? `${BH}/km/${item.id}` : `${BH}/km`, { method: item.id ? "PUT" : "POST", body: JSON.stringify(item) }),
  kmStatus: (id: string, trang_thai: number, ghi_chu_duyet?: string) =>
    request<BhKm>(`${BH}/km/${id}/status`, { method: "POST", body: JSON.stringify({ trang_thai, ghi_chu_duyet }) }),
  matchKm: (loai: string, ma: string, ngay?: string) =>
    request<{ ma_km: string; ten_km: string; tl_km: number; tien_km: number }[]>(
      `${BH}/km/match?loai=${encodeURIComponent(loai)}&ma=${encodeURIComponent(ma)}&ngay=${encodeURIComponent(ngay || "")}`
    ),
  board: () => request<BhBoard>(`${BH}/board`),
  tickets: () => request<BhTicket[]>(`${BH}/tickets`),
  ticket: (id: string) => request<BhTicket>(`${BH}/tickets/${id}`),
  saveTicket: (item: Partial<BhTicket>) =>
    request<BhTicket>(item.id ? `${BH}/tickets/${item.id}` : `${BH}/tickets`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(item),
    }),
  postTicket: (id: string) => request<BhTicket>(`${BH}/tickets/${id}/post`, { method: "POST" }),
  completeTicket: (id: string) => request<BhTicket>(`${BH}/tickets/${id}/complete`, { method: "POST" }),
  cancelTicket: (id: string) => request<BhTicket>(`${BH}/tickets/${id}/cancel`, { method: "POST" }),
  warehouses: () => request<BhWarehouse[]>(`${BH}/warehouse`),
  warehouse: (id: string) => request<BhWarehouse>(`${BH}/warehouse/${id}`),
  saveWarehouse: (item: Partial<BhWarehouse>) =>
    request<BhWarehouse>(item.id ? `${BH}/warehouse/${item.id}` : `${BH}/warehouse`, {
      method: item.id ? "PUT" : "POST",
      body: JSON.stringify(item),
    }),
  postWarehouse: (id: string) => request<BhWarehouse>(`${BH}/warehouse/${id}/post`, { method: "POST" }),
  receipts: () => request<BhReceipt[]>(`${BH}/receipts`),
  receipt: (id: string) => request<BhReceipt>(`${BH}/receipts/${id}`),
  saveReceipt: (item: Partial<BhReceipt>) =>
    request<BhReceipt>(`${BH}/receipts`, { method: "POST", body: JSON.stringify(item) }),
  invoices: () => request<BhInvoice[]>(`${BH}/invoices`),
  invoice: (id: string) => request<BhInvoice>(`${BH}/invoices/${id}`),
  saveInvoice: (body: { phieuId: string; ma_kh?: string; ten_kh?: string; dia_chi?: string }) =>
    request<BhInvoice>(`${BH}/invoices`, { method: "POST", body: JSON.stringify(body) }),
  postInvoice: (id: string) => request<BhInvoice>(`${BH}/invoices/${id}/post`, { method: "POST" }),
  situation: (body: { so_serial: string; tinh_trang: string; ghi_chu?: string }) =>
    request<{ ok: boolean }>(`${BH}/serial/situation`, { method: "POST", body: JSON.stringify(body) }),
  replaceSerial: (so_serial: string) =>
    request<{ so_serial: string; ma_sp?: string; ten_sp?: string }>(`${BH}/serial/replace`, { method: "POST", body: JSON.stringify({ so_serial }) }),
  trace: (q: string) => request<{
    serial: Record<string, string> | null;
    quotes: BhQuote[];
    tickets: BhTicket[];
    kho: BhWarehouse[];
    thu: BhReceipt[];
    hd: BhInvoice[];
    logs: { tinh_trang: string; ghi_chu?: string; changedAt?: string; changedBy?: string }[];
  }>(`${BH}/trace?q=${encodeURIComponent(q)}`),
};

export const serialApi = {
  lockStatus: () => request<{ locked: boolean; mine: boolean; username: string }>(`${CAT}/serials/lock`),
  acquire: () => request<{ ok: boolean; username: string; message?: string }>(`${CAT}/serials/lock`, { method: "POST" }),
  heartbeat: () => request<{ ok: boolean }>(`${CAT}/serials/lock/heartbeat`, { method: "POST" }),
  release: () => request<{ ok: boolean }>(`${CAT}/serials/lock`, { method: "DELETE" }),
  vouchers: () => request<StockOut[]>(`${CAT}/serials/vouchers`),
  voucher: (id: string) => request<{ voucher: StockOut; serials: SerialItem[] }>(`${CAT}/serials/vouchers/${id}`),
  create: (stockOutId: string) =>
    request<{ voucher: StockOut; serials: SerialItem[] }>(`${CAT}/serials`, {
      method: "POST",
      body: JSON.stringify({ stockOutId }),
    }),
  complete: (stockOutId: string) =>
    request<{ voucher: StockOut; serials: SerialItem[] }>(`${CAT}/serials/complete`, {
      method: "POST",
      body: JSON.stringify({ stockOutId }),
    }),
  list: (q = "") => request<SerialItem[]>(`${CAT}/serials${q ? `?q=${encodeURIComponent(q)}` : ""}`),
};
