USE [Quanlysanpham];
GO
-- Tồn đầu kỳ + phiếu xuất kho mở (draft) để demo kiểu GGV

IF COL_LENGTH(N'dbo.dmsp', N'sl_ton') IS NULL
  ALTER TABLE dbo.dmsp ADD sl_ton DECIMAL(18,4) NOT NULL CONSTRAINT DF_dmsp_sl_ton DEFAULT(0);
IF COL_LENGTH(N'dbo.dmsp', N'vt_ton_kho') IS NULL
  ALTER TABLE dbo.dmsp ADD vt_ton_kho BIT NULL;
GO

UPDATE dbo.dmsp SET vt_ton_kho = 1 WHERE vt_ton_kho IS NULL;
UPDATE dbo.dmsp SET sl_ton = 50 WHERE ma_sp = N'SP000002' AND ISNULL(sl_ton,0) < 10;
UPDATE dbo.dmsp SET sl_ton = 30 WHERE ma_sp IN (N'SP000001', N'SP000003') AND ISNULL(sl_ton,0) = 0;
UPDATE TOP (20) dbo.dmsp
SET sl_ton = 5
WHERE ISNULL(CONVERT(int, vt_ton_kho), 1) = 1
  AND ISNULL(sl_ton, 0) = 0
  AND ma_sp NOT IN (N'SP000001', N'SP000002', N'SP000003');
GO

DECLARE @pxkId UNIQUEIDENTIFIER = 'A1B2C3D4-E5F6-4789-ABCD-000000000001';
DECLARE @uid UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.users ORDER BY createdAt);

IF @uid IS NULL
BEGIN
  RAISERROR(N'Không có user — bỏ qua seed PXK', 10, 1);
END
ELSE IF OBJECT_ID(N'dbo.stock_outs', N'U') IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.stock_outs WHERE id = @pxkId)
  BEGIN
    INSERT INTO dbo.stock_outs (
      id, number, date, postingDate, bookNumber, receiver, reason, kind,
      customerCode, customerName, customerAddress, customerPhone, customerGroup,
      orderNumber, orderDate, status, createdBy, createdAt, updatedAt,
      serialCreated, serialLocked, currency, exchangeRate,
      salesStaff, deliveryStaff, deliveryAddress, remark
    )
    VALUES (
      @pxkId, N'PXK-DEMO-01', CAST(GETDATE() AS date), CAST(GETDATE() AS date), N'01',
      N'Khách demo', N'Xuất bán demo đồ án', N'xuat_ban',
      N'KIDLOFIFAI', N'Luu Phu Nguyen', N'', N'0900000001', N'',
      N'', NULL, N'draft', @uid, GETDATE(), GETDATE(),
      0, 0, N'VND', 1,
      N'NVBH', N'NVGH', N'', N'PXK mở — chưa ghi sổ'
    );
  END
  ELSE
  BEGIN
    UPDATE dbo.stock_outs
    SET status = N'draft', serialCreated = 0, serialLocked = 0, updatedAt = GETDATE()
    WHERE id = @pxkId;
  END

  IF OBJECT_ID(N'dbo.stock_out_lines', N'U') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM dbo.stock_out_lines WHERE stockOutId = @pxkId)
  BEGIN
    DECLARE @mid UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.dmsp WHERE ma_sp = N'SP000002');
    DECLARE @ten NVARCHAR(255) = (SELECT TOP 1 ten_sp FROM dbo.dmsp WHERE ma_sp = N'SP000002');
    DECLARE @dvt NVARCHAR(50) = (SELECT TOP 1 ISNULL(dvt, N'Cái') FROM dbo.dmsp WHERE ma_sp = N'SP000002');
    IF @mid IS NULL
    BEGIN
      SET @mid = (SELECT TOP 1 id FROM dbo.dmsp ORDER BY ma_sp);
      SET @ten = (SELECT TOP 1 ten_sp FROM dbo.dmsp WHERE id = @mid);
      SET @dvt = (SELECT TOP 1 ISNULL(dvt, N'Cái') FROM dbo.dmsp WHERE id = @mid);
    END
    IF @mid IS NOT NULL
      INSERT INTO dbo.stock_out_lines (id, stockOutId, materialId, materialName, quantity, unit, warehouseCode, lotCode, batchNo, shelfCode, hsCode)
      VALUES (NEWID(), @pxkId, @mid, ISNULL(@ten, N'Demo'), 1, ISNULL(@dvt, N'Cái'), N'KHO1', N'', N'', N'', N'');
  END
END
GO

SELECT ma_sp, ten_sp, sl_ton, vt_ton_kho FROM dbo.dmsp WHERE ma_sp IN (N'SP000001', N'SP000002', N'SP000003');
SELECT id, number, status, serialCreated, serialLocked FROM dbo.stock_outs WHERE id = 'A1B2C3D4-E5F6-4789-ABCD-000000000001';
GO
