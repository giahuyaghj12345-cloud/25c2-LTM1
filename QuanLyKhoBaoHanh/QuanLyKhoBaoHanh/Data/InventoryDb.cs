using System.Data;
using Microsoft.Data.SqlClient;

namespace QuanLyKhoBaoHanh.Data;

/// <summary>
/// Tồn kho đơn giản kiểu đồ án (1 số lượng / mã SP), bám ý GGV:
/// xuất bán / xuất PT BH trừ tồn; nhập sau BH cộng tồn.
/// </summary>
static class InventoryDb
{
    static bool ensured;

    public static void Ensure()
    {
        if (ensured) return;
        CatalogDb.EnsureProduct();
        SqlDb.Execute(@"
IF COL_LENGTH(N'dbo.dmsp', N'sl_ton') IS NULL
  ALTER TABLE dbo.dmsp ADD sl_ton DECIMAL(18,4) NOT NULL CONSTRAINT DF_dmsp_sl_ton DEFAULT(0);
IF COL_LENGTH(N'dbo.dmsp', N'vt_ton_kho') IS NULL
  ALTER TABLE dbo.dmsp ADD vt_ton_kho BIT NULL;");
        ensured = true;
    }

    public static DataTable ListStock()
    {
        Ensure();
        return SqlDb.Query(@"
SELECT CONVERT(nvarchar(50), id) AS id,
       ma_sp AS [Mã SP],
       ten_sp AS [Tên SP],
       ISNULL(dvt, N'') AS [ĐVT],
       ISNULL(nh_vt1, N'') AS [Nhóm],
       ISNULL(sl_ton, 0) AS [Tồn],
       ISNULL(sl_min, 0) AS [SL min],
       ISNULL(sl_max, 0) AS [SL max],
       CASE WHEN ISNULL(CONVERT(int, vt_ton_kho), 1) = 1 THEN N'Có' ELSE N'Không' END AS [Theo dõi],
       CASE
         WHEN ISNULL(CONVERT(int, vt_ton_kho), 1) = 0 THEN N'—'
         WHEN ISNULL(sl_ton, 0) <= ISNULL(sl_min, 0) AND ISNULL(sl_min, 0) > 0 THEN N'Thiếu'
         WHEN ISNULL(sl_max, 0) > 0 AND ISNULL(sl_ton, 0) >= ISNULL(sl_max, 0) THEN N'Dư'
         ELSE N'OK'
       END AS [Cảnh báo]
FROM dbo.dmsp
WHERE ISNULL(CONVERT(int, vt_ton_kho), 1) = 1
ORDER BY ma_sp");
    }

    public static decimal GetTon(string maSp)
    {
        Ensure();
        var ma = (maSp ?? "").Trim();
        if (ma.Length == 0) return 0m;
        var v = SqlDb.Scalar("SELECT ISNULL(sl_ton, 0) FROM dbo.dmsp WHERE ma_sp=@c", SqlDb.P("@c", ma));
        return v == null || v == DBNull.Value ? 0m : Convert.ToDecimal(v);
    }

    public static bool TracksStock(string maSp)
    {
        Ensure();
        var ma = (maSp ?? "").Trim();
        if (ma.Length == 0) return false;
        var v = SqlDb.Scalar(
            "SELECT ISNULL(CONVERT(int, vt_ton_kho), 1) FROM dbo.dmsp WHERE ma_sp=@c",
            SqlDb.P("@c", ma));
        return v != null && v != DBNull.Value && Convert.ToInt32(v) == 1;
    }

    /// <summary>delta &lt; 0 = xuất, &gt; 0 = nhập. Kiểm tra âm tồn khi xuất.</summary>
    public static void Adjust(string maSp, decimal delta, SqlConnection? conn = null, SqlTransaction? tran = null)
    {
        Ensure();
        var ma = (maSp ?? "").Trim();
        if (ma.Length == 0 || delta == 0m) return;

        if (conn == null)
        {
            using var c = SqlDb.Open();
            using var t = c.BeginTransaction();
            AdjustCore(ma, delta, c, t);
            t.Commit();
            return;
        }
        AdjustCore(ma, delta, conn, tran);
    }

    static void AdjustCore(string ma, decimal delta, SqlConnection conn, SqlTransaction? tran)
    {
        if (!TracksStockOnConn(ma, conn, tran)) return;

        using var cmd = new SqlCommand(@"
UPDATE dbo.dmsp
SET sl_ton = ISNULL(sl_ton, 0) + @d
WHERE ma_sp = @c
  AND ISNULL(CONVERT(int, vt_ton_kho), 1) = 1
  AND (@d >= 0 OR ISNULL(sl_ton, 0) + @d >= 0);
SELECT @@ROWCOUNT;", conn, tran);
        cmd.Parameters.AddWithValue("@c", ma);
        cmd.Parameters.AddWithValue("@d", delta);
        var n = Convert.ToInt32(cmd.ExecuteScalar());
        if (n == 0)
            throw new InvalidOperationException(
                $"Không đủ tồn kho cho mã {ma} (hiện có {GetTon(ma, conn, tran):0.####}, cần xuất {Math.Abs(delta):0.####}).");
    }

    public static decimal GetTon(string maSp, SqlConnection conn, SqlTransaction? tran)
    {
        var ma = (maSp ?? "").Trim();
        if (ma.Length == 0) return 0m;
        using var cmd = new SqlCommand("SELECT ISNULL(sl_ton,0) FROM dbo.dmsp WHERE ma_sp=@c", conn, tran);
        cmd.Parameters.AddWithValue("@c", ma);
        var v = cmd.ExecuteScalar();
        return v == null || v == DBNull.Value ? 0m : Convert.ToDecimal(v);
    }

    static bool TracksStockOnConn(string ma, SqlConnection conn, SqlTransaction? tran)
    {
        using var cmd = new SqlCommand(
            "SELECT ISNULL(CONVERT(int, vt_ton_kho), 1) FROM dbo.dmsp WHERE ma_sp=@c", conn, tran);
        cmd.Parameters.AddWithValue("@c", ma);
        var v = cmd.ExecuteScalar();
        if (v == null || v == DBNull.Value)
            throw new InvalidOperationException($"Không tìm thấy mã sản phẩm {ma} trong danh mục.");
        return Convert.ToInt32(v) == 1;
    }

    public static void SetOpening(string maSp, decimal qty)
    {
        Ensure();
        SqlDb.Execute(
            "UPDATE dbo.dmsp SET sl_ton=@q WHERE ma_sp=@c",
            SqlDb.P("@q", Math.Max(0m, qty)),
            SqlDb.P("@c", maSp.Trim()));
    }

    public static Dictionary<string, decimal> SumLines(IEnumerable<(string Ma, decimal Sl)> lines)
    {
        var map = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var (ma, sl) in lines)
        {
            var k = (ma ?? "").Trim();
            if (k.Length == 0 || sl == 0m) continue;
            map[k] = map.TryGetValue(k, out var cur) ? cur + sl : sl;
        }
        return map;
    }

    public static void ApplyNet(Dictionary<string, decimal> oldPosted, Dictionary<string, decimal> newPosted,
        SqlConnection conn, SqlTransaction tran)
    {
        // restore old (cộng lại), rồi trừ mới
        foreach (var kv in oldPosted)
            Adjust(kv.Key, kv.Value, conn, tran);
        foreach (var kv in newPosted)
            Adjust(kv.Key, -kv.Value, conn, tran);
    }

    public static void ApplyWarrantyMovement(int maGd, string loaiNx, DataTable ct, bool reverse = false)
    {
        Ensure();
        // GGV: MGD 7 xuất PT; MGD 10 N nhập / X xuất; 8/11 chủ yếu serial — vẫn chạm tồn nếu có mã SP
        int sign = WarrantySign(maGd, loaiNx);
        if (sign == 0) return;
        if (reverse) sign = -sign;

        foreach (DataRow r in ct.Rows)
        {
            if (r.RowState == DataRowState.Deleted) continue;
            var ma = Convert.ToString(r["ma_sp"])?.Trim() ?? "";
            var sl = r["so_luong"] == DBNull.Value ? 0m : Convert.ToDecimal(r["so_luong"]);
            if (ma.Length == 0 || sl <= 0m) continue;
            Adjust(ma, sign * sl);
        }
    }

    static int WarrantySign(int maGd, string loaiNx)
    {
        if (maGd == 7) return -1;
        if (maGd == 10) return string.Equals(loaiNx, "nhap", StringComparison.OrdinalIgnoreCase) ? 1 : -1;
        if (maGd == 8) return -1;
        if (maGd == 11) return 1;
        return 0;
    }
}
