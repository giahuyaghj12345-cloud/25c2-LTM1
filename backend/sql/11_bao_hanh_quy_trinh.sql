USE [Quanlysanpham];
GO
/* Bo sung cot theo quy trinh GGV: bao gia -> phieu DV -> kho -> thu -> hoa don.
   Cot moi co default, khong doi SP WinForms dang chay. */

IF COL_LENGTH('dbo.bh_baogia', 'dia_chi') IS NULL ALTER TABLE dbo.bh_baogia ADD dia_chi NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'dien_thoai') IS NULL ALTER TABLE dbo.bh_baogia ADD dien_thoai NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'email') IS NULL ALTER TABLE dbo.bh_baogia ADD email NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'mst') IS NULL ALTER TABLE dbo.bh_baogia ADD mst NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'cccd') IS NULL ALTER TABLE dbo.bh_baogia ADD cccd NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'ma_sp') IS NULL ALTER TABLE dbo.bh_baogia ADD ma_sp NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'ten_sp') IS NULL ALTER TABLE dbo.bh_baogia ADD ten_sp NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'hang_xe') IS NULL ALTER TABLE dbo.bh_baogia ADD hang_xe NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'ten_xe') IS NULL ALTER TABLE dbo.bh_baogia ADD ten_xe NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'bien_so') IS NULL ALTER TABLE dbo.bh_baogia ADD bien_so NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'yeu_cau') IS NULL ALTER TABLE dbo.bh_baogia ADD yeu_cau NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.bh_baogia', 'tt_sp') IS NULL ALTER TABLE dbo.bh_baogia ADD tt_sp NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_baogia', 't_tcong') IS NULL ALTER TABLE dbo.bh_baogia ADD t_tcong DECIMAL(18,2) NOT NULL CONSTRAINT DF_bg_tc DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia', 't_ck_tc') IS NULL ALTER TABLE dbo.bh_baogia ADD t_ck_tc DECIMAL(18,2) NOT NULL CONSTRAINT DF_bg_cktc DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia', 't_phutung') IS NULL ALTER TABLE dbo.bh_baogia ADD t_phutung DECIMAL(18,2) NOT NULL CONSTRAINT DF_bg_pt DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia', 't_ck_pt') IS NULL ALTER TABLE dbo.bh_baogia ADD t_ck_pt DECIMAL(18,2) NOT NULL CONSTRAINT DF_bg_ckpt DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia', 't_thue') IS NULL ALTER TABLE dbo.bh_baogia ADD t_thue DECIMAL(18,2) NOT NULL CONSTRAINT DF_bg_thue DEFAULT 0;

IF COL_LENGTH('dbo.bh_baogia_ct', 'dvt') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD dvt NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_baogia_ct', 'tl_ck') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD tl_ck DECIMAL(9,2) NOT NULL CONSTRAINT DF_bgct_ck DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia_ct', 'tien_ck') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD tien_ck DECIMAL(18,2) NOT NULL CONSTRAINT DF_bgct_tck DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia_ct', 'thue_suat') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD thue_suat DECIMAL(9,2) NOT NULL CONSTRAINT DF_bgct_ts DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia_ct', 'tien_thue') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD tien_thue DECIMAL(18,2) NOT NULL CONSTRAINT DF_bgct_th DEFAULT 0;
IF COL_LENGTH('dbo.bh_baogia_ct', 'ghi_chu') IS NULL ALTER TABLE dbo.bh_baogia_ct ADD ghi_chu NVARCHAR(200) NULL;

IF COL_LENGTH('dbo.bh_phieu', 'loai_bh') IS NULL ALTER TABLE dbo.bh_phieu ADD loai_bh INT NOT NULL CONSTRAINT DF_ph_loai DEFAULT 1;
IF COL_LENGTH('dbo.bh_phieu', 'mst') IS NULL ALTER TABLE dbo.bh_phieu ADD mst NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'cccd') IS NULL ALTER TABLE dbo.bh_phieu ADD cccd NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'lo_sx') IS NULL ALTER TABLE dbo.bh_phieu ADD lo_sx NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'tg_sd') IS NULL ALTER TABLE dbo.bh_phieu ADD tg_sd NVARCHAR(64) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'nguon_goc') IS NULL ALTER TABLE dbo.bh_phieu ADD nguon_goc NVARCHAR(64) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'lay_pt_cu') IS NULL ALTER TABLE dbo.bh_phieu ADD lay_pt_cu INT NOT NULL CONSTRAINT DF_ph_lpt DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 'tg_tiep_nhan') IS NULL ALTER TABLE dbo.bh_phieu ADD tg_tiep_nhan DATETIME NULL;
IF COL_LENGTH('dbo.bh_phieu', 'tg_hoan_tra_dk') IS NULL ALTER TABLE dbo.bh_phieu ADD tg_hoan_tra_dk DATETIME NULL;
IF COL_LENGTH('dbo.bh_phieu', 'tg_hoan_tra_tt') IS NULL ALTER TABLE dbo.bh_phieu ADD tg_hoan_tra_tt DATETIME NULL;
IF COL_LENGTH('dbo.bh_phieu', 'xuat_hd') IS NULL ALTER TABLE dbo.bh_phieu ADD xuat_hd INT NOT NULL CONSTRAINT DF_ph_xhd DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 'hd_ten') IS NULL ALTER TABLE dbo.bh_phieu ADD hd_ten NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'hd_dia_chi') IS NULL ALTER TABLE dbo.bh_phieu ADD hd_dia_chi NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'hd_mst') IS NULL ALTER TABLE dbo.bh_phieu ADD hd_mst NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'hd_cccd') IS NULL ALTER TABLE dbo.bh_phieu ADD hd_cccd NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'hd_dt') IS NULL ALTER TABLE dbo.bh_phieu ADD hd_dt NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'hd_email') IS NULL ALTER TABLE dbo.bh_phieu ADD hd_email NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.bh_phieu', 'hoan_tat') IS NULL ALTER TABLE dbo.bh_phieu ADD hoan_tat INT NOT NULL CONSTRAINT DF_ph_ht DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 'bg_id') IS NULL ALTER TABLE dbo.bh_phieu ADD bg_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.bh_phieu', 't_tcong') IS NULL ALTER TABLE dbo.bh_phieu ADD t_tcong DECIMAL(18,2) NOT NULL CONSTRAINT DF_ph_tc DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 't_ck_tc') IS NULL ALTER TABLE dbo.bh_phieu ADD t_ck_tc DECIMAL(18,2) NOT NULL CONSTRAINT DF_ph_cktc DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 't_phutung') IS NULL ALTER TABLE dbo.bh_phieu ADD t_phutung DECIMAL(18,2) NOT NULL CONSTRAINT DF_ph_pt DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 't_ck_pt') IS NULL ALTER TABLE dbo.bh_phieu ADD t_ck_pt DECIMAL(18,2) NOT NULL CONSTRAINT DF_ph_ckpt DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 't_thue') IS NULL ALTER TABLE dbo.bh_phieu ADD t_thue DECIMAL(18,2) NOT NULL CONSTRAINT DF_ph_thue DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu', 't_tt') IS NULL ALTER TABLE dbo.bh_phieu ADD t_tt DECIMAL(18,2) NOT NULL CONSTRAINT DF_ph_tt DEFAULT 0;

IF COL_LENGTH('dbo.bh_phieu_ct', 'tl_ck') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD tl_ck DECIMAL(9,2) NOT NULL CONSTRAINT DF_phct_ck DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu_ct', 'tien_ck') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD tien_ck DECIMAL(18,2) NOT NULL CONSTRAINT DF_phct_tck DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu_ct', 'thue_suat') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD thue_suat DECIMAL(9,2) NOT NULL CONSTRAINT DF_phct_ts DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu_ct', 'tien_thue') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD tien_thue DECIMAL(18,2) NOT NULL CONSTRAINT DF_phct_th DEFAULT 0;
IF COL_LENGTH('dbo.bh_phieu_ct', 'ghi_chu') IS NULL ALTER TABLE dbo.bh_phieu_ct ADD ghi_chu NVARCHAR(200) NULL;

IF COL_LENGTH('dbo.bh_kho', 'ma_kh') IS NULL ALTER TABLE dbo.bh_kho ADD ma_kh NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.bh_kho', 'ten_kh') IS NULL ALTER TABLE dbo.bh_kho ADD ten_kh NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_kho', 'dia_chi') IS NULL ALTER TABLE dbo.bh_kho ADD dia_chi NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.bh_kho', 'nguoi_nhan') IS NULL ALTER TABLE dbo.bh_kho ADD nguoi_nhan NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_kho', 'nv_ban') IS NULL ALTER TABLE dbo.bh_kho ADD nv_ban NVARCHAR(80) NULL;
IF COL_LENGTH('dbo.bh_kho', 'quyen_so') IS NULL ALTER TABLE dbo.bh_kho ADD quyen_so NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_kho_ct', 'dvt') IS NULL ALTER TABLE dbo.bh_kho_ct ADD dvt NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_kho_ct', 'gia') IS NULL ALTER TABLE dbo.bh_kho_ct ADD gia DECIMAL(18,2) NOT NULL CONSTRAINT DF_khoct_gia DEFAULT 0;
IF COL_LENGTH('dbo.bh_kho_ct', 'tien') IS NULL ALTER TABLE dbo.bh_kho_ct ADD tien DECIMAL(18,2) NOT NULL CONSTRAINT DF_khoct_tien DEFAULT 0;

IF COL_LENGTH('dbo.bh_thu', 'ma_kh') IS NULL ALTER TABLE dbo.bh_thu ADD ma_kh NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.bh_thu', 'ten_kh') IS NULL ALTER TABLE dbo.bh_thu ADD ten_kh NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_thu', 'dia_chi') IS NULL ALTER TABLE dbo.bh_thu ADD dia_chi NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.bh_thu', 'nguoi_nop') IS NULL ALTER TABLE dbo.bh_thu ADD nguoi_nop NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.bh_thu', 'ly_do') IS NULL ALTER TABLE dbo.bh_thu ADD ly_do NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.bh_thu', 'status') IS NULL ALTER TABLE dbo.bh_thu ADD status NVARCHAR(20) NOT NULL CONSTRAINT DF_thu_st DEFAULT N'da_thu';
IF COL_LENGTH('dbo.bh_thu', 'quyen_so') IS NULL ALTER TABLE dbo.bh_thu ADD quyen_so NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.bh_hoadon', 'status') IS NULL ALTER TABLE dbo.bh_hoadon ADD status NVARCHAR(20) NOT NULL CONSTRAINT DF_hd_st DEFAULT N'nhap';
IF COL_LENGTH('dbo.bh_hoadon', 'dia_chi') IS NULL ALTER TABLE dbo.bh_hoadon ADD dia_chi NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.bh_hoadon', 'mst') IS NULL ALTER TABLE dbo.bh_hoadon ADD mst NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_hoadon', 'dien_thoai') IS NULL ALTER TABLE dbo.bh_hoadon ADD dien_thoai NVARCHAR(30) NULL;
IF COL_LENGTH('dbo.bh_hoadon', 'email') IS NULL ALTER TABLE dbo.bh_hoadon ADD email NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.bh_hoadon', 'cccd') IS NULL ALTER TABLE dbo.bh_hoadon ADD cccd NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.bh_hoadon', 'so_phieu') IS NULL ALTER TABLE dbo.bh_hoadon ADD so_phieu NVARCHAR(30) NULL;
GO
