USE [Quanlysanpham];
GO
-- Xu ly SP bao hanh — chay SAU 09_bao_hanh.sql tren DB Quanlysanpham
-- App WinForms goi CommandType.StoredProcedure (khong INSERT truc tiep)
--
-- usp_BhSoCt      : sinh so chung tu BH/BG/KB/TH/HD
-- usp_BhPhieu     : 1 list, 2 get, 3 ct, 10 save, 11 xoa, 20 status, 21 lookup
-- usp_BhBaoGia    : 1 list, 10 lap tu phieu, 20 duyet
-- usp_BhKho       : 1 list, 10 ghi (MGD 7/8/10/11)
-- usp_BhThu       : 1 list, 10 thu PT
-- usp_BhHoaDon    : 1 list, 10 lap HD
-- usp_BhTraCuu    : 1 lich su serial, 2 tim serial, 3 tim SP, 4 tim tien cong
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhSoCt
    @prefix NVARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ym NVARCHAR(4) = FORMAT(GETDATE(), 'yyMM');
    DECLARE @like NVARCHAR(20) = @prefix + @ym + N'%';
    DECLARE @n INT = 1;

    IF @prefix = N'BG'
        SELECT @n = ISNULL(MAX(TRY_CONVERT(int, RIGHT(so_ct, 4))), 0) + 1 FROM dbo.bh_baogia WHERE so_ct LIKE @like;
    ELSE IF @prefix = N'KB'
        SELECT @n = ISNULL(MAX(TRY_CONVERT(int, RIGHT(so_ct, 4))), 0) + 1 FROM dbo.bh_kho WHERE so_ct LIKE @like;
    ELSE IF @prefix = N'TH'
        SELECT @n = ISNULL(MAX(TRY_CONVERT(int, RIGHT(so_ct, 4))), 0) + 1 FROM dbo.bh_thu WHERE so_ct LIKE @like;
    ELSE IF @prefix = N'HD'
        SELECT @n = ISNULL(MAX(TRY_CONVERT(int, RIGHT(so_ct, 4))), 0) + 1 FROM dbo.bh_hoadon WHERE so_ct LIKE @like;
    ELSE
        SELECT @n = ISNULL(MAX(TRY_CONVERT(int, RIGHT(so_ct, 4))), 0) + 1 FROM dbo.bh_phieu WHERE so_ct LIKE @like;

    SELECT @prefix + @ym + RIGHT(N'0000' + CAST(@n AS NVARCHAR(4)), 4) AS so_ct;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhPhieu
    @action     INT,
    @id         UNIQUEIDENTIFIER = NULL,
    @so_ct      NVARCHAR(30) = NULL,
    @ngay_ct    DATE = NULL,
    @status     NVARCHAR(20) = NULL,
    @ma_kh      NVARCHAR(50) = NULL,
    @ten_kh     NVARCHAR(200) = NULL,
    @dien_thoai NVARCHAR(30) = NULL,
    @dia_chi    NVARCHAR(300) = NULL,
    @email      NVARCHAR(100) = NULL,
    @so_serial  NVARCHAR(50) = NULL,
    @ma_sp      NVARCHAR(50) = NULL,
    @ten_sp     NVARCHAR(200) = NULL,
    @hang_xe    NVARCHAR(80) = NULL,
    @ten_xe     NVARCHAR(80) = NULL,
    @nam_sx     NVARCHAR(10) = NULL,
    @odo        NVARCHAR(20) = NULL,
    @bien_so    NVARCHAR(30) = NULL,
    @yeu_cau    NVARCHAR(500) = NULL,
    @tu_van     NVARCHAR(500) = NULL,
    @tt_sp      NVARCHAR(200) = NULL,
    @ngay_hen   DATE = NULL,
    @ghi_chu    NVARCHAR(300) = NULL,
    @xml_ct     NVARCHAR(MAX) = NULL,
    @user       NVARCHAR(80) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @action = 1
    BEGIN
        SELECT id, so_ct AS [Số phiếu], ngay_ct AS [Ngày],
            ISNULL(ma_kh, N'') AS [Mã KH], ISNULL(ten_kh, N'') AS [Khách hàng],
            ISNULL(so_serial, N'') AS [Serial], ISNULL(ten_sp, N'') AS [Sản phẩm],
            CASE status
                WHEN N'nhap' THEN N'Nháp' WHEN N'xac_nhan' THEN N'Đã xác nhận'
                WHEN N'dang_sua' THEN N'Đang sửa' WHEN N'cho_pt' THEN N'Chờ phụ tùng'
                WHEN N'hoan_tat' THEN N'Hoàn tất sửa' WHEN N'da_giao' THEN N'Đã giao'
                WHEN N'huy' THEN N'Hủy' ELSE status END AS [Trạng thái]
        FROM dbo.bh_phieu
        ORDER BY ngay_ct DESC, so_ct DESC;
        RETURN;
    END

    IF @action = 2
    BEGIN
        SELECT * FROM dbo.bh_phieu WHERE id = @id;
        RETURN;
    END

    IF @action = 3
    BEGIN
        SELECT * FROM dbo.bh_phieu_ct WHERE phieuId = @id ORDER BY stt;
        RETURN;
    END

    IF @action = 10
    BEGIN
        IF @id IS NULL SET @id = NEWID();
        IF NULLIF(LTRIM(@so_ct), N'') IS NULL
        BEGIN
            DECLARE @so TABLE (so_ct NVARCHAR(30));
            INSERT INTO @so EXEC dbo.usp_BhSoCt N'BH';
            SELECT @so_ct = so_ct FROM @so;
        END
        IF @ngay_ct IS NULL SET @ngay_ct = CONVERT(date, GETDATE());
        IF NULLIF(LTRIM(@status), N'') IS NULL SET @status = N'nhap';

        IF EXISTS (SELECT 1 FROM dbo.bh_phieu WHERE id = @id)
        BEGIN
            UPDATE dbo.bh_phieu SET
                ngay_ct = @ngay_ct, status = @status, ma_kh = @ma_kh, ten_kh = @ten_kh,
                dien_thoai = @dien_thoai, dia_chi = @dia_chi, email = @email,
                so_serial = @so_serial, ma_sp = @ma_sp, ten_sp = @ten_sp,
                hang_xe = @hang_xe, ten_xe = @ten_xe, nam_sx = @nam_sx, odo = @odo, bien_so = @bien_so,
                yeu_cau = @yeu_cau, tu_van = @tu_van, tt_sp = @tt_sp, ngay_hen = @ngay_hen,
                ghi_chu = @ghi_chu, updatedAt = GETDATE()
            WHERE id = @id;
            DELETE FROM dbo.bh_phieu_ct WHERE phieuId = @id;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.bh_phieu (id, so_ct, ngay_ct, status, ma_kh, ten_kh, dien_thoai, dia_chi, email,
                so_serial, ma_sp, ten_sp, hang_xe, ten_xe, nam_sx, odo, bien_so, yeu_cau, tu_van, tt_sp, ngay_hen, ghi_chu, createdBy)
            VALUES (@id, @so_ct, @ngay_ct, @status, @ma_kh, @ten_kh, @dien_thoai, @dia_chi, @email,
                @so_serial, @ma_sp, @ten_sp, @hang_xe, @ten_xe, @nam_sx, @odo, @bien_so, @yeu_cau, @tu_van, @tt_sp, @ngay_hen, @ghi_chu, @user);
        END

        IF NULLIF(LTRIM(@xml_ct), N'') IS NOT NULL
        BEGIN
            DECLARE @x XML = CONVERT(XML, @xml_ct);
            INSERT INTO dbo.bh_phieu_ct (id, phieuId, stt, loai, ma, ten, dvt, so_luong, gia, tien)
            SELECT NEWID(), @id, ROW_NUMBER() OVER (ORDER BY T.N.value('@stt', 'int')),
                ISNULL(NULLIF(T.N.value('@loai', 'nvarchar(10)'), N''), N'pt'),
                T.N.value('@ma', 'nvarchar(50)'),
                T.N.value('@ten', 'nvarchar(200)'),
                T.N.value('@dvt', 'nvarchar(20)'),
                ISNULL(T.N.value('@so_luong', 'decimal(18,4)'), 1),
                ISNULL(T.N.value('@gia', 'decimal(18,2)'), 0),
                ISNULL(T.N.value('@so_luong', 'decimal(18,4)'), 1) * ISNULL(T.N.value('@gia', 'decimal(18,2)'), 0)
            FROM @x.nodes('/root/r') T(N)
            WHERE NULLIF(T.N.value('@ma', 'nvarchar(50)'), N'') IS NOT NULL;
        END

        SELECT @id AS id, @so_ct AS so_ct;
        RETURN;
    END

    IF @action = 11
    BEGIN
        DELETE FROM dbo.bh_phieu_ct WHERE phieuId = @id;
        DELETE FROM dbo.bh_phieu WHERE id = @id;
        RETURN;
    END

    IF @action = 20
    BEGIN
        UPDATE dbo.bh_phieu SET status = ISNULL(@status, status), updatedAt = GETDATE() WHERE id = @id;
        RETURN;
    END

    IF @action = 21
    BEGIN
        SELECT id, so_ct + N' — ' + ISNULL(ten_kh, N'') + N' / ' + ISNULL(so_serial, N'') AS ten
        FROM dbo.bh_phieu
        WHERE status <> N'huy'
        ORDER BY ngay_ct DESC;
        RETURN;
    END

    RAISERROR(N'usp_BhPhieu: @action không hợp lệ.', 16, 1);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhBaoGia
    @action    INT,
    @id        UNIQUEIDENTIFIER = NULL,
    @phieuId   UNIQUEIDENTIFIER = NULL,
    @dien_giai NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @action = 1
    BEGIN
        SELECT b.id, b.so_ct AS [Số BG], b.ngay_ct AS [Ngày], ISNULL(p.so_ct, N'') AS [Phiếu BH],
            ISNULL(b.ten_kh, N'') AS [Khách], ISNULL(b.so_serial, N'') AS [Serial], b.t_tien AS [Tổng tiền],
            CASE b.status WHEN N'nhap' THEN N'Nháp' WHEN N'da_duyet' THEN N'Đã duyệt' ELSE b.status END AS [Trạng thái]
        FROM dbo.bh_baogia b
        LEFT JOIN dbo.bh_phieu p ON p.id = b.phieuId
        ORDER BY b.ngay_ct DESC;
        RETURN;
    END

    IF @action = 10
    BEGIN
        IF @phieuId IS NULL
        BEGIN
            RAISERROR(N'Chọn phiếu bảo hành trước.', 16, 1);
            RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM dbo.bh_phieu WHERE id = @phieuId)
        BEGIN
            RAISERROR(N'Không tìm thấy phiếu BH.', 16, 1);
            RETURN;
        END

        DECLARE @so TABLE (so_ct NVARCHAR(30));
        INSERT INTO @so EXEC dbo.usp_BhSoCt N'BG';
        DECLARE @so_ct NVARCHAR(30);
        SELECT @so_ct = so_ct FROM @so;

        SET @id = NEWID();
        INSERT INTO dbo.bh_baogia (id, phieuId, so_ct, ngay_ct, status, ma_kh, ten_kh, so_serial, dien_giai, t_tien)
        SELECT @id, @phieuId, @so_ct, CONVERT(date, GETDATE()), N'nhap',
            p.ma_kh, p.ten_kh, p.so_serial, ISNULL(@dien_giai, N'Báo giá từ phiếu bảo hành'),
            ISNULL((SELECT SUM(tien) FROM dbo.bh_phieu_ct WHERE phieuId = @phieuId), 0)
        FROM dbo.bh_phieu p
        WHERE p.id = @phieuId;

        INSERT INTO dbo.bh_baogia_ct (id, bgId, stt, loai, ma, ten, so_luong, gia, tien)
        SELECT NEWID(), @id, stt, loai, ma, ten, so_luong, gia, tien
        FROM dbo.bh_phieu_ct
        WHERE phieuId = @phieuId;

        UPDATE dbo.bh_phieu SET so_bg = @so_ct WHERE id = @phieuId;
        SELECT @id AS id, @so_ct AS so_ct;
        RETURN;
    END

    IF @action = 20
    BEGIN
        UPDATE dbo.bh_baogia SET status = N'da_duyet' WHERE id = @id;
        RETURN;
    END

    RAISERROR(N'usp_BhBaoGia: @action không hợp lệ.', 16, 1);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhKho
    @action     INT,
    @id         UNIQUEIDENTIFIER = NULL,
    @phieuId    UNIQUEIDENTIFIER = NULL,
    @ma_gd      INT = NULL,
    @loai_nx    NVARCHAR(10) = NULL,
    @serial_moi NVARCHAR(50) = NULL,
    @xml_ct     NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @action = 1
    BEGIN
        SELECT k.id, k.so_ct AS [Số phiếu], k.ngay_ct AS [Ngày],
            CASE k.ma_gd WHEN 7 THEN N'Xuất PT BH' WHEN 8 THEN N'1 đổi 1'
                WHEN 10 THEN N'Nhập/xuất sau BH' WHEN 11 THEN N'Nhập serial cũ' ELSE N'' END AS [Loại GD],
            ISNULL(p.so_ct, N'') AS [Phiếu BH], ISNULL(k.so_serial, N'') AS [Serial],
            CASE k.status WHEN N'nhap' THEN N'Nháp' WHEN N'xac_nhan' THEN N'Đã xuất/nhập' ELSE k.status END AS [Trạng thái]
        FROM dbo.bh_kho k
        LEFT JOIN dbo.bh_phieu p ON p.id = k.phieuId
        ORDER BY k.ngay_ct DESC;
        RETURN;
    END

    IF @action = 10
    BEGIN
        DECLARE @so TABLE (so_ct NVARCHAR(30));
        INSERT INTO @so EXEC dbo.usp_BhSoCt N'KB';
        DECLARE @so_ct NVARCHAR(30);
        SELECT @so_ct = so_ct FROM @so;

        DECLARE @ser NVARCHAR(50), @dg NVARCHAR(300);
        SELECT @ser = so_serial FROM dbo.bh_phieu WHERE id = @phieuId;
        SET @dg = CASE @ma_gd
            WHEN 7 THEN N'Xuất kho phụ tùng BH'
            WHEN 8 THEN N'Xuất SP 1 đổi 1'
            WHEN 10 THEN N'Nhập/xuất kho sau BH'
            WHEN 11 THEN N'Nhập SP serial cũ'
            ELSE N'Kho BH' END;

        SET @id = NEWID();
        INSERT INTO dbo.bh_kho (id, phieuId, so_ct, ngay_ct, ma_gd, loai_nx, status, so_serial, serial_moi, dien_giai)
        VALUES (@id, @phieuId, @so_ct, CONVERT(date, GETDATE()), @ma_gd, @loai_nx, N'xac_nhan', @ser, @serial_moi, @dg);

        IF NULLIF(LTRIM(@xml_ct), N'') IS NOT NULL
        BEGIN
            DECLARE @x XML = CONVERT(XML, @xml_ct);
            INSERT INTO dbo.bh_kho_ct (id, khoId, stt, ma_sp, ten_sp, so_luong, so_serial)
            SELECT NEWID(), @id, ROW_NUMBER() OVER (ORDER BY (SELECT 1)),
                T.N.value('@ma_sp', 'nvarchar(50)'),
                T.N.value('@ten_sp', 'nvarchar(200)'),
                ISNULL(T.N.value('@so_luong', 'decimal(18,4)'), 1),
                T.N.value('@so_serial', 'nvarchar(50)')
            FROM @x.nodes('/root/r') T(N)
            WHERE NULLIF(T.N.value('@ma_sp', 'nvarchar(50)'), N'') IS NOT NULL;
        END

        IF @phieuId IS NOT NULL
        BEGIN
            IF @ma_gd IN (7, 8)
                UPDATE dbo.bh_phieu SET status = N'dang_sua', updatedAt = GETDATE() WHERE id = @phieuId;
            IF @ma_gd = 10 AND @loai_nx = N'xuat'
                UPDATE dbo.bh_phieu SET status = N'da_giao', updatedAt = GETDATE() WHERE id = @phieuId;
            IF @ma_gd = 10 AND @loai_nx = N'nhap'
                UPDATE dbo.bh_phieu SET status = N'hoan_tat', updatedAt = GETDATE() WHERE id = @phieuId;
            IF @ma_gd = 8 AND NULLIF(LTRIM(@serial_moi), N'') IS NOT NULL
                UPDATE dbo.bh_phieu SET so_serial = @serial_moi, updatedAt = GETDATE() WHERE id = @phieuId;
        END

        SELECT @id AS id, @so_ct AS so_ct;
        RETURN;
    END

    RAISERROR(N'usp_BhKho: @action không hợp lệ.', 16, 1);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhThu
    @action    INT,
    @id        UNIQUEIDENTIFIER = NULL,
    @phieuId   UNIQUEIDENTIFIER = NULL,
    @so_tien   DECIMAL(18, 2) = NULL,
    @hinh_thuc NVARCHAR(30) = NULL,
    @dien_giai NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @action = 1
    BEGIN
        SELECT t.id, t.so_ct AS [Số phiếu], t.ngay_ct AS [Ngày], ISNULL(p.so_ct, N'') AS [Phiếu BH],
            t.so_tien AS [Số tiền], ISNULL(t.hinh_thuc, N'') AS [Hình thức], ISNULL(t.dien_giai, N'') AS [Diễn giải]
        FROM dbo.bh_thu t
        LEFT JOIN dbo.bh_phieu p ON p.id = t.phieuId
        ORDER BY t.ngay_ct DESC;
        RETURN;
    END

    IF @action = 10
    BEGIN
        DECLARE @so TABLE (so_ct NVARCHAR(30));
        INSERT INTO @so EXEC dbo.usp_BhSoCt N'TH';
        DECLARE @so_ct NVARCHAR(30);
        SELECT @so_ct = so_ct FROM @so;
        SET @id = NEWID();
        INSERT INTO dbo.bh_thu (id, phieuId, so_ct, ngay_ct, so_tien, hinh_thuc, dien_giai)
        VALUES (@id, @phieuId, @so_ct, CONVERT(date, GETDATE()), ISNULL(@so_tien, 0), @hinh_thuc, @dien_giai);
        SELECT @id AS id, @so_ct AS so_ct;
        RETURN;
    END

    RAISERROR(N'usp_BhThu: @action không hợp lệ.', 16, 1);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhHoaDon
    @action    INT,
    @id        UNIQUEIDENTIFIER = NULL,
    @phieuId   UNIQUEIDENTIFIER = NULL,
    @dien_giai NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @action = 1
    BEGIN
        SELECT h.id, h.so_ct AS [Số HĐ], h.ngay_ct AS [Ngày], ISNULL(p.so_ct, N'') AS [Phiếu BH],
            ISNULL(h.ten_kh, N'') AS [Khách], h.t_tien AS [Tổng tiền], ISNULL(h.dien_giai, N'') AS [Diễn giải]
        FROM dbo.bh_hoadon h
        LEFT JOIN dbo.bh_phieu p ON p.id = h.phieuId
        ORDER BY h.ngay_ct DESC;
        RETURN;
    END

    IF @action = 10
    BEGIN
        IF @phieuId IS NULL
        BEGIN
            RAISERROR(N'Chọn phiếu bảo hành.', 16, 1);
            RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM dbo.bh_phieu WHERE id = @phieuId)
        BEGIN
            RAISERROR(N'Không tìm thấy phiếu.', 16, 1);
            RETURN;
        END

        DECLARE @so TABLE (so_ct NVARCHAR(30));
        INSERT INTO @so EXEC dbo.usp_BhSoCt N'HD';
        DECLARE @so_ct NVARCHAR(30);
        SELECT @so_ct = so_ct FROM @so;
        SET @id = NEWID();
        INSERT INTO dbo.bh_hoadon (id, phieuId, so_ct, ngay_ct, ma_kh, ten_kh, t_tien, dien_giai)
        SELECT @id, @phieuId, @so_ct, CONVERT(date, GETDATE()), p.ma_kh, p.ten_kh,
            ISNULL((SELECT SUM(tien) FROM dbo.bh_phieu_ct WHERE phieuId = @phieuId), 0),
            ISNULL(@dien_giai, N'Hóa đơn BH')
        FROM dbo.bh_phieu p
        WHERE p.id = @phieuId;
        SELECT @id AS id, @so_ct AS so_ct;
        RETURN;
    END

    RAISERROR(N'usp_BhHoaDon: @action không hợp lệ.', 16, 1);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_BhTraCuu
    @action INT,
    @q      NVARCHAR(80) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @s NVARCHAR(80) = N'%' + ISNULL(LTRIM(RTRIM(@q)), N'') + N'%';

    IF @action = 1
    BEGIN
        SELECT N'Serial' AS [Nguồn], so_serial AS [Số], ISNULL(ten_sp, ma_sp) AS [Sản phẩm],
            CONVERT(nvarchar(20), ngay_bh_tu, 103) AS [Từ ngày],
            CONVERT(nvarchar(20), ngay_bh_den, 103) AS [Đến ngày],
            ISNULL(tinh_trang, N'') AS [Ghi chú]
        FROM dbo.dm_serial WHERE so_serial LIKE @s
        UNION ALL
        SELECT N'Phiếu BH', so_ct, ten_sp, CONVERT(nvarchar(20), ngay_ct, 103), status, ISNULL(yeu_cau, N'')
        FROM dbo.bh_phieu WHERE so_serial LIKE @s
        UNION ALL
        SELECT N'Báo giá', so_ct, ten_kh, CONVERT(nvarchar(20), ngay_ct, 103), status, CONVERT(nvarchar(40), t_tien)
        FROM dbo.bh_baogia WHERE so_serial LIKE @s
        UNION ALL
        SELECT N'Kho BH', so_ct, CAST(ma_gd AS nvarchar(10)), CONVERT(nvarchar(20), ngay_ct, 103), status, ISNULL(serial_moi, N'')
        FROM dbo.bh_kho WHERE so_serial LIKE @s OR ISNULL(serial_moi, N'') LIKE @s
        UNION ALL
        SELECT N'Thu PT', t.so_ct, ISNULL(p.so_serial, N''), CONVERT(nvarchar(20), t.ngay_ct, 103), CONVERT(nvarchar(40), t.so_tien), ISNULL(t.dien_giai, N'')
        FROM dbo.bh_thu t
        LEFT JOIN dbo.bh_phieu p ON p.id = t.phieuId
        WHERE p.so_serial LIKE @s
        UNION ALL
        SELECT N'Hóa đơn', h.so_ct, ISNULL(h.ten_kh, N''), CONVERT(nvarchar(20), h.ngay_ct, 103), CONVERT(nvarchar(40), h.t_tien), ISNULL(h.dien_giai, N'')
        FROM dbo.bh_hoadon h
        LEFT JOIN dbo.bh_phieu p ON p.id = h.phieuId
        WHERE p.so_serial LIKE @s
        ORDER BY 1, 2;
        RETURN;
    END

    IF @action = 2
    BEGIN
        SELECT TOP 1 * FROM dbo.dm_serial WHERE so_serial = LTRIM(RTRIM(@q));
        RETURN;
    END

    IF @action = 3
    BEGIN
        /* Khong ghi cot tinh — dmsp tren DB cu co the la code/name/unit */
        DECLARE @ma sysname = CASE
            WHEN COL_LENGTH(N'dbo.dmsp', N'ma_sp') IS NOT NULL THEN N'ma_sp'
            WHEN COL_LENGTH(N'dbo.dmsp', N'code') IS NOT NULL THEN N'code'
            ELSE N'ma_sp' END;
        DECLARE @ten sysname = CASE
            WHEN COL_LENGTH(N'dbo.dmsp', N'ten_sp') IS NOT NULL THEN N'ten_sp'
            WHEN COL_LENGTH(N'dbo.dmsp', N'name') IS NOT NULL THEN N'name'
            ELSE N'ten_sp' END;
        DECLARE @dvt sysname = CASE
            WHEN COL_LENGTH(N'dbo.dmsp', N'dvt') IS NOT NULL THEN N'dvt'
            WHEN COL_LENGTH(N'dbo.dmsp', N'unit') IS NOT NULL THEN N'unit'
            ELSE N'dvt' END;
        DECLARE @sql3 NVARCHAR(MAX) =
            N'SELECT TOP 1 ' + QUOTENAME(@ma) + N' AS ma_sp, '
            + QUOTENAME(@ten) + N' AS ten_sp, ISNULL(' + QUOTENAME(@dvt) + N', N'''') AS dvt
              FROM dbo.dmsp WHERE ' + QUOTENAME(@ma) + N' = @q';
        EXEC sys.sp_executesql @sql3, N'@q nvarchar(80)', @q;
        RETURN;
    END

    IF @action = 4
    BEGIN
        SELECT TOP 1 code, name, amount FROM dbo.labor_costs WHERE code = LTRIM(RTRIM(@q));
        RETURN;
    END

    RAISERROR(N'usp_BhTraCuu: @action không hợp lệ.', 16, 1);
END
GO
