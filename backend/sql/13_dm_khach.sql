IF OBJECT_ID('dbo.customers', 'U') IS NULL
CREATE TABLE dbo.customers (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  code NVARCHAR(50) NOT NULL UNIQUE,
  name NVARCHAR(200) NOT NULL,
  address NVARCHAR(300) NULL,
  phone NVARCHAR(50) NULL,
  email NVARCHAR(100) NULL,
  taxCode NVARCHAR(30) NULL,
  idCard NVARCHAR(20) NULL,
  customerGroup NVARCHAR(20) NOT NULL DEFAULT N'dealer',
  note NVARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE(),
  updatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
GO
INSERT INTO dbo.customers (code, name, address, phone, email, customerGroup)
SELECT
  s.ma_kh,
  ISNULL(NULLIF(MAX(s.ten_kh), N''), s.ma_kh),
  NULLIF(MAX(s.dia_chi), N''),
  NULLIF(MAX(s.dien_thoai), N''),
  NULLIF(MAX(s.email), N''),
  ISNULL(NULLIF(MAX(s.nhom), N''), N'dealer')
FROM (
  SELECT customerCode AS ma_kh, customerName AS ten_kh, customerAddress AS dia_chi, customerPhone AS dien_thoai, customerEmail AS email, customerGroup AS nhom
  FROM dbo.stock_outs
  WHERE customerCode IS NOT NULL AND LTRIM(RTRIM(customerCode)) <> ''
  UNION ALL
  SELECT ma_kh, ten_kh, CAST(NULL AS NVARCHAR(300)), CAST(NULL AS NVARCHAR(50)), CAST(NULL AS NVARCHAR(100)), CAST(NULL AS NVARCHAR(20))
  FROM dbo.dm_serial
  WHERE ma_kh IS NOT NULL AND LTRIM(RTRIM(ma_kh)) <> ''
) s
WHERE NOT EXISTS (SELECT 1 FROM dbo.customers c WHERE c.code = s.ma_kh)
GROUP BY s.ma_kh;
