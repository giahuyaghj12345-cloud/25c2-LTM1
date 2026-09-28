USE [Quanlysanpham];
GO
-- Bao hanh (WinForms QuanLyKhoBaoHanh) — chay tren DB Quanlysanpham
-- Phieu BH, chi tiet PT/cong, bao gia, kho MGD 7/8/10/11, thu PT, hoa don

IF OBJECT_ID(N'dbo.bh_phieu', N'U') IS NULL
CREATE TABLE dbo.bh_phieu (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  so_ct NVARCHAR(30) NOT NULL,
  ngay_ct DATE NOT NULL DEFAULT GETDATE(),
  status NVARCHAR(20) NOT NULL DEFAULT N'nhap',
  ma_kh NVARCHAR(50) NULL,
  ten_kh NVARCHAR(200) NULL,
  dien_thoai NVARCHAR(30) NULL,
  dia_chi NVARCHAR(300) NULL,
  email NVARCHAR(100) NULL,
  so_serial NVARCHAR(50) NULL,
  ma_sp NVARCHAR(50) NULL,
  ten_sp NVARCHAR(200) NULL,
  hang_xe NVARCHAR(80) NULL,
  ten_xe NVARCHAR(80) NULL,
  nam_sx NVARCHAR(10) NULL,
  odo NVARCHAR(20) NULL,
  bien_so NVARCHAR(30) NULL,
  yeu_cau NVARCHAR(500) NULL,
  tu_van NVARCHAR(500) NULL,
  tt_sp NVARCHAR(200) NULL,
  ngay_hen DATE NULL,
  so_bg NVARCHAR(30) NULL,
  ghi_chu NVARCHAR(300) NULL,
  createdBy NVARCHAR(80) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE(),
  updatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.bh_phieu_ct', N'U') IS NULL
CREATE TABLE dbo.bh_phieu_ct (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phieuId UNIQUEIDENTIFIER NOT NULL,
  stt INT NOT NULL,
  loai NVARCHAR(10) NOT NULL,
  ma NVARCHAR(50) NULL,
  ten NVARCHAR(200) NULL,
  dvt NVARCHAR(20) NULL,
  so_luong DECIMAL(18,4) NOT NULL DEFAULT 1,
  gia DECIMAL(18,2) NOT NULL DEFAULT 0,
  tien DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT FK_bh_phieu_ct_phieu FOREIGN KEY (phieuId) REFERENCES dbo.bh_phieu(id) ON DELETE CASCADE
);

IF OBJECT_ID(N'dbo.bh_baogia', N'U') IS NULL
CREATE TABLE dbo.bh_baogia (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phieuId UNIQUEIDENTIFIER NULL,
  so_ct NVARCHAR(30) NOT NULL,
  ngay_ct DATE NOT NULL DEFAULT GETDATE(),
  status NVARCHAR(20) NOT NULL DEFAULT N'nhap',
  ma_kh NVARCHAR(50) NULL,
  ten_kh NVARCHAR(200) NULL,
  so_serial NVARCHAR(50) NULL,
  dien_giai NVARCHAR(300) NULL,
  t_tien DECIMAL(18,2) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.bh_baogia_ct', N'U') IS NULL
CREATE TABLE dbo.bh_baogia_ct (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  bgId UNIQUEIDENTIFIER NOT NULL,
  stt INT NOT NULL,
  loai NVARCHAR(10) NOT NULL,
  ma NVARCHAR(50) NULL,
  ten NVARCHAR(200) NULL,
  so_luong DECIMAL(18,4) NOT NULL DEFAULT 1,
  gia DECIMAL(18,2) NOT NULL DEFAULT 0,
  tien DECIMAL(18,2) NOT NULL DEFAULT 0,
  CONSTRAINT FK_bh_baogia_ct_bg FOREIGN KEY (bgId) REFERENCES dbo.bh_baogia(id) ON DELETE CASCADE
);

IF OBJECT_ID(N'dbo.bh_kho', N'U') IS NULL
CREATE TABLE dbo.bh_kho (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phieuId UNIQUEIDENTIFIER NULL,
  so_ct NVARCHAR(30) NOT NULL,
  ngay_ct DATE NOT NULL DEFAULT GETDATE(),
  ma_gd INT NOT NULL,              -- 7 xuat PT, 8 doi 1-1, 10 nhap/xuat sau BH, 11 nhap serial cu
  loai_nx NVARCHAR(10) NULL,       -- nhap / xuat (MGD 10)
  status NVARCHAR(20) NOT NULL DEFAULT N'nhap',
  so_serial NVARCHAR(50) NULL,
  serial_moi NVARCHAR(50) NULL,
  dien_giai NVARCHAR(300) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.bh_kho_ct', N'U') IS NULL
CREATE TABLE dbo.bh_kho_ct (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  khoId UNIQUEIDENTIFIER NOT NULL,
  stt INT NOT NULL,
  ma_sp NVARCHAR(50) NULL,
  ten_sp NVARCHAR(200) NULL,
  so_luong DECIMAL(18,4) NOT NULL DEFAULT 1,
  so_serial NVARCHAR(50) NULL,
  CONSTRAINT FK_bh_kho_ct_kho FOREIGN KEY (khoId) REFERENCES dbo.bh_kho(id) ON DELETE CASCADE
);

IF OBJECT_ID(N'dbo.bh_thu', N'U') IS NULL
CREATE TABLE dbo.bh_thu (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phieuId UNIQUEIDENTIFIER NULL,
  so_ct NVARCHAR(30) NOT NULL,
  ngay_ct DATE NOT NULL DEFAULT GETDATE(),
  so_tien DECIMAL(18,2) NOT NULL DEFAULT 0,
  hinh_thuc NVARCHAR(30) NULL,
  dien_giai NVARCHAR(300) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID(N'dbo.bh_hoadon', N'U') IS NULL
CREATE TABLE dbo.bh_hoadon (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phieuId UNIQUEIDENTIFIER NULL,
  so_ct NVARCHAR(30) NOT NULL,
  ngay_ct DATE NOT NULL DEFAULT GETDATE(),
  ma_kh NVARCHAR(50) NULL,
  ten_kh NVARCHAR(200) NULL,
  t_tien DECIMAL(18,2) NOT NULL DEFAULT 0,
  dien_giai NVARCHAR(300) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_bh_phieu_so_ct' AND object_id = OBJECT_ID(N'dbo.bh_phieu'))
  CREATE UNIQUE INDEX UX_bh_phieu_so_ct ON dbo.bh_phieu(so_ct);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_bh_phieu_serial' AND object_id = OBJECT_ID(N'dbo.bh_phieu'))
  CREATE INDEX IX_bh_phieu_serial ON dbo.bh_phieu(so_serial);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_bh_baogia_so_ct' AND object_id = OBJECT_ID(N'dbo.bh_baogia'))
  CREATE UNIQUE INDEX UX_bh_baogia_so_ct ON dbo.bh_baogia(so_ct);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_bh_kho_so_ct' AND object_id = OBJECT_ID(N'dbo.bh_kho'))
  CREATE UNIQUE INDEX UX_bh_kho_so_ct ON dbo.bh_kho(so_ct);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_bh_thu_so_ct' AND object_id = OBJECT_ID(N'dbo.bh_thu'))
  CREATE UNIQUE INDEX UX_bh_thu_so_ct ON dbo.bh_thu(so_ct);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_bh_hoadon_so_ct' AND object_id = OBJECT_ID(N'dbo.bh_hoadon'))
  CREATE UNIQUE INDEX UX_bh_hoadon_so_ct ON dbo.bh_hoadon(so_ct);
