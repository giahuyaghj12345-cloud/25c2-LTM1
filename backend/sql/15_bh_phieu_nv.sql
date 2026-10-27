-- Nhân sự trên phiếu BH DV (GGV: NV tiếp nhận / KTV / kế toán)
IF COL_LENGTH('dbo.bh_phieu', 'nv_tiep_nhan') IS NULL
  ALTER TABLE dbo.bh_phieu ADD nv_tiep_nhan NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'nv_ktv') IS NULL
  ALTER TABLE dbo.bh_phieu ADD nv_ktv NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'nv_ketoan') IS NULL
  ALTER TABLE dbo.bh_phieu ADD nv_ketoan NVARCHAR(80) NULL;
GO
