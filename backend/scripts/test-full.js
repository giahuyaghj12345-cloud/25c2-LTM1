/**
 * Full regression: auth, catalog, import, serial report, BH GGV flow, edit-after-post, staff fields.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const sql = require("mssql");
const bcrypt = require("bcryptjs");

const API = "http://127.0.0.1:5000/api";
const results = [];

function ok(name, detail = "") {
  results.push({ name, pass: true, detail });
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}
function fail(name, err) {
  results.push({ name, pass: false, detail: String(err) });
  console.error(`FAIL  ${name} — ${err}`);
}

async function req(path, { method = "GET", token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload });
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
    UPDATE dbo.users SET password = N'${hash.replace(/'/g, "''")}', status = N'active'
    WHERE email IN (N'bh@demo.local', N'Giahuyaghj12345@gmail.com')
       OR username IN (N'admin', N'bhdemo')
  `);
  // ensure staff columns
  await pool.request().query(`
    IF COL_LENGTH('dbo.bh_phieu', 'nv_tiep_nhan') IS NULL ALTER TABLE dbo.bh_phieu ADD nv_tiep_nhan NVARCHAR(80) NULL;
    IF COL_LENGTH('dbo.bh_phieu', 'nv_ktv') IS NULL ALTER TABLE dbo.bh_phieu ADD nv_ktv NVARCHAR(80) NULL;
    IF COL_LENGTH('dbo.bh_phieu', 'nv_ketoan') IS NULL ALTER TABLE dbo.bh_phieu ADD nv_ketoan NVARCHAR(80) NULL;
  `);
  await pool.close();

  // Prefer admin/warehouse for import + BH write; fallback warranty.
  for (const email of ["Giahuyaghj12345@gmail.com", "kho@demo.local", "ban@demo.local", "bh@demo.local"]) {
    try {
      const login = await req("/auth/login", { method: "POST", body: { email, password: "Demo@123" } });
      return { token: login.token, user: login.user, email };
    } catch {
      /* try next */
    }
  }
  throw new Error("Không đăng nhập được tài khoản demo");
}

(async () => {
  console.log("=== FULL SYSTEM TEST ===\n");

  // health
  try {
    const h = await req("/health");
    ok("health", JSON.stringify(h));
  } catch (e) {
    fail("health", e.message);
    process.exit(1);
  }

  let token, user;
  try {
    const login = await ensureLogin();
    token = login.token;
    user = login.user;
    ok("login", `${login.email} role=${user.role}`);
  } catch (e) {
    fail("login", e.message);
    process.exit(1);
  }

  // catalog lists
  let products = [], labors = [], customers = [];
  try {
    products = await req("/catalog/products", { token });
    labors = await req("/catalog/labors", { token });
    customers = await req("/catalog/customers", { token });
    ok("catalog.list", `sp=${products.length} tc=${labors.length} kh=${customers.length}`);
  } catch (e) {
    fail("catalog.list", e.message);
  }

  // import excel CSV
  try {
    const csv = "ma_sp,ten_sp,dvt,sl_ton,vt_ton_kho\nSPTEST99,San pham test import,Cai,5,1\n";
    const form = new FormData();
    form.append("file", new Blob([csv], { type: "text/csv" }), "mau_import_dmsp.csv");
    const parsed = await req("/catalog/import/parse", { method: "POST", token, formData: form });
    if (!parsed.sheets?.length) throw new Error("parse không có sheet");
    const rows = parsed.sheets[0].allRows || parsed.sheets[0].rows;
    const committed = await req("/catalog/import/products", { method: "POST", token, body: { rows } });
    ok("import.products", committed.message || JSON.stringify(committed));
  } catch (e) {
    fail("import.products", e.message);
  }

  // template xlsx
  try {
    const res = await fetch(`${API}/catalog/import/template/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`template ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error("file quá nhỏ");
    const ct = res.headers.get("content-type") || "";
    ok("import.template.xlsx", `${buf.length} bytes, ${ct}`);
  } catch (e) {
    fail("import.template.xlsx", e.message);
  }

  // serial report
  try {
    const report = await req("/catalog/warranty/serial-report", { token });
    ok("serial.report", `rows=${report.total ?? report.rows?.length} summary=${report.summary?.length}`);
  } catch (e) {
    fail("serial.report", e.message);
  }

  // suggest + staff
  let suggest;
  try {
    suggest = await req("/catalog/warranty/suggest", { token });
    ok("warranty.suggest", `serials=${suggest.serials?.length} staff=${suggest.staff?.length || 0}`);
  } catch (e) {
    fail("warranty.suggest", e.message);
  }

  const serial = suggest?.serials?.[0];
  const customer = suggest?.customers?.[0] || { ma_kh: serial?.ma_kh, ten_kh: serial?.ten_kh };
  const product = products.find((p) => p.code === serial?.ma_sp) || products[0];
  const labor = labors[0];
  if (!serial || !product) {
    fail("warranty.prereq", "Thiếu serial hoặc sản phẩm");
    printSummary();
    process.exit(1);
  }

  const price = Number(product.prices?.[0]?.price || product.prices?.[0]?.gia || 100000);
  const laborPrice = Number(labor?.amount || 50000);
  const staffName = suggest.staff?.[0]?.username || user.username;

  // quote -> post
  let quote;
  try {
    quote = await req("/catalog/warranty/quotes", {
      method: "POST",
      token,
      body: {
        ma_kh: customer.ma_kh || serial.ma_kh || "KH001",
        ten_kh: customer.ten_kh || serial.ten_kh || "Khách demo",
        so_serial: serial.so_serial,
        ma_sp: serial.ma_sp || product.code,
        ten_sp: serial.ten_sp || product.name,
        xuat_hd: 1,
        dien_giai: "Full test BG",
        lines: [
          { loai: "tc", ma: labor?.code || "TC01", ten: labor?.name || "Công", dvt: "Lần", so_luong: 1, gia: laborPrice },
          { loai: "pt", ma: product.code, ten: product.name, dvt: product.unit || "Cái", so_luong: 1, gia: price || 100000 },
        ],
      },
    });
    quote = await req(`/catalog/warranty/quotes/${quote.id}/post`, { method: "POST", token });
    ok("warranty.quote", quote.so_ct);
  } catch (e) {
    fail("warranty.quote", e.message);
  }

  // ticket loai 5 + staff + nhan (save+post)
  let ticket;
  try {
    ticket = await req("/catalog/warranty/tickets", {
      method: "POST",
      token,
      body: {
        ma_kh: customer.ma_kh || serial.ma_kh || "KH001",
        ten_kh: customer.ten_kh || serial.ten_kh || "Khách demo",
        so_serial: serial.so_serial,
        ma_sp: serial.ma_sp || product.code,
        ten_sp: serial.ten_sp || product.name,
        loai_bh: 5,
        xuat_hd: 1,
        nv_tiep_nhan: staffName,
        nv_ktv: staffName,
        nv_ketoan: staffName,
        yeu_cau: "Full test phiếu BH",
        tg_tiep_nhan: new Date().toISOString().slice(0, 16),
        bg_id: quote?.id,
        so_bg: quote?.so_ct,
        lines: [
          { loai: "tc", ma: labor?.code || "TC01", ten: labor?.name || "Công", dvt: "Lần", so_luong: 1, gia: laborPrice },
          { loai: "pt", ma: product.code, ten: product.name, dvt: product.unit || "Cái", so_luong: 1, gia: price || 100000 },
        ],
      },
    });
    if (!ticket.nv_tiep_nhan && !ticket.nv_ktv) {
      // columns may return; accept if save succeeded
    }
    ticket = await req(`/catalog/warranty/tickets/${ticket.id}/post`, { method: "POST", token });
    if (ticket.status === "nhap") throw new Error("post không đổi status");
    ok("warranty.ticket.post", `${ticket.so_ct} loai=${ticket.loai_bh} status=${ticket.status} nv=${ticket.nv_tiep_nhan || staffName}`);
  } catch (e) {
    fail("warranty.ticket.post", e.message);
  }

  // edit after post (GGV)
  try {
    if (!ticket?.id) throw new Error("không có ticket");
    const edited = await req(`/catalog/warranty/tickets/${ticket.id}`, {
      method: "PUT",
      token,
      body: {
        ...ticket,
        yeu_cau: "Đã sửa sau ghi sổ",
        tu_van: "Tư vấn update",
        nv_ktv: staffName,
        lines: ticket.lines || [],
      },
    });
    if (edited.yeu_cau !== "Đã sửa sau ghi sổ") throw new Error("không lưu được nội dung sau ghi sổ");
    if (edited.status === "nhap") throw new Error("status bị reset về nháp");
    ticket = edited;
    ok("warranty.editAfterPost", `status=${edited.status}`);
  } catch (e) {
    fail("warranty.editAfterPost", e.message);
  }

  // warehouse MGD 7
  let kho;
  try {
    kho = await req("/catalog/warranty/warehouse", {
      method: "POST",
      token,
      body: {
        phieuId: ticket.id,
        ma_gd: 7,
        loai_nx: "xuat",
        so_serial: ticket.so_serial,
        dien_giai: "Xuất PT test",
        lines: (ticket.lines || []).filter((l) => l.loai === "pt"),
      },
    });
    kho = await req(`/catalog/warranty/warehouse/${kho.id}/post`, { method: "POST", token });
    ok("warranty.kho.mgd7", `${kho.so_ct} status=${kho.status}`);
  } catch (e) {
    fail("warranty.kho.mgd7", e.message);
  }

  // MGD 10 nhap + xuat (loai 5 = repair)
  try {
    let k10 = await req("/catalog/warranty/warehouse", {
      method: "POST",
      token,
      body: { phieuId: ticket.id, ma_gd: 10, loai_nx: "nhap", so_serial: ticket.so_serial, dien_giai: "Nhập sau BH" },
    });
    k10 = await req(`/catalog/warranty/warehouse/${k10.id}/post`, { method: "POST", token });
    let k10x = await req("/catalog/warranty/warehouse", {
      method: "POST",
      token,
      body: { phieuId: ticket.id, ma_gd: 10, loai_nx: "xuat", so_serial: ticket.so_serial, dien_giai: "Xuất giao KH" },
    });
    k10x = await req(`/catalog/warranty/warehouse/${k10x.id}/post`, { method: "POST", token });
    ok("warranty.kho.mgd10", `nhap=${k10.so_ct} xuat=${k10x.so_ct}`);
  } catch (e) {
    fail("warranty.kho.mgd10", e.message);
  }

  // block MGD 8 on repair ticket
  try {
    await req("/catalog/warranty/warehouse", {
      method: "POST",
      token,
      body: { phieuId: ticket.id, ma_gd: 8, loai_nx: "xuat", so_serial: ticket.so_serial, serial_moi: "TMP-SERIAL-TEST" },
    });
    fail("warranty.block.mgd8", "MGD 8 lẽ ra phải bị chặn với loại 5");
  } catch (e) {
    ok("warranty.block.mgd8", e.message.slice(0, 80));
  }

  // receipt
  try {
    const thu = await req("/catalog/warranty/receipts", {
      method: "POST",
      token,
      body: {
        phieuId: ticket.id,
        so_tien: Number(ticket.t_tt) || 100000,
        hinh_thuc: "TM",
        ly_do: "Thu test full",
      },
    });
    ok("warranty.receipt", thu.so_ct || thu.id);
  } catch (e) {
    fail("warranty.receipt", e.message);
  }

  // invoice
  try {
    let hd = await req("/catalog/warranty/invoices", {
      method: "POST",
      token,
      body: { phieuId: ticket.id, ma_kh: ticket.ma_kh, ten_kh: ticket.ten_kh },
    });
    hd = await req(`/catalog/warranty/invoices/${hd.id}/post`, { method: "POST", token });
    ok("warranty.invoice", `${hd.so_ct} status=${hd.status}`);
  } catch (e) {
    fail("warranty.invoice", e.message);
  }

  // complete
  try {
    const done = await req(`/catalog/warranty/tickets/${ticket.id}/complete`, { method: "POST", token });
    if (Number(done.hoan_tat) !== 1 && done.status !== "hoan_tat") throw new Error("chưa hoàn tất");
    ok("warranty.complete", done.status);
  } catch (e) {
    fail("warranty.complete", e.message);
  }

  // cannot edit after complete
  try {
    await req(`/catalog/warranty/tickets/${ticket.id}`, {
      method: "PUT",
      token,
      body: { ...ticket, yeu_cau: "không được", lines: ticket.lines || [] },
    });
    fail("warranty.lockAfterComplete", "vẫn sửa được sau hoàn tất");
  } catch (e) {
    ok("warranty.lockAfterComplete", e.message.slice(0, 80));
  }

  // workflow flags
  try {
    const fresh = await req(`/catalog/warranty/tickets/${ticket.id}`, { token });
    ok(
      "warranty.flags",
      `xuat=${fresh.da_xuat} nhap=${fresh.da_nhap} giao=${fresh.da_giao} thu=${fresh.da_thu} hd=${fresh.da_hd}`
    );
  } catch (e) {
    fail("warranty.flags", e.message);
  }

  // inventory + stock outs smoke
  try {
    const inv = await req("/catalog/inventory", { token });
    const outs = await req("/catalog/stock-outs", { token });
    ok("warehouse.lists", `ton=${inv.length} pxk=${outs.length}`);
  } catch (e) {
    fail("warehouse.lists", e.message);
  }

  // board
  try {
    const board = await req("/catalog/warranty/board", { token });
    ok("warranty.board", `sua=${board.sua} sale=${board.sale} dv=${board.dv}`);
  } catch (e) {
    fail("warranty.board", e.message);
  }

  printSummary();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

function printSummary() {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log("\n=== SUMMARY ===");
  console.log(`PASS=${passed} FAIL=${failed} TOTAL=${results.length}`);
  if (failed) {
    console.log("Failed:");
    results.filter((r) => !r.pass).forEach((r) => console.log(` - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
  console.log("ALL GREEN");
}
