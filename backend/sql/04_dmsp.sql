-- dmsp: danh muc san pham (cau truc loc theo dmvt doi chieu, KHONG tao bang dmvt)
IF OBJECT_ID('dbo.dmsp', 'U') IS NULL AND OBJECT_ID('dbo.products', 'U') IS NOT NULL
  EXEC sp_rename 'dbo.products', 'dmsp';
GO
IF OBJECT_ID('dbo.dmsp', 'U') IS NULL
CREATE TABLE dbo.dmsp (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  ma_sp NVARCHAR(20) NOT NULL UNIQUE,
  part_no NVARCHAR(20) NULL,
  ten_sp NVARCHAR(255) NOT NULL,
  dvt NVARCHAR(32) NOT NULL DEFAULT N'Cái',
  nh_vt1 NVARCHAR(20) NULL,
  loai_vt NVARCHAR(2) NULL,
  sl_min DECIMAL(15,4) NOT NULL DEFAULT 0,
  sl_max DECIMAL(15,4) NOT NULL DEFAULT 0,
  vt_ton_kho BIT NOT NULL DEFAULT 1,
  thue_gtgt DECIMAL(10,2) NOT NULL DEFAULT 0,
  hang_sx NVARCHAR(255) NULL,
  thuong_hieu NVARCHAR(200) NULL,
  quy_cach_ten NVARCHAR(500) NULL,
  ghi_chu NVARCHAR(1000) NULL,
  status NVARCHAR(1) NOT NULL DEFAULT '1',
  createdAt DATETIME NOT NULL DEFAULT GETDATE(),
  updatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
GO

IF COL_LENGTH('dbo.dmsp', 'ma_sp') IS NULL AND COL_LENGTH('dbo.dmsp', 'code') IS NOT NULL
  EXEC sp_rename 'dbo.dmsp.code', 'ma_sp', 'COLUMN';
GO
IF COL_LENGTH('dbo.dmsp', 'ten_sp') IS NULL AND COL_LENGTH('dbo.dmsp', 'name') IS NOT NULL
  EXEC sp_rename 'dbo.dmsp.name', 'ten_sp', 'COLUMN';
GO
IF COL_LENGTH('dbo.dmsp', 'dvt') IS NULL AND COL_LENGTH('dbo.dmsp', 'unit') IS NOT NULL
  EXEC sp_rename 'dbo.dmsp.unit', 'dvt', 'COLUMN';
GO
IF COL_LENGTH('dbo.dmsp', 'ghi_chu') IS NULL AND COL_LENGTH('dbo.dmsp', 'note') IS NOT NULL
  EXEC sp_rename 'dbo.dmsp.note', 'ghi_chu', 'COLUMN';
GO

IF COL_LENGTH('dbo.dmsp', 'part_no') IS NULL ALTER TABLE dbo.dmsp ADD part_no NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'nh_vt1') IS NULL ALTER TABLE dbo.dmsp ADD nh_vt1 NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'loai_vt') IS NULL ALTER TABLE dbo.dmsp ADD loai_vt NVARCHAR(2) NULL;
IF COL_LENGTH('dbo.dmsp', 'sl_min') IS NULL ALTER TABLE dbo.dmsp ADD sl_min DECIMAL(15,4) NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'sl_max') IS NULL ALTER TABLE dbo.dmsp ADD sl_max DECIMAL(15,4) NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'vt_ton_kho') IS NULL ALTER TABLE dbo.dmsp ADD vt_ton_kho BIT NOT NULL DEFAULT 1;
IF COL_LENGTH('dbo.dmsp', 'thue_gtgt') IS NULL ALTER TABLE dbo.dmsp ADD thue_gtgt DECIMAL(10,2) NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'hang_sx') IS NULL ALTER TABLE dbo.dmsp ADD hang_sx NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.dmsp', 'thuong_hieu') IS NULL ALTER TABLE dbo.dmsp ADD thuong_hieu NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.dmsp', 'quy_cach_ten') IS NULL ALTER TABLE dbo.dmsp ADD quy_cach_ten NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.dmsp', 'ghi_chu') IS NULL ALTER TABLE dbo.dmsp ADD ghi_chu NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.dmsp', 'status') IS NULL ALTER TABLE dbo.dmsp ADD status NVARCHAR(1) NOT NULL DEFAULT '1';
IF COL_LENGTH('dbo.dmsp', 'ma_tra_cuu') IS NULL ALTER TABLE dbo.dmsp ADD ma_tra_cuu NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.dmsp', 'ten_sp2') IS NULL ALTER TABLE dbo.dmsp ADD ten_sp2 NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.dmsp', 'nhieu_dvt') IS NULL ALTER TABLE dbo.dmsp ADD nhieu_dvt BIT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'vt_ke') IS NULL ALTER TABLE dbo.dmsp ADD vt_ke BIT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'lot_yn') IS NULL ALTER TABLE dbo.dmsp ADD lot_yn BIT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'gia_ton') IS NULL ALTER TABLE dbo.dmsp ADD gia_ton INT NOT NULL DEFAULT 1;
IF COL_LENGTH('dbo.dmsp', 'sua_tk_vt') IS NULL ALTER TABLE dbo.dmsp ADD sua_tk_vt INT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'tk_vt') IS NULL ALTER TABLE dbo.dmsp ADD tk_vt NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'thue_suat') IS NULL ALTER TABLE dbo.dmsp ADD thue_suat DECIMAL(10,2) NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'tk_dt') IS NULL ALTER TABLE dbo.dmsp ADD tk_dt NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'tk_tl') IS NULL ALTER TABLE dbo.dmsp ADD tk_tl NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'tk_dtnb') IS NULL ALTER TABLE dbo.dmsp ADD tk_dtnb NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'tk_cl_vt') IS NULL ALTER TABLE dbo.dmsp ADD tk_cl_vt NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'tk_gv') IS NULL ALTER TABLE dbo.dmsp ADD tk_gv NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'tk_spdd') IS NULL ALTER TABLE dbo.dmsp ADD tk_spdd NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'nh_vt2') IS NULL ALTER TABLE dbo.dmsp ADD nh_vt2 NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'nh_vt3') IS NULL ALTER TABLE dbo.dmsp ADD nh_vt3 NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'ma_nganh') IS NULL ALTER TABLE dbo.dmsp ADD ma_nganh NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'thue_bvmt') IS NULL ALTER TABLE dbo.dmsp ADD thue_bvmt DECIMAL(10,2) NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.dmsp', 'ma_ck') IS NULL ALTER TABLE dbo.dmsp ADD ma_ck NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'loai_ma') IS NULL ALTER TABLE dbo.dmsp ADD loai_ma NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'ma_hs') IS NULL ALTER TABLE dbo.dmsp ADD ma_hs NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'gia_dinh_sp') IS NULL ALTER TABLE dbo.dmsp ADD gia_dinh_sp NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.dmsp', 'mau_sac') IS NULL ALTER TABLE dbo.dmsp ADD mau_sac NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.dmsp', 'mau_xe') IS NULL ALTER TABLE dbo.dmsp ADD mau_xe NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.dmsp', 'nam_sx') IS NULL ALTER TABLE dbo.dmsp ADD nam_sx NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.dmsp', 'nuoc_xx') IS NULL ALTER TABLE dbo.dmsp ADD nuoc_xx NVARCHAR(20) NULL;
GO
IF COL_LENGTH('dbo.dmsp', 'createdAt') IS NULL ALTER TABLE dbo.dmsp ADD createdAt DATETIME NOT NULL DEFAULT GETDATE();
GO
IF COL_LENGTH('dbo.dmsp', 'updatedAt') IS NULL ALTER TABLE dbo.dmsp ADD updatedAt DATETIME NOT NULL DEFAULT GETDATE();
