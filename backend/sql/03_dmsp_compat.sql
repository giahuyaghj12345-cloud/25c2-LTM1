-- Bang dmsp khong dung schema do an: xoa roi de 04_dmsp.sql tao lai.
IF OBJECT_ID('dbo.dmsp_gia', 'U') IS NOT NULL
AND (
  OBJECT_ID('dbo.dmsp', 'U') IS NULL
  OR (
    COL_LENGTH('dbo.dmsp', 'ma_sp') IS NULL
    AND COL_LENGTH('dbo.dmsp', 'code') IS NULL
  )
  OR EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.dmsp')
      AND c.name = 'id'
      AND t.name IN ('int', 'bigint', 'smallint', 'tinyint')
  )
)
  DROP TABLE dbo.dmsp_gia;
GO
IF OBJECT_ID('dbo.dmsp', 'U') IS NOT NULL
AND COL_LENGTH('dbo.dmsp', 'ma_sp') IS NULL
AND COL_LENGTH('dbo.dmsp', 'code') IS NULL
  DROP TABLE dbo.dmsp;
GO
IF OBJECT_ID('dbo.dmsp', 'U') IS NOT NULL
AND EXISTS (
  SELECT 1
  FROM sys.columns c
  JOIN sys.types t ON c.user_type_id = t.user_type_id
  WHERE c.object_id = OBJECT_ID('dbo.dmsp')
    AND c.name = 'id'
    AND t.name IN ('int', 'bigint', 'smallint', 'tinyint')
)
  DROP TABLE dbo.dmsp;
GO
IF OBJECT_ID('dbo.dmsp_legacy', 'U') IS NOT NULL DROP TABLE dbo.dmsp_legacy;
GO
