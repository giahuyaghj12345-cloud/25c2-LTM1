USE [Quanlysanpham];
GO
IF COL_LENGTH('dbo.bh_baogia', 'nam_sx') IS NULL ALTER TABLE dbo.bh_baogia ADD nam_sx NVARCHAR(10) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'odo') IS NULL ALTER TABLE dbo.bh_baogia ADD odo NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'loai_sp') IS NULL ALTER TABLE dbo.bh_baogia ADD loai_sp NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'lo_sx') IS NULL ALTER TABLE dbo.bh_baogia ADD lo_sx NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'tg_sd') IS NULL ALTER TABLE dbo.bh_baogia ADD tg_sd NVARCHAR(64) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'nguon_goc') IS NULL ALTER TABLE dbo.bh_baogia ADD nguon_goc NVARCHAR(64) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'lay_pt_cu') IS NULL ALTER TABLE dbo.bh_baogia ADD lay_pt_cu INT NOT NULL CONSTRAINT DF_bg_lpt DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia', 'tg_tiep_nhan') IS NULL ALTER TABLE dbo.bh_baogia ADD tg_tiep_nhan DATETIME NULL;
IF COL_LENGTH('dbo.bh_baogia', 'tg_hoan_tra_dk') IS NULL ALTER TABLE dbo.bh_baogia ADD tg_hoan_tra_dk DATETIME NULL;
IF COL_LENGTH('dbo.bh_baogia', 'xuat_hd') IS NULL ALTER TABLE dbo.bh_baogia ADD xuat_hd INT NOT NULL CONSTRAINT DF_bg_xhd DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia', 'tu_van') IS NULL ALTER TABLE dbo.bh_baogia ADD tu_van NVARCHAR(500) NULL;
GO