require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const sql = require("mssql");
const bcrypt = require("bcryptjs");

const API = "http://127.0.0.1:5000/api";

async function req(path, { method = "GET", token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) payload = formData;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data.message || JSON.stringify(data)}`);
  return data;
}

(async () => {
  const pool = await sql.connect({
    server: "127.0.0.1",
    port: Number(process.env.DB_PORT) || 65346,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true },
  });
  const users = await pool.request().query(`
    SELECT TOP 20 username, email, role, status FROM dbo.users
    WHERE role IN (N'admin', N'warehouse', N'sales') AND status = N'active'
    ORDER BY CASE role WHEN N'admin' THEN 0 WHEN N'warehouse' THEN 1 ELSE 2 END
  `);
  console.log("CANDIDATES", users.recordset);
  const hash = await bcrypt.hash("Demo@123", 10);
  if (users.recordset[0]) {
    await pool
      .request()
      .input("id", users.recordset[0].email || users.recordset[0].username)
      .query(`UPDATE dbo.users SET password = N'${hash.replace(/'/g, "''")}' WHERE email = @id OR username = @id`);
  }
  await pool.close();

  const account = users.recordset[0];
  if (!account) throw new Error("Không có user admin/warehouse/sales");
  const loginId = account.email || account.username;
  const login = await req("/auth/login", { method: "POST", body: { email: loginId, password: "Demo@123" } });
  console.log("LOGIN", login.user.username, login.user.role);
  const token = login.token;

  const csv = "ma_sp,ten_sp,dvt,sl_ton,vt_ton_kho\nSPTEST99,San pham test import,Cai,5,1\n";
  const form = new FormData();
  form.append("file", new Blob([csv], { type: "text/csv" }), "mau_import_dmsp.csv");
  const parsed = await req("/catalog/import/parse", { method: "POST", token, formData: form });
  const rows = parsed.sheets[0].allRows || parsed.sheets[0].rows;
  const committed = await req("/catalog/import/products", { method: "POST", token, body: { rows } });
  console.log("IMPORT", committed);

  const res = await fetch(`${API}/catalog/import/template/labors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`template ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("TEMPLATE_OK", buf.length, res.headers.get("content-type"));
  console.log("IMPORT_ADMIN_PASS");
})().catch((e) => {
  console.error("IMPORT_ADMIN_FAIL", e.message);
  process.exit(1);
});
