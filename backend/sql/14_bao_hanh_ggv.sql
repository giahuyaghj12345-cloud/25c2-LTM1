IF COL_LENGTH('dbo.bh_baogia_ct', 'ma_km') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD ma_km NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.bh_baogia_ct', 'ten_km') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD ten_km NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_baogia_ct', 'tk') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD tk NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_phieu_ct', 'ma_km') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD ma_km NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.bh_phieu_ct', 'ten_km') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD ten_km NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_phieu_ct', 'tk') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD tk NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_kho_ct', 'ma_kho') IS NULL ALTER TABLE dbo.bh_kho_ct ADD ma_kho NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_kho_ct', 'tk_no') IS NULL ALTER TABLE dbo.bh_kho_ct ADD tk_no NVARCHAR(20) NULL;
GO
IF OBJECT_ID(N'dbo.bh_thu_ct', N'U') IS NULL
CREATE TABLE dbo.bh_thu_ct (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  thuId UNIQUEIDENTIFIER NOT NULL,
  stt INT NOT NULL,
  so_serial NVARCHAR(50) NULL,
  tk_no NVARCHAR(20) NULL,
  ten_tk NVARCHAR(200) NULL,
  so_tien DECIMAL(18,2) NOT NULL DEFAULT 0,
  ghi_chu NVARCHAR(200) NULL,
  so_ct_dv NVARCHAR(30) NULL,
  ngay_ct_dv DATE NULL
);
GO
IF OBJECT_ID(N'dbo.dm_bh_km', N'U') IS NULL
CREATE TABLE dbo.dm_bh_km (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  ma_km NVARCHAR(30) NOT NULL UNIQUE,
  ten_km NVARCHAR(200) NOT NULL,
  ngay_hl1 DATE NOT NULL,
  ngay_hl2 DATE NOT NULL,
  trang_thai INT NOT NULL DEFAULT 0,
  ghi_chu NVARCHAR(300) NULL,
  ghi_chu_duyet NVARCHAR(300) NULL,
  user_id0 NVARCHAR(80) NULL,
  datetime0 DATETIME NOT NULL DEFAULT GETDATE(),
  user_id_duyet NVARCHAR(80) NULL,
  datetime_duyet DATETIME NULL
);
GO
IF OBJECT_ID(N'dbo.dm_bh_km_ct', N'U') IS NULL
CREATE TABLE dbo.dm_bh_km_ct (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  kmId UNIQUEIDENTIFIER NOT NULL,
  loai NVARCHAR(10) NOT NULL,
  ma NVARCHAR(50) NOT NULL,
  tl_km DECIMAL(9,2) NOT NULL DEFAULT 0,
  tien_km DECIMAL(18,2) NOT NULL DEFAULT 0
);
