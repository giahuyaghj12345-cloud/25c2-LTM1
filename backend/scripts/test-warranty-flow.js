require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const sql = require("mssql");
const bcrypt = require("bcryptjs");

const API = "http://localhost:5000/api";

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data.message || JSON.stringify(data)}`);
  return data;
}

async function ensureLogin() {
  const pool = await sql.connect({
    server: "127.0.0.1",
    port: Number(process.env.DB_PORT) || 65346,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true },
  });
  const hash = await bcrypt.hash("Demo@123", 10);
  await pool.request().query(`
    UPDATE dbo.users SET password = N'${hash.replace(/'/g, "''")}'
    WHERE email IN (N'bh@demo.local', N'Giahuyaghj12345@gmail.com')
  `);
  await pool.close();

  for (const email of ["bh@demo.local", "Giahuyaghj12345@gmail.com"]) {
    try {
      const login = await req("/auth/login", { method: "POST", body: { email, password: "Demo@123" } });
      console.log("LOGIN_OK", email, login.user.role);
      return login.token;
    } catch (e) {
      console.log("LOGIN_FAIL", email, e.message);
    }
  }
  throw new Error("Không đăng nhập được");
}

(async () => {
  const token = await ensureLogin();
  const suggest = await req("/catalog/warranty/suggest", { token });
  const serial = suggest.serials?.[0];
  const customer = suggest.customers?.[0] || { ma_kh: serial?.ma_kh, ten_kh: serial?.ten_kh };
  if (!serial) throw new Error("Không có serial để test");
  console.log("USE_SERIAL", serial.so_serial);

  const products = await req("/catalog/products", { token });
  const labors = await req("/catalog/labors", { token });
  const product = products.find((p) => p.code === serial.ma_sp) || products[0];
  const labor = labors[0];
  if (!product) throw new Error("Không có sản phẩm");
  console.log("PRODUCT", product.code, "LABOR", labor?.code || "(none)");

  const price = Number(product.prices?.[0]?.price || product.prices?.[0]?.gia || 100000);
  const laborPrice = Number(labor?.amount || 50000);

  // 1) Báo giá
  const quote = await req("/catalog/warranty/quotes", {
    token,
    method: "POST",
    body: {
      ma_kh: customer.ma_kh || serial.ma_kh || "KH001",
      ten_kh: customer.ten_kh || serial.ten_kh || "Khách demo",
      so_serial: serial.so_serial,
      ma_sp: serial.ma_sp || product.code,
      ten_sp: serial.ten_sp || product.name,
      xuat_hd: 1,
      dien_giai: "Test báo giá BH",
      lines: [
        { loai: "tc", ma: labor?.code || "TC01", ten: labor?.name || "Công sửa", dvt: "Lần", so_luong: 1, gia: laborPrice, tl_ck: 0, thue_suat: 0 },
        { loai: "pt", ma: product.code, ten: product.name, dvt: product.unit || "Cái", so_luong: 1, gia: price || 100000, tl_ck: 0, thue_suat: 0 },
      ],
    },
  });
  console.log("QUOTE", quote.so_ct, quote.id);
  const quotePosted = await req(`/catalog/warranty/quotes/${quote.id}/post`, { token, method: "POST" });
  console.log("QUOTE_POSTED", quotePosted.status);

  // 2) Phiếu BH từ báo giá
  const ticket = await req("/catalog/warranty/tickets", {
    token,
    method: "POST",
    body: {
      bg_id: quote.id,
      so_bg: quote.so_ct,
      loai_bh: 1,
      ma_kh: quote.ma_kh,
      ten_kh: quote.ten_kh,
      so_serial: quote.so_serial,
      ma_sp: quote.ma_sp,
      ten_sp: quote.ten_sp,
      xuat_hd: 1,
      lines: quotePosted.lines || quote.lines,
    },
  });
  console.log("TICKET", ticket.so_ct, ticket.status);
  const ticketPosted = await req(`/catalog/warranty/tickets/${ticket.id}/post`, { token, method: "POST" });
  console.log("TICKET_POSTED", ticketPosted.status);

  // 3) Kho MGD 7 xuất PT
  const kho7 = await req("/catalog/warranty/warehouse", {
    token,
    method: "POST",
    body: { phieuId: ticket.id, ma_gd: 7, loai_nx: "xuat" },
  });
  console.log("KHO7", kho7.so_ct, "lines", (kho7.lines || []).length);
  if (!(kho7.lines || []).length) throw new Error("Kho MGD7 không có dòng PT");
  const kho7Post = await req(`/catalog/warranty/warehouse/${kho7.id}/post`, { token, method: "POST" });
  console.log("KHO7_POST", kho7Post.status);

  // 4) Kho MGD 10 nhập
  const khoIn = await req("/catalog/warranty/warehouse", {
    token,
    method: "POST",
    body: { phieuId: ticket.id, ma_gd: 10, loai_nx: "nhap" },
  });
  const khoInPost = await req(`/catalog/warranty/warehouse/${khoIn.id}/post`, { token, method: "POST" });
  console.log("KHO10_NHAP", khoInPost.so_ct, khoInPost.status);

  // 5) Kho MGD 10 xuất giao
  const khoOut = await req("/catalog/warranty/warehouse", {
    token,
    method: "POST",
    body: { phieuId: ticket.id, ma_gd: 10, loai_nx: "xuat" },
  });
  const khoOutPost = await req(`/catalog/warranty/warehouse/${khoOut.id}/post`, { token, method: "POST" });
  console.log("KHO10_XUAT", khoOutPost.so_ct, khoOutPost.status);

  // 6) Thu tiền
  const amount = Number(ticketPosted.t_tt || ticket.t_tt || 0) || price + laborPrice;
  const receipt = await req("/catalog/warranty/receipts", {
    token,
    method: "POST",
    body: {
      phieuId: ticket.id,
      so_tien: amount,
      hinh_thuc: "tm",
      nguoi_nop: ticket.ten_kh,
      ly_do: "Thu BH demo",
      lines: [{ so_serial: ticket.so_serial, tk_no: "111", ten_tk: "Tiền mặt", so_tien: amount, ghi_chu: "Thu BH", so_ct_dv: ticket.so_ct }],
    },
  });
  console.log("RECEIPT", receipt.so_ct, receipt.so_tien);

  // 7) Hóa đơn
  const invoice = await req("/catalog/warranty/invoices", {
    token,
    method: "POST",
    body: { phieuId: ticket.id },
  });
  console.log("INVOICE", invoice.so_ct, invoice.status);
  const invoicePosted = await req(`/catalog/warranty/invoices/${invoice.id}/post`, { token, method: "POST" });
  console.log("INVOICE_POST", invoicePosted.status);

  // 8) Tra cứu
  const trace = await req(`/catalog/warranty/trace?q=${encodeURIComponent(serial.so_serial)}`, { token });
  console.log("TRACE", {
    serial: !!trace.serial,
    quotes: trace.quotes?.length || 0,
    tickets: trace.tickets?.length || 0,
    kho: trace.kho?.length || 0,
    thu: trace.thu?.length || 0,
    hd: trace.hd?.length || 0,
  });

  console.log("\n=== WARRANTY FLOW OK ===");
  console.log("Demo login: bh@demo.local / Demo@123 (hoặc email admin đã reset cùng mật khẩu)");
})().catch((e) => {
  console.error("\n=== WARRANTY FLOW FAIL ===");
  console.error(e.message);
  process.exit(1);
});
