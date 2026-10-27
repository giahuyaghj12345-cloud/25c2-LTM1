require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const sql = require("mssql");

(async () => {
  const pool = await sql.connect({
    server: "127.0.0.1",
    port: Number(process.env.DB_PORT) || 65346,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true },
  });
  const users = await pool.request().query("SELECT TOP 10 username, email, role, status FROM dbo.users");
  console.log("USERS", JSON.stringify(users.recordset, null, 2));
  const tables = await pool.request().query(`
    SELECT OBJECT_ID('dbo.bh_phieu') AS bh_phieu, OBJECT_ID('dbo.bh_baogia') AS bh_baogia,
           OBJECT_ID('dbo.bh_kho') AS bh_kho, OBJECT_ID('dbo.bh_thu') AS bh_thu,
           OBJECT_ID('dbo.bh_hoadon') AS bh_hd, OBJECT_ID('dbo.dm_serial') AS dm_serial
  `);
  console.log("TABLES", JSON.stringify(tables.recordset, null, 2));
  try {
    const serials = await pool.request().query("SELECT TOP 3 so_serial, ma_sp, ten_sp, ma_kh FROM dbo.dm_serial ORDER BY createdAt DESC");
    console.log("SERIALS", JSON.stringify(serials.recordset, null, 2));
  } catch (e) {
    console.log("SERIALS_ERR", e.message);
  }
  try {
    const products = await pool.request().query("SELECT TOP 5 ma_sp, ten_sp, ISNULL(sl_ton,0) AS sl_ton FROM dbo.dmsp ORDER BY ma_sp");
    console.log("PRODUCTS", JSON.stringify(products.recordset, null, 2));
  } catch (e) {
    console.log("PRODUCTS_ERR", e.message);
  }
  await pool.close();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
