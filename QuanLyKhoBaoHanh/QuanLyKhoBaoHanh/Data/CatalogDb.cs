using System.Data;

namespace QuanLyKhoBaoHanh.Data;

static class CatalogDb
{
    static HashSet<string>? dmspCols;
    static bool productEnsured;

    public static void EnsureLabor()
    {
        SqlDb.Execute(@"
IF OBJECT_ID(N'dbo.labor_costs', N'U') IS NULL
CREATE TABLE dbo.labor_costs (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  code NVARCHAR(50) NOT NULL UNIQUE,
  name NVARCHAR(200) NOT NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  note NVARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE(),
  updatedAt DATETIME NOT NULL DEFAULT GETDATE()
)");
        Try(@"IF COL_LENGTH(N'dbo.labor_costs', N'name2') IS NULL ALTER TABLE dbo.labor_costs ADD name2 NVARCHAR(200) NULL");
        Try(@"IF COL_LENGTH(N'dbo.labor_costs', N'status') IS NULL ALTER TABLE dbo.labor_costs ADD status NVARCHAR(1) NULL");
    }

    public static void EnsureProduct()
    {
        if (productEnsured) return;
        productEnsured = true;
        Try(@"SET LOCK_TIMEOUT 2000;
IF COL_LENGTH(N'dbo.dmsp', N'nh_vt1') IS NULL ALTER TABLE dbo.dmsp ADD nh_vt1 NVARCHAR(20) NULL;
IF COL_LENGTH(N'dbo.dmsp', N'sl_min') IS NULL ALTER TABLE dbo.dmsp ADD sl_min DECIMAL(15,4) NULL;
IF COL_LENGTH(N'dbo.dmsp', N'sl_max') IS NULL ALTER TABLE dbo.dmsp ADD sl_max DECIMAL(15,4) NULL;
IF COL_LENGTH(N'dbo.dmsp', N'vt_ton_kho') IS NULL ALTER TABLE dbo.dmsp ADD vt_ton_kho BIT NULL;
IF COL_LENGTH(N'dbo.dmsp', N'sl_ton') IS NULL ALTER TABLE dbo.dmsp ADD sl_ton DECIMAL(18,4) NOT NULL CONSTRAINT DF_dmsp_sl_ton DEFAULT(0);
IF COL_LENGTH(N'dbo.dmsp', N'ma_tra_cuu') IS NULL ALTER TABLE dbo.dmsp ADD ma_tra_cuu NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.dmsp', N'ten_sp2') IS NULL ALTER TABLE dbo.dmsp ADD ten_sp2 NVARCHAR(255) NULL;
IF COL_LENGTH(N'dbo.dmsp', N'ghi_chu') IS NULL ALTER TABLE dbo.dmsp ADD ghi_chu NVARCHAR(1000) NULL;
IF OBJECT_ID(N'dbo.dmsp_gia', N'U') IS NULL
CREATE TABLE dbo.dmsp_gia (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  productId UNIQUEIDENTIFIER NOT NULL,
  ngay_hl DATE NULL,
  gia DECIMAL(18,4) NOT NULL DEFAULT 0,
  gia_vat DECIMAL(18,4) NOT NULL DEFAULT 0,
  nh_kh NVARCHAR(20) NULL,
  ma_kh NVARCHAR(50) NULL
);");
        dmspCols = null;
    }

    public static bool Has(string column)
    {
        dmspCols ??= LoadDmspCols();
        return dmspCols.Contains(column);
    }

    public static string KeyCol => "id";

    public static object KeyParam(string id) =>
        Guid.TryParse(id, out var g) ? g : id;

    public static DataTable ListProducts()
    {
        dmspCols ??= LoadDmspCols();
        var key = Has("id") ? "CONVERT(nvarchar(50), id)" : "ma_sp";
        var nh = Has("nh_vt1") ? "ISNULL(nh_vt1,N'')" : "N''";
        var smin = Has("sl_min") ? "ISNULL(sl_min,0)" : "0";
        var smax = Has("sl_max") ? "ISNULL(sl_max,0)" : "0";
        var track = Has("vt_ton_kho")
            ? "CASE WHEN ISNULL(CONVERT(int, vt_ton_kho),1)=1 THEN N'Có' ELSE N'Không' END"
            : "N'Có'";
        var slTon = Has("sl_ton") ? "ISNULL(sl_ton,0)" : "0";
        var st = Has("status")
            ? "CASE WHEN status=N'1' THEN N'Sử dụng' ELSE N'Ngưng' END"
            : "N'Sử dụng'";
        return SqlDb.Query($@"SET LOCK_TIMEOUT 8000;
SELECT {key} AS id, ma_sp AS [Mã SP], ten_sp AS [Tên SP], ISNULL(dvt,N'') AS [ĐVT],
            {nh} AS [Nhóm], {smin} AS [SL min], {smax} AS [SL max], {slTon} AS [Tồn], {track} AS [Theo dõi tồn], {st} AS [Trạng thái]
            FROM dbo.dmsp");
    }

    public static string NextProductCode()
    {
        var n = Convert.ToInt32(SqlDb.Scalar("SELECT ISNULL(MAX(TRY_CONVERT(int, SUBSTRING(ma_sp,3,10))),0)+1 FROM dbo.dmsp WHERE ma_sp LIKE N'SP%'") ?? 1);
        return "SP" + n.ToString("000000");
    }

    public static string NextLaborCode()
    {
        var n = Convert.ToInt32(SqlDb.Scalar("SELECT ISNULL(MAX(TRY_CONVERT(int, SUBSTRING(code,3,10))),0)+1 FROM dbo.labor_costs WHERE code LIKE N'TC%'") ?? 1);
        return "TC" + n.ToString("0000");
    }

    public static DataRow? LoadProductRow(string id)
    {
        dmspCols ??= LoadDmspCols();
        string[] want =
        [
            "id", "ma_sp", "ma_tra_cuu", "ten_sp", "ten_sp2", "dvt", "nhieu_dvt", "vt_ke", "vt_ton_kho", "sl_ton", "lot_yn",
            "gia_ton", "loai_vt", "tk_vt", "thue_suat", "sua_tk_vt", "tk_dt", "tk_tl", "tk_dtnb", "tk_cl_vt", "tk_gv",
            "tk_spdd", "nh_vt1", "nh_vt2", "nh_vt3", "sl_min", "sl_max", "ma_nganh", "ghi_chu", "status", "thue_gtgt",
            "thue_bvmt", "ma_ck", "loai_ma", "ma_hs", "thuong_hieu", "gia_dinh_sp", "mau_sac", "mau_xe", "nam_sx",
            "nuoc_xx", "hang_sx", "quy_cach_ten"
        ];
        var list = string.Join(",", want.Where(Has).Select(c => "[" + c + "]"));
        if (string.IsNullOrEmpty(list)) list = "ma_sp, ten_sp, dvt";
        var dt = Has("id")
            ? SqlDb.Query("SELECT " + list + " FROM dbo.dmsp WHERE id=@id", SqlDb.P("@id", KeyParam(id)))
            : new DataTable();
        if (dt.Rows.Count == 0)
            dt = SqlDb.Query("SELECT " + list + " FROM dbo.dmsp WHERE ma_sp=@id", SqlDb.P("@id", id));
        return dt.Rows.Count == 0 ? null : dt.Rows[0];
    }

    public static DataTable LoadPrices(string productId)
    {
        try
        {
            return SqlDb.Query("SELECT ngay_hl, gia, gia_vat, nh_kh, ma_kh FROM dbo.dmsp_gia WHERE productId=@id",
                SqlDb.P("@id", KeyParam(productId)));
        }
        catch
        {
            return new DataTable();
        }
    }

    public static void SaveProduct(string? id, Dictionary<string, object?> fields, DataTable prices)
    {
        EnsureProduct();
        dmspCols = null;
        var isNew = string.IsNullOrWhiteSpace(id);
        var pid = isNew ? Guid.NewGuid() : (Guid)KeyParam(id!);
        if (isNew) fields["id"] = pid;

        if (isNew)
        {
            var cols = new List<string>();
            var vals = new List<string>();
            var ps = new List<Microsoft.Data.SqlClient.SqlParameter>();
            var i = 0;
            foreach (var (col, val) in fields)
            {
                if (col != "id" && !Has(col)) continue;
                var p = "@p" + i++;
                cols.Add(col);
                vals.Add(p);
                ps.Add(SqlDb.P(p, val));
            }
            SqlDb.Execute($"INSERT INTO dbo.dmsp ({string.Join(",", cols)}) VALUES ({string.Join(",", vals)})", [.. ps]);
        }
        else
        {
            var sets = new List<string>();
            var ps = new List<Microsoft.Data.SqlClient.SqlParameter> { SqlDb.P("@id", pid) };
            var i = 0;
            foreach (var (col, val) in fields)
            {
                if (col is "id" or "ma_sp") continue;
                if (!Has(col)) continue;
                var p = "@p" + i++;
                sets.Add($"{col}={p}");
                ps.Add(SqlDb.P(p, val));
            }
            if (sets.Count > 0)
                SqlDb.Execute($"UPDATE dbo.dmsp SET {string.Join(",", sets)} WHERE id=@id", [.. ps]);
        }

        try
        {
            SqlDb.Execute("DELETE FROM dbo.dmsp_gia WHERE productId=@id", SqlDb.P("@id", pid));
            foreach (DataRow row in prices.Rows)
            {
                if (row.RowState == DataRowState.Deleted) continue;
                var ngay = Convert.ToString(row["ngay_hl"]);
                var gia = ToDec(row["gia"]);
                var vat = ToDec(row["gia_vat"]);
                var nh = Convert.ToString(row["nh_kh"]) ?? "";
                var kh = Convert.ToString(row["ma_kh"]) ?? "";
                if (string.IsNullOrWhiteSpace(ngay) && gia == 0 && vat == 0 && nh.Length == 0 && kh.Length == 0) continue;
                SqlDb.Execute(
                    @"INSERT INTO dbo.dmsp_gia (id, productId, ngay_hl, gia, gia_vat, nh_kh, ma_kh)
                      VALUES (NEWID(), @pid, @d, @g, @v, @nh, @kh)",
                    SqlDb.P("@pid", pid),
                    SqlDb.P("@d", string.IsNullOrWhiteSpace(ngay) ? DBNull.Value : ngay),
                    SqlDb.P("@g", gia), SqlDb.P("@v", vat), SqlDb.P("@nh", nh), SqlDb.P("@kh", kh));
            }
        }
        catch
        {
            /* chưa có bảng giá */
        }
    }

    public static void SaveLabor(string? id, string code, string name, string name2, decimal amount, string note, string status)
    {
        EnsureLabor();
        if (string.IsNullOrWhiteSpace(code)) code = NextLaborCode();
        try
        {
            if (id == null)
            {
                SqlDb.Execute(
                    @"INSERT INTO dbo.labor_costs (id, code, name, name2, amount, note, status, createdAt, updatedAt)
                      VALUES (NEWID(), @c, @n, @n2, @a, @g, @st, GETDATE(), GETDATE())",
                    SqlDb.P("@c", code), SqlDb.P("@n", name), SqlDb.P("@n2", name2),
                    SqlDb.P("@a", amount), SqlDb.P("@g", note), SqlDb.P("@st", status));
            }
            else
            {
                SqlDb.Execute(
                    @"UPDATE dbo.labor_costs SET code=@c, name=@n, name2=@n2, amount=@a, note=@g, status=@st, updatedAt=GETDATE() WHERE id=@id",
                    SqlDb.P("@c", code), SqlDb.P("@n", name), SqlDb.P("@n2", name2),
                    SqlDb.P("@a", amount), SqlDb.P("@g", note), SqlDb.P("@st", status), SqlDb.P("@id", Guid.Parse(id)));
            }
        }
        catch
        {
            if (id == null)
            {
                SqlDb.Execute(
                    "INSERT INTO dbo.labor_costs (id, code, name, amount, note, createdAt, updatedAt) VALUES (NEWID(), @c, @n, @a, @g, GETDATE(), GETDATE())",
                    SqlDb.P("@c", code), SqlDb.P("@n", name), SqlDb.P("@a", amount), SqlDb.P("@g", note));
            }
            else
            {
                SqlDb.Execute(
                    "UPDATE dbo.labor_costs SET code=@c, name=@n, amount=@a, note=@g, updatedAt=GETDATE() WHERE id=@id",
                    SqlDb.P("@c", code), SqlDb.P("@n", name), SqlDb.P("@a", amount), SqlDb.P("@g", note), SqlDb.P("@id", Guid.Parse(id)));
            }
        }
    }

    public static DataRow? LoadLabor(string id)
    {
        EnsureLabor();
        var dt = SqlDb.Query("SELECT * FROM dbo.labor_costs WHERE id=@id", SqlDb.P("@id", Guid.Parse(id)));
        return dt.Rows.Count == 0 ? null : dt.Rows[0];
    }

    static decimal ToDec(object? v)
    {
        if (v == null || v == DBNull.Value) return 0;
        decimal.TryParse(Convert.ToString(v), out var n);
        return n;
    }

    static HashSet<string> LoadDmspCols()
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        try
        {
            var dt = SqlDb.Query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.dmsp')");
            foreach (DataRow row in dt.Rows)
                set.Add(Convert.ToString(row["name"]) ?? "");
        }
        catch
        {
            set.Add("id");
            set.Add("ma_sp");
            set.Add("ten_sp");
            set.Add("dvt");
            set.Add("nh_vt1");
            set.Add("sl_min");
            set.Add("sl_max");
            set.Add("vt_ton_kho");
            set.Add("ma_tra_cuu");
            set.Add("status");
            set.Add("createdAt");
            set.Add("updatedAt");
        }
        if (set.Count == 0)
        {
            set.Add("id");
            set.Add("ma_sp");
            set.Add("ten_sp");
            set.Add("dvt");
            set.Add("status");
        }
        return set;
    }

    public static void EnsureCustomer()
    {
        SqlDb.Execute(@"
IF OBJECT_ID(N'dbo.dmkh', N'U') IS NULL
CREATE TABLE dbo.dmkh (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  ma_kh NVARCHAR(50) NOT NULL UNIQUE,
  ten_kh NVARCHAR(200) NOT NULL,
  ten_kh2 NVARCHAR(200) NULL,
  dia_chi NVARCHAR(255) NULL,
  dien_thoai NVARCHAR(200) NULL,
  email NVARCHAR(100) NULL,
  ma_so_thue NVARCHAR(50) NULL,
  nh_kh NVARCHAR(20) NOT NULL CONSTRAINT DF_dmkh_nh_kh DEFAULT N'dealer',
  nguoi_lien_he NVARCHAR(100) NULL,
  status NVARCHAR(1) NOT NULL CONSTRAINT DF_dmkh_status DEFAULT N'1',
  ghi_chu NVARCHAR(500) NULL,
  createdAt DATETIME NOT NULL DEFAULT GETDATE(),
  updatedAt DATETIME NOT NULL DEFAULT GETDATE()
)");
        foreach (var sql in new[]
        {
            "IF COL_LENGTH(N'dbo.dmkh', N'ma_tra_cuu') IS NULL ALTER TABLE dbo.dmkh ADD ma_tra_cuu NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'cmnd') IS NULL ALTER TABLE dbo.dmkh ADD cmnd NVARCHAR(30) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'loai_kh') IS NULL ALTER TABLE dbo.dmkh ADD loai_kh NVARCHAR(20) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'dia_chi_gh') IS NULL ALTER TABLE dbo.dmkh ADD dia_chi_gh NVARCHAR(255) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'doi_tac') IS NULL ALTER TABLE dbo.dmkh ADD doi_tac NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'ma_dktt') IS NULL ALTER TABLE dbo.dmkh ADD ma_dktt NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'tk_ngam_dinh') IS NULL ALTER TABLE dbo.dmkh ADD tk_ngam_dinh NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'quoc_gia') IS NULL ALTER TABLE dbo.dmkh ADD quoc_gia NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'mien') IS NULL ALTER TABLE dbo.dmkh ADD mien NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'vung') IS NULL ALTER TABLE dbo.dmkh ADD vung NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'tinh') IS NULL ALTER TABLE dbo.dmkh ADD tinh NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'quan') IS NULL ALTER TABLE dbo.dmkh ADD quan NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'kenh') IS NULL ALTER TABLE dbo.dmkh ADD kenh NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'nh_kh1') IS NULL ALTER TABLE dbo.dmkh ADD nh_kh1 NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'nh_kh2') IS NULL ALTER TABLE dbo.dmkh ADD nh_kh2 NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'sale1') IS NULL ALTER TABLE dbo.dmkh ADD sale1 NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'sale2') IS NULL ALTER TABLE dbo.dmkh ADD sale2 NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'tk_nh') IS NULL ALTER TABLE dbo.dmkh ADD tk_nh NVARCHAR(200) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'tl_ck') IS NULL ALTER TABLE dbo.dmkh ADD tl_ck DECIMAL(9,2) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'xuat_hd') IS NULL ALTER TABLE dbo.dmkh ADD xuat_hd BIT NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'lo_hsd') IS NULL ALTER TABLE dbo.dmkh ADD lo_hsd BIT NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'luong_kenh') IS NULL ALTER TABLE dbo.dmkh ADD luong_kenh BIT NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'la_kh') IS NULL ALTER TABLE dbo.dmkh ADD la_kh BIT NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'nv_gh') IS NULL ALTER TABLE dbo.dmkh ADD nv_gh NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'fax') IS NULL ALTER TABLE dbo.dmkh ADD fax NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'website') IS NULL ALTER TABLE dbo.dmkh ADD website NVARCHAR(100) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'nguoi_dd') IS NULL ALTER TABLE dbo.dmkh ADD nguoi_dd NVARCHAR(100) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'chuc_vu') IS NULL ALTER TABLE dbo.dmkh ADD chuc_vu NVARCHAR(50) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'han_muc') IS NULL ALTER TABLE dbo.dmkh ADD han_muc DECIMAL(18,0) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'so_ngay_no') IS NULL ALTER TABLE dbo.dmkh ADD so_ngay_no INT NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'ngay_sinh') IS NULL ALTER TABLE dbo.dmkh ADD ngay_sinh DATE NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'gioi_tinh') IS NULL ALTER TABLE dbo.dmkh ADD gioi_tinh NVARCHAR(10) NULL",
            "IF COL_LENGTH(N'dbo.dmkh', N'noi_cap') IS NULL ALTER TABLE dbo.dmkh ADD noi_cap NVARCHAR(100) NULL",
        })
            Try(sql);
    }

    public static DataTable ListCustomers()
    {
        EnsureCustomer();
        return SqlDb.Query(@"SELECT id, ma_kh AS [Mã KH], ten_kh AS [Tên khách],
            CASE WHEN nh_kh=N'retail' THEN N'Khách lẻ' ELSE N'Đại lý' END AS [Nhóm],
            ISNULL(dien_thoai,N'') AS [Điện thoại], ISNULL(dia_chi,N'') AS [Địa chỉ],
            CASE WHEN status=N'0' THEN N'Ngưng' ELSE N'Sử dụng' END AS [Trạng thái]
            FROM dbo.dmkh ORDER BY ma_kh");
    }

    public static DataTable ListCustomerCodes()
    {
        EnsureCustomer();
        return SqlDb.Query("SELECT ma_kh, ten_kh, dia_chi, dien_thoai, nh_kh FROM dbo.dmkh WHERE ISNULL(status,N'1')<>N'0' ORDER BY ma_kh");
    }

    public static string NextCustomerCode()
    {
        EnsureCustomer();
        var n = Convert.ToInt32(SqlDb.Scalar("SELECT ISNULL(MAX(TRY_CONVERT(int, SUBSTRING(ma_kh,3,10))),0)+1 FROM dbo.dmkh WHERE ma_kh LIKE N'KH%'") ?? 1);
        return "KH" + n.ToString("000000");
    }

    public static DataRow? LoadCustomer(string id)
    {
        EnsureCustomer();
        var dt = SqlDb.Query("SELECT * FROM dbo.dmkh WHERE id=@id", SqlDb.P("@id", Guid.Parse(id)));
        return dt.Rows.Count == 0 ? null : dt.Rows[0];
    }

    public static DataRow? FindCustomer(string maKh)
    {
        EnsureCustomer();
        var dt = SqlDb.Query("SELECT * FROM dbo.dmkh WHERE ma_kh=@c", SqlDb.P("@c", (maKh ?? "").Trim().ToUpper()));
        return dt.Rows.Count == 0 ? null : dt.Rows[0];
    }

    public static void SaveCustomer(string? id, Dictionary<string, object?> fields)
    {
        EnsureCustomer();
        var ma = Convert.ToString(fields.GetValueOrDefault("ma_kh")) ?? "";
        if (string.IsNullOrWhiteSpace(ma)) ma = NextCustomerCode();
        fields["ma_kh"] = ma.Trim().ToUpper();
        fields["updatedAt"] = DateTime.Now;
        var cols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (DataRow row in SqlDb.Query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.dmkh')").Rows)
            cols.Add(Convert.ToString(row["name"]) ?? "");

        if (id == null)
        {
            fields["id"] = Guid.NewGuid();
            fields["createdAt"] = DateTime.Now;
            var names = new List<string>();
            var pars = new List<Microsoft.Data.SqlClient.SqlParameter>();
            var i = 0;
            foreach (var (col, val) in fields)
            {
                if (!cols.Contains(col)) continue;
                names.Add(col);
                pars.Add(SqlDb.P("@p" + i, val ?? DBNull.Value));
                i++;
            }
            SqlDb.Execute($"INSERT INTO dbo.dmkh ({string.Join(",", names)}) VALUES ({string.Join(",", names.Select((_, n) => "@p" + n))})", [.. pars]);
        }
        else
        {
            var sets = new List<string>();
            var pars = new List<Microsoft.Data.SqlClient.SqlParameter> { SqlDb.P("@id", Guid.Parse(id)) };
            var i = 0;
            foreach (var (col, val) in fields)
            {
                if (col is "id" or "createdAt" || !cols.Contains(col)) continue;
                sets.Add($"{col}=@p{i}");
                pars.Add(SqlDb.P("@p" + i, val ?? DBNull.Value));
                i++;
            }
            if (sets.Count > 0)
                SqlDb.Execute($"UPDATE dbo.dmkh SET {string.Join(",", sets)} WHERE id=@id", [.. pars]);
        }
    }

    public static void DeleteCustomer(string id)
    {
        EnsureCustomer();
        SqlDb.Execute("DELETE FROM dbo.dmkh WHERE id=@id", SqlDb.P("@id", Guid.Parse(id)));
    }

    static void Try(string sql)
    {
        try { SqlDb.Execute(sql); }
        catch { /* cột đã có hoặc không đủ quyền */ }
    }

    /// <summary>Import Excel kiểu AA_ImportExcel — upsert theo mã, trả (inserted, updated, skipped).</summary>
    public static (int Ins, int Upd, int Skip) ImportLaborsFromExcel(DataTable table)
    {
        EnsureLabor();
        var ins = 0; var upd = 0; var skip = 0;
        foreach (DataRow row in table.Rows)
        {
            var code = ExcelIo.GetCell(row, "ma_tcong", "ma tien cong", "mã tiền công", "code", "ma");
            if (string.IsNullOrWhiteSpace(code)) { skip++; continue; }
            var name = ExcelIo.GetCell(row, "ten_tcong", "ten tien cong", "tên tiền công", "name", "ten");
            var amountText = ExcelIo.GetCell(row, "don_gia", "don gia", "đơn giá", "amount", "so_tien");
            decimal.TryParse(amountText.Replace(",", ""), System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var amount);
            var status = ExcelIo.GetCell(row, "status", "trang_thai", "hiệu lực");
            if (string.IsNullOrWhiteSpace(status)) status = "1";

            var found = SqlDb.Query("SELECT CONVERT(nvarchar(50), id) id FROM dbo.labor_costs WHERE code=@c",
                SqlDb.P("@c", code));
            if (found.Rows.Count > 0)
            {
                SaveLabor(Convert.ToString(found.Rows[0]["id"]), code, name, "", amount, "", status);
                upd++;
            }
            else
            {
                SaveLabor(null, code, name, "", amount, "", status);
                ins++;
            }
        }
        return (ins, upd, skip);
    }

    public static (int Ins, int Upd, int Skip) ImportProductsFromExcel(DataTable table)
    {
        EnsureProduct();
        var ins = 0; var upd = 0; var skip = 0;
        foreach (DataRow row in table.Rows)
        {
            var ma = ExcelIo.GetCell(row, "ma_sp", "ma sp", "mã sp", "mã sản phẩm");
            if (string.IsNullOrWhiteSpace(ma)) { skip++; continue; }
            ma = ma.Trim().ToUpper();
            var ten = ExcelIo.GetCell(row, "ten_sp", "ten sp", "tên sp", "tên sản phẩm");
            var dvt = ExcelIo.GetCell(row, "dvt", "đvt", "don vi");
            var tonText = ExcelIo.GetCell(row, "sl_ton", "sl ton", "tồn", "ton");
            decimal.TryParse(tonText.Replace(",", ""), System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var ton);
            var trackText = ExcelIo.GetCell(row, "vt_ton_kho", "theo doi ton", "theo dõi tồn");
            var track = string.IsNullOrWhiteSpace(trackText)
                || trackText is "1" or "true" or "có" or "co" or "yes";

            var found = SqlDb.Query("SELECT CONVERT(nvarchar(50), id) id FROM dbo.dmsp WHERE ma_sp=@c",
                SqlDb.P("@c", ma));
            var fields = new Dictionary<string, object?>
            {
                ["ma_sp"] = ma,
                ["ten_sp"] = ten,
                ["dvt"] = string.IsNullOrWhiteSpace(dvt) ? "Cái" : dvt,
                ["sl_ton"] = ton,
                ["vt_ton_kho"] = track,
                ["status"] = "1",
            };
            var prices = new DataTable();
            if (found.Rows.Count > 0)
            {
                SaveProduct(Convert.ToString(found.Rows[0]["id"]), fields, prices);
                upd++;
            }
            else
            {
                SaveProduct(null, fields, prices);
                ins++;
            }
        }
        return (ins, upd, skip);
    }

    public static (int Ins, int Upd, int Skip) ImportCustomersFromExcel(DataTable table)
    {
        EnsureCustomer();
        var ins = 0; var upd = 0; var skip = 0;
        foreach (DataRow row in table.Rows)
        {
            var ma = ExcelIo.GetCell(row, "ma_kh", "ma kh", "mã kh", "mã khách");
            if (string.IsNullOrWhiteSpace(ma)) { skip++; continue; }
            ma = ma.Trim().ToUpper();
            var ten = ExcelIo.GetCell(row, "ten_kh", "ten kh", "tên khách", "ten");
            var sdt = ExcelIo.GetCell(row, "dien_thoai", "sdt", "phone", "điện thoại");
            var dc = ExcelIo.GetCell(row, "dia_chi", "dia chi", "địa chỉ", "address");

            var existing = FindCustomer(ma);
            var fields = new Dictionary<string, object?>
            {
                ["ma_kh"] = ma,
                ["ten_kh"] = string.IsNullOrWhiteSpace(ten) ? ma : ten,
                ["dien_thoai"] = sdt,
                ["dia_chi"] = dc,
                ["status"] = "1",
            };
            if (existing != null)
            {
                SaveCustomer(Convert.ToString(existing["id"]), fields);
                upd++;
            }
            else
            {
                SaveCustomer(null, fields);
                ins++;
            }
        }
        return (ins, upd, skip);
    }
}
