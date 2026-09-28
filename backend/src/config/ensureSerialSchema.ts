import { AppDataSource } from "../config/database";

let serialSchemaReady = false;

async function run(sql: string) {
  try {
    await AppDataSource.query(sql);
  } catch (error) {
    console.error("ensureSerialSchema:", (error as Error).message);
  }
}

export async function ensureSerialSchema() {
  if (serialSchemaReady || !AppDataSource.isInitialized) return;

  await run(`
    IF COL_LENGTH('dbo.users', 'canCreateSerial') IS NULL
      ALTER TABLE dbo.users ADD canCreateSerial BIT NOT NULL CONSTRAINT DF_users_canCreateSerial DEFAULT 0
  `);
  await run(`
    IF COL_LENGTH('dbo.users', 'canCreateSerial') IS NOT NULL
      UPDATE dbo.users SET canCreateSerial = 1 WHERE role IN (N'admin', N'warehouse') AND ISNULL(canCreateSerial, 0) = 0
  `);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'kind') IS NULL ALTER TABLE dbo.stock_outs ADD kind NVARCHAR(30) NOT NULL CONSTRAINT DF_stock_outs_kind DEFAULT N'sale'`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'customerCode') IS NULL ALTER TABLE dbo.stock_outs ADD customerCode NVARCHAR(50) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'customerName') IS NULL ALTER TABLE dbo.stock_outs ADD customerName NVARCHAR(200) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'customerAddress') IS NULL ALTER TABLE dbo.stock_outs ADD customerAddress NVARCHAR(255) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'customerPhone') IS NULL ALTER TABLE dbo.stock_outs ADD customerPhone NVARCHAR(50) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'customerEmail') IS NULL ALTER TABLE dbo.stock_outs ADD customerEmail NVARCHAR(100) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'customerGroup') IS NULL ALTER TABLE dbo.stock_outs ADD customerGroup NVARCHAR(20) NOT NULL CONSTRAINT DF_stock_outs_cgroup DEFAULT N'dealer'`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'orderNumber') IS NULL ALTER TABLE dbo.stock_outs ADD orderNumber NVARCHAR(50) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'serialCreated') IS NULL ALTER TABLE dbo.stock_outs ADD serialCreated BIT NOT NULL CONSTRAINT DF_stock_outs_serialCreated DEFAULT 0`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'serialLocked') IS NULL ALTER TABLE dbo.stock_outs ADD serialLocked BIT NOT NULL CONSTRAINT DF_stock_outs_serialLocked DEFAULT 0`);
  await run(`IF COL_LENGTH('dbo.stock_out_lines', 'unit') IS NULL ALTER TABLE dbo.stock_out_lines ADD unit NVARCHAR(32) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_out_lines', 'warehouseCode') IS NULL ALTER TABLE dbo.stock_out_lines ADD warehouseCode NVARCHAR(20) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_out_lines', 'lotCode') IS NULL ALTER TABLE dbo.stock_out_lines ADD lotCode NVARCHAR(50) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'orderDate') IS NULL ALTER TABLE dbo.stock_outs ADD orderDate DATE NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'postingDate') IS NULL ALTER TABLE dbo.stock_outs ADD postingDate DATE NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'bookNumber') IS NULL ALTER TABLE dbo.stock_outs ADD bookNumber NVARCHAR(30) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'currency') IS NULL ALTER TABLE dbo.stock_outs ADD currency NVARCHAR(10) NOT NULL CONSTRAINT DF_stock_outs_ccy DEFAULT N'VND'`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'exchangeRate') IS NULL ALTER TABLE dbo.stock_outs ADD exchangeRate DECIMAL(18,4) NOT NULL CONSTRAINT DF_stock_outs_fx DEFAULT 1`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'salesStaff') IS NULL ALTER TABLE dbo.stock_outs ADD salesStaff NVARCHAR(100) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'deliveryStaff') IS NULL ALTER TABLE dbo.stock_outs ADD deliveryStaff NVARCHAR(100) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'deliveryAddress') IS NULL ALTER TABLE dbo.stock_outs ADD deliveryAddress NVARCHAR(255) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_outs', 'remark') IS NULL ALTER TABLE dbo.stock_outs ADD remark NVARCHAR(500) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_out_lines', 'shelfCode') IS NULL ALTER TABLE dbo.stock_out_lines ADD shelfCode NVARCHAR(20) NULL`);
  await run(`IF COL_LENGTH('dbo.stock_out_lines', 'hsCode') IS NULL ALTER TABLE dbo.stock_out_lines ADD hsCode NVARCHAR(20) NULL`);
  await run(`
    IF OBJECT_ID('dbo.serial_month_seq', 'U') IS NULL
    CREATE TABLE dbo.serial_month_seq (
      ym CHAR(6) NOT NULL PRIMARY KEY,
      lastNo INT NOT NULL
    )
  `);
  await run(`
    IF OBJECT_ID('dbo.serial_feature_lock', 'U') IS NULL
    CREATE TABLE dbo.serial_feature_lock (
      lockKey NVARCHAR(20) NOT NULL PRIMARY KEY,
      userId UNIQUEIDENTIFIER NULL,
      username NVARCHAR(100) NULL,
      heartbeatAt DATETIME NULL
    )
  `);
  await run(`
    IF OBJECT_ID('dbo.serial_feature_lock', 'U') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM dbo.serial_feature_lock WHERE lockKey = N'create-serial')
      INSERT INTO dbo.serial_feature_lock (lockKey) VALUES (N'create-serial')
  `);
  await run(`
    IF OBJECT_ID('dbo.dm_serial', 'U') IS NULL
    CREATE TABLE dbo.dm_serial (
      id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
      so_serial NVARCHAR(20) NOT NULL UNIQUE,
      ma_kh NVARCHAR(50) NULL,
      ten_kh NVARCHAR(200) NULL,
      so_don_hang NVARCHAR(50) NULL,
      ngay_xuat DATE NULL,
      so_px NVARCHAR(50) NULL,
      stockOutId UNIQUEIDENTIFIER NULL,
      stockOutLineId UNIQUEIDENTIFIER NULL,
      ma_sp NVARCHAR(20) NULL,
      ten_sp NVARCHAR(255) NULL,
      dvt NVARCHAR(32) NULL,
      nh_sp NVARCHAR(20) NULL,
      ma_kho NVARCHAR(20) NULL,
      ma_lo NVARCHAR(50) NULL,
      so_batch NVARCHAR(50) NULL,
      trang_thai NVARCHAR(30) NOT NULL CONSTRAINT DF_dm_serial_tt DEFAULT N'Mới tạo',
      tinh_trang NVARCHAR(100) NOT NULL CONSTRAINT DF_dm_serial_tinh DEFAULT N'Mới tạo',
      ghi_chu NVARCHAR(500) NULL,
      ngay_bh_tu DATE NULL,
      ngay_bh_den DATE NULL,
      thoi_gian_bh NVARCHAR(50) NULL,
      createdAt DATETIME NOT NULL CONSTRAINT DF_dm_serial_created DEFAULT GETDATE(),
      createdBy NVARCHAR(100) NULL,
      changedAt DATETIME NULL,
      changedBy NVARCHAR(100) NULL,
      ngay_kh_bh DATE NULL,
      kh_kich_hoat NVARCHAR(200) NULL,
      email_kh_bh NVARCHAR(100) NULL,
      dt_kh_bh NVARCHAR(50) NULL,
      ngay_hh_bh_web DATE NULL,
      dai_ly_mua NVARCHAR(200) NULL,
      dia_chi_dl NVARCHAR(255) NULL,
      ngay_mua_dl DATE NULL,
      ghi_chu_kh_bh NVARCHAR(500) NULL
    )
  `);
  await run(`
    IF OBJECT_ID('dbo.dm_serial', 'U') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_dm_serial_stockOutId' AND object_id = OBJECT_ID(N'dbo.dm_serial'))
      CREATE INDEX IX_dm_serial_stockOutId ON dbo.dm_serial (stockOutId)
  `);
  await run(`
    IF OBJECT_ID('dbo.dm_serial_log', 'U') IS NULL
    CREATE TABLE dbo.dm_serial_log (
      id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
      serialId UNIQUEIDENTIFIER NOT NULL,
      so_serial NVARCHAR(20) NOT NULL,
      tinh_trang NVARCHAR(100) NOT NULL,
      ghi_chu NVARCHAR(500) NULL,
      changedAt DATETIME NOT NULL CONSTRAINT DF_dm_serial_log_at DEFAULT GETDATE(),
      changedBy NVARCHAR(100) NULL,
      CONSTRAINT FK_dm_serial_log_serial FOREIGN KEY (serialId) REFERENCES dbo.dm_serial(id)
    )
  `);

  const check = await AppDataSource.query(`SELECT COL_LENGTH('dbo.users', 'canCreateSerial') AS n, OBJECT_ID('dbo.dm_serial') AS t`);
  serialSchemaReady = Number(check?.[0]?.n) > 0 && Number(check?.[0]?.t) > 0;
  if (serialSchemaReady) console.log("serial schema ready");
}
