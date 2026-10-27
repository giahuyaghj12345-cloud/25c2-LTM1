USE [Quanlysanpham];
GO
UPDATE dbo.bh_phieu SET
  ma_kh = N'KIDLOFIFAI',
  ten_kh = N'Luu Phu Nguyen',
  dien_thoai = N'0900000001',
  so_serial = N'11240826-DAD-TBN0001',
  ma_sp = N'SP000002',
  ten_sp = N'KIDLONGUYEN',
  hang_xe = N'Honda',
  ten_xe = N'Winner',
  nam_sx = N'2024',
  odo = N'3500',
  yeu_cau = N'May keu la khi no, mat suc',
  tu_van = N'Kiem tra bugi va loc gio',
  tt_sp = N'BH con han',
  status = N'xac_nhan',
  updatedAt = GETDATE()
WHERE id = '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0';

IF NOT EXISTS (SELECT 1 FROM dbo.bh_phieu_ct WHERE phieuId = '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0')
BEGIN
  INSERT INTO dbo.bh_phieu_ct (id, phieuId, stt, loai, ma, ten, dvt, so_luong, gia, tien) VALUES
    (NEWID(), '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0', 1, N'pt', N'SP000002', N'KIDLONGUYEN', N'Cai', 1, 150000, 150000),
    (NEWID(), '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0', 2, N'tc', N'TC0001', N'Cong sua chua BH', N'Lan', 1, 200000, 200000);
END

IF NOT EXISTS (SELECT 1 FROM dbo.labor_costs)
  INSERT INTO dbo.labor_costs (id, code, name, amount, note, status)
  VALUES (NEWID(), N'TC0001', N'Cong sua chua BH', 200000, N'Dung cho phieu BH', N'1');

IF NOT EXISTS (SELECT 1 FROM dbo.bh_baogia)
  EXEC dbo.usp_BhBaoGia @action = 10, @phieuId = '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0', @dien_giai = N'Bao gia test do an';

IF NOT EXISTS (SELECT 1 FROM dbo.bh_thu)
  EXEC dbo.usp_BhThu @action = 10, @phieuId = '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0', @so_tien = 350000, @hinh_thuc = N'Tien mat', @dien_giai = N'Thu PT/cong test';

IF NOT EXISTS (SELECT 1 FROM dbo.bh_hoadon)
  EXEC dbo.usp_BhHoaDon @action = 10, @phieuId = '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0', @dien_giai = N'Hoa don BH test';

IF NOT EXISTS (SELECT 1 FROM dbo.bh_kho)
  EXEC dbo.usp_BhKho
    @action = 10,
    @phieuId = '6155953F-1BF4-4CDD-A9BE-FB6ACCBF26F0',
    @ma_gd = 7,
    @loai_nx = N'xuat',
    @serial_moi = NULL,
    @xml_ct = N'<root><r ma_sp="SP000002" ten_sp="KIDLONGUYEN" so_luong="1" so_serial="" /></root>';
GO
