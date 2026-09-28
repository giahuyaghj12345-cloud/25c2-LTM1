using System.Data;
using System.Globalization;
using System.Security;
using System.Text;
using System.Text.RegularExpressions;

namespace QuanLyKhoBaoHanh.Data;

static class WarrantyDb
{
    static bool ready;

    public static void Ensure()
    {
        if (ready) return;
        SqlDb.Execute(@"
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
  tien DECIMAL(18,2) NOT NULL DEFAULT 0
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
  tien DECIMAL(18,2) NOT NULL DEFAULT 0
);
IF OBJECT_ID(N'dbo.bh_kho', N'U') IS NULL
CREATE TABLE dbo.bh_kho (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phieuId UNIQUEIDENTIFIER NULL,
  so_ct NVARCHAR(30) NOT NULL,
  ngay_ct DATE NOT NULL DEFAULT GETDATE(),
  ma_gd INT NOT NULL,
  loai_nx NVARCHAR(10) NULL,
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
  so_serial NVARCHAR(50) NULL
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
);");
        DeploySps();
        ready = true;
    }

    static void DeploySps()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "sql", "10_usp_bao_hanh.sql");
        if (!File.Exists(path))
            path = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "sql", "10_usp_bao_hanh.sql"));
        if (!File.Exists(path)) return;
        foreach (var batch in Regex.Split(File.ReadAllText(path), @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
        {
            var sql = batch.Trim();
            if (sql.Length == 0 || sql.IndexOf("CREATE", StringComparison.OrdinalIgnoreCase) < 0) continue;
            try { SqlDb.Execute(sql); }
            catch { /* batch comment / đã có */ }
        }
    }

    public static string StatusName(string? s) => (s ?? "") switch
    {
        "nhap" => "Nháp",
        "xac_nhan" => "Đã xác nhận",
        "dang_sua" => "Đang sửa",
        "cho_pt" => "Chờ phụ tùng",
        "hoan_tat" => "Hoàn tất sửa",
        "da_giao" => "Đã giao khách",
        "huy" => "Hủy",
        "da_duyet" => "Đã duyệt",
        "da_thu" => "Đã thu",
        _ => s ?? "",
    };

    public static string GdName(int gd) => gd switch
    {
        7 => "Xuất kho phụ tùng BH",
        8 => "Xuất SP 1 đổi 1",
        10 => "Nhập/xuất kho sau BH",
        11 => "Nhập SP serial cũ",
        _ => "Kho BH",
    };

    public static string NextSo(string prefix)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhSoCt", SqlDb.P("@prefix", prefix));
        return dt.Rows.Count == 0 ? prefix + DateTime.Now.ToString("yyMM") + "0001" : Convert.ToString(dt.Rows[0]["so_ct"]) ?? "";
    }

    public static DataTable ListPhieu()
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhPhieu", SqlDb.P("@action", 1));
    }

    public static DataRow? GetPhieu(Guid id)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhPhieu", SqlDb.P("@action", 2), SqlDb.P("@id", id));
        return dt.Rows.Count == 0 ? null : dt.Rows[0];
    }

    public static DataTable GetPhieuCt(Guid id)
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhPhieu", SqlDb.P("@action", 3), SqlDb.P("@id", id));
    }

    public static Guid SavePhieu(Guid? id, Dictionary<string, object?> h, DataTable ct)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhPhieu",
            SqlDb.P("@action", 10),
            SqlDb.P("@id", id),
            SqlDb.P("@so_ct", h.GetValueOrDefault("so_ct")),
            SqlDb.P("@ngay_ct", h.GetValueOrDefault("ngay_ct") ?? DateTime.Today),
            SqlDb.P("@status", h.GetValueOrDefault("status") ?? "nhap"),
            SqlDb.P("@ma_kh", h.GetValueOrDefault("ma_kh")),
            SqlDb.P("@ten_kh", h.GetValueOrDefault("ten_kh")),
            SqlDb.P("@dien_thoai", h.GetValueOrDefault("dien_thoai")),
            SqlDb.P("@dia_chi", h.GetValueOrDefault("dia_chi")),
            SqlDb.P("@email", h.GetValueOrDefault("email")),
            SqlDb.P("@so_serial", h.GetValueOrDefault("so_serial")),
            SqlDb.P("@ma_sp", h.GetValueOrDefault("ma_sp")),
            SqlDb.P("@ten_sp", h.GetValueOrDefault("ten_sp")),
            SqlDb.P("@hang_xe", h.GetValueOrDefault("hang_xe")),
            SqlDb.P("@ten_xe", h.GetValueOrDefault("ten_xe")),
            SqlDb.P("@nam_sx", h.GetValueOrDefault("nam_sx")),
            SqlDb.P("@odo", h.GetValueOrDefault("odo")),
            SqlDb.P("@bien_so", h.GetValueOrDefault("bien_so")),
            SqlDb.P("@yeu_cau", h.GetValueOrDefault("yeu_cau")),
            SqlDb.P("@tu_van", h.GetValueOrDefault("tu_van")),
            SqlDb.P("@tt_sp", h.GetValueOrDefault("tt_sp")),
            SqlDb.P("@ngay_hen", h.GetValueOrDefault("ngay_hen")),
            SqlDb.P("@ghi_chu", h.GetValueOrDefault("ghi_chu")),
            SqlDb.P("@xml_ct", PhieuCtXml(ct)),
            SqlDb.P("@user", Session.Username));
        return IdOf(dt, id);
    }

    public static void DeletePhieu(Guid id)
    {
        Ensure();
        SqlDb.ExecProc("usp_BhPhieu", SqlDb.P("@action", 11), SqlDb.P("@id", id));
    }

    public static void SetStatus(Guid id, string status)
    {
        Ensure();
        SqlDb.ExecProc("usp_BhPhieu", SqlDb.P("@action", 20), SqlDb.P("@id", id), SqlDb.P("@status", status));
    }

    public static DataTable ListBg()
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhBaoGia", SqlDb.P("@action", 1));
    }

    public static Guid SaveBg(Guid? phieuId, string dienGiai)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhBaoGia",
            SqlDb.P("@action", 10), SqlDb.P("@phieuId", phieuId), SqlDb.P("@dien_giai", dienGiai));
        return IdOf(dt, null);
    }

    public static void DuyetBg(Guid id)
    {
        Ensure();
        SqlDb.ExecProc("usp_BhBaoGia", SqlDb.P("@action", 20), SqlDb.P("@id", id));
    }

    public static DataTable ListKho()
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhKho", SqlDb.P("@action", 1));
    }

    public static Guid SaveKho(Guid? phieuId, int maGd, string loaiNx, string serialMoi, DataTable ct)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhKho",
            SqlDb.P("@action", 10),
            SqlDb.P("@phieuId", phieuId),
            SqlDb.P("@ma_gd", maGd),
            SqlDb.P("@loai_nx", loaiNx),
            SqlDb.P("@serial_moi", serialMoi),
            SqlDb.P("@xml_ct", KhoCtXml(ct)));
        return IdOf(dt, null);
    }

    public static DataTable ListThu()
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhThu", SqlDb.P("@action", 1));
    }

    public static Guid SaveThu(Guid? phieuId, decimal tien, string hinhThuc, string dienGiai)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhThu",
            SqlDb.P("@action", 10),
            SqlDb.P("@phieuId", phieuId),
            SqlDb.P("@so_tien", tien),
            SqlDb.P("@hinh_thuc", hinhThuc),
            SqlDb.P("@dien_giai", dienGiai));
        return IdOf(dt, null);
    }

    public static DataTable ListHd()
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhHoaDon", SqlDb.P("@action", 1));
    }

    public static Guid SaveHd(Guid? phieuId, string dienGiai)
    {
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhHoaDon",
            SqlDb.P("@action", 10), SqlDb.P("@phieuId", phieuId), SqlDb.P("@dien_giai", dienGiai));
        return IdOf(dt, null);
    }

    public static DataRow? FindSerial(string serial)
    {
        var s = (serial ?? "").Trim();
        if (s.Length == 0) return null;
        try
        {
            Ensure();
            var dt = SqlDb.ExecProc("usp_BhTraCuu", SqlDb.P("@action", 2), SqlDb.P("@q", s));
            return dt.Rows.Count == 0 ? null : dt.Rows[0];
        }
        catch { return null; }
    }

    public static DataRow? FindProduct(string ma)
    {
        var c = (ma ?? "").Trim();
        if (c.Length == 0) return null;
        try
        {
            Ensure();
            var dt = SqlDb.ExecProc("usp_BhTraCuu", SqlDb.P("@action", 3), SqlDb.P("@q", c));
            return dt.Rows.Count == 0 ? null : dt.Rows[0];
        }
        catch { return null; }
    }

    public static DataRow? FindLabor(string code)
    {
        CatalogDb.EnsureLabor();
        var c = (code ?? "").Trim();
        if (c.Length == 0) return null;
        Ensure();
        var dt = SqlDb.ExecProc("usp_BhTraCuu", SqlDb.P("@action", 4), SqlDb.P("@q", c));
        return dt.Rows.Count == 0 ? null : dt.Rows[0];
    }

    public static DataTable TraCuuSerial(string serial)
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhTraCuu", SqlDb.P("@action", 1), SqlDb.P("@q", (serial ?? "").Trim()));
    }

    public static DataTable PhieuLookup()
    {
        Ensure();
        return SqlDb.ExecProc("usp_BhPhieu", SqlDb.P("@action", 21));
    }

    public static DataTable EmptyCt()
    {
        var t = new DataTable();
        t.Columns.Add("loai", typeof(string));
        t.Columns.Add("ma", typeof(string));
        t.Columns.Add("ten", typeof(string));
        t.Columns.Add("dvt", typeof(string));
        t.Columns.Add("so_luong", typeof(decimal));
        t.Columns.Add("gia", typeof(decimal));
        t.Columns.Add("tien", typeof(decimal));
        return t;
    }

    public static DataTable EmptyKhoCt()
    {
        var t = new DataTable();
        t.Columns.Add("ma_sp", typeof(string));
        t.Columns.Add("ten_sp", typeof(string));
        t.Columns.Add("so_luong", typeof(decimal));
        t.Columns.Add("so_serial", typeof(string));
        return t;
    }

    static Guid IdOf(DataTable dt, Guid? fallback)
    {
        if (dt.Rows.Count > 0 && dt.Columns.Contains("id") && dt.Rows[0]["id"] != DBNull.Value)
            return (Guid)dt.Rows[0]["id"];
        if (fallback != null) return fallback.Value;
        throw new InvalidOperationException("Stored procedure không trả về id.");
    }

    static string PhieuCtXml(DataTable ct)
    {
        var sb = new StringBuilder("<root>");
        var stt = 0;
        foreach (DataRow r in ct.Rows)
        {
            if (r.RowState == DataRowState.Deleted) continue;
            var ma = Convert.ToString(r["ma"])?.Trim();
            if (string.IsNullOrEmpty(ma)) continue;
            stt++;
            sb.Append("<r stt=\"").Append(stt)
                .Append("\" loai=\"").Append(X(r["loai"] ?? "pt"))
                .Append("\" ma=\"").Append(X(ma))
                .Append("\" ten=\"").Append(X(r["ten"]))
                .Append("\" dvt=\"").Append(X(r["dvt"]))
                .Append("\" so_luong=\"").Append(Num(r["so_luong"]))
                .Append("\" gia=\"").Append(Num(r["gia"]))
                .Append("\" />");
        }
        return sb.Append("</root>").ToString();
    }

    static string KhoCtXml(DataTable ct)
    {
        var sb = new StringBuilder("<root>");
        foreach (DataRow r in ct.Rows)
        {
            if (r.RowState == DataRowState.Deleted) continue;
            var ma = Convert.ToString(r["ma_sp"])?.Trim();
            if (string.IsNullOrEmpty(ma)) continue;
            sb.Append("<r ma_sp=\"").Append(X(ma))
                .Append("\" ten_sp=\"").Append(X(r["ten_sp"]))
                .Append("\" so_luong=\"").Append(Num(r["so_luong"]))
                .Append("\" so_serial=\"").Append(X(r["so_serial"]))
                .Append("\" />");
        }
        return sb.Append("</root>").ToString();
    }

    static string X(object? v) => SecurityElement.Escape(Convert.ToString(v) ?? "") ?? "";

    static string Num(object? v)
    {
        decimal.TryParse(Convert.ToString(v), out var n);
        return n.ToString(CultureInfo.InvariantCulture);
    }
}
