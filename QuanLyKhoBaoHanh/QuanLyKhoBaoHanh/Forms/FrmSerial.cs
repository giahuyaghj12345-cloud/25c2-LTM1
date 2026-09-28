using System.Data;
using Microsoft.Data.SqlClient;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmSerial : UserControl
{
    readonly DataGridView gridPx = new();
    readonly DataGridView gridSerial = new();
    readonly Label lblInfo = new() { AutoSize = false, Height = 70, Dock = DockStyle.Top, Padding = new Padding(8) };
    readonly System.Windows.Forms.Timer beat = new() { Interval = 20000 };
    Guid? voucherId;
    bool hasLock;

    public FrmSerial()
    {
        Text = "3. Tạo số Serial";
        BackColor = Ui.Bg;

        var bar = Ui.Toolbar();
        var bChon = Ui.Ghost("Chọn phiếu xuất kho"); bChon.Click += (_, _) => LoadVouchers(); bar.Controls.Add(bChon);
        var bTao = Ui.Primary("Tạo số serial"); bTao.Click += (_, _) => CreateSerials(); bar.Controls.Add(bTao);
        var bXong = Ui.Primary("Hoàn tất"); bXong.Click += (_, _) => Complete(); bar.Controls.Add(bXong);

        lblInfo.AutoSize = false;
        lblInfo.Height = 48;
        lblInfo.Dock = DockStyle.Top;
        lblInfo.Padding = new Padding(12, 10, 12, 10);
        lblInfo.BackColor = Ui.BrandSoft;
        lblInfo.ForeColor = Ui.BrandDark;

        gridPx.Dock = DockStyle.Top;
        gridPx.Height = 220;
        gridPx.ReadOnly = true;
        gridPx.CellClick += (_, e) => { if (e.RowIndex >= 0) Pick(); };
        Ui.StyleGrid(gridPx);

        gridSerial.Dock = DockStyle.Fill;
        gridSerial.ReadOnly = true;
        Ui.StyleGrid(gridSerial);
        gridSerial.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

        Controls.Add(gridSerial);
        Controls.Add(gridPx);
        Controls.Add(lblInfo);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Tạo số Serial", "Chọn phiếu xuất → tạo serial → hoàn tất để khóa phiếu"));

        if (!Session.SerialAllowed)
        {
            lblInfo.Text = "Bạn không được phân quyền tạo số Serial.";
            return;
        }
        beat.Tick += (_, _) => Heartbeat();
        AcquireLock();
        if (hasLock)
        {
            beat.Start();
            LoadVouchers();
        }
    }

    static Button B(string t, EventHandler h)
    {
        var b = new Button { Text = t, AutoSize = true };
        b.Click += h;
        return b;
    }

    void AcquireLock()
    {
        try
        {
            SqlDb.Execute(@"UPDATE dbo.serial_feature_lock SET userId=@id, username=@u, heartbeatAt=GETDATE()
                WHERE lockKey=N'create-serial' AND (userId IS NULL OR userId=@id OR heartbeatAt IS NULL OR DATEDIFF(SECOND, heartbeatAt, GETDATE())>60)",
                SqlDb.P("@id", Session.UserId), SqlDb.P("@u", Session.Username));
            var dt = SqlDb.Query("SELECT userId, username FROM dbo.serial_feature_lock WHERE lockKey=N'create-serial'");
            if (dt.Rows.Count == 0)
            {
                hasLock = false;
                lblInfo.Text = "Chưa có bảng khóa Serial. Hãy chạy backend một lần để tạo schema.";
                return;
            }
            var uid = dt.Rows[0]["userId"];
            hasLock = uid != DBNull.Value && (Guid)uid == Session.UserId;
            if (!hasLock)
                lblInfo.Text = $"Người dùng {dt.Rows[0]["username"]} đang sử dụng tính năng tạo số Serial. Vui lòng thử lại sau.";
            else
                lblInfo.Text = "Đã chiếm quyền tạo Serial. Chọn phiếu xuất kho bên dưới.";
        }
        catch (Exception ex)
        {
            hasLock = false;
            lblInfo.Text = "Không khóa được tính năng Serial: " + ex.Message;
        }
    }

    void Heartbeat()
    {
        if (!hasLock) return;
        try
        {
            SqlDb.Execute(
                "UPDATE dbo.serial_feature_lock SET heartbeatAt=GETDATE() WHERE lockKey=N'create-serial' AND userId=@id",
                SqlDb.P("@id", Session.UserId));
            var dt = SqlDb.Query("SELECT userId FROM dbo.serial_feature_lock WHERE lockKey=N'create-serial'");
            if (dt.Rows.Count == 0 || dt.Rows[0]["userId"] is not Guid uid || uid != Session.UserId)
            {
                hasLock = false;
                beat.Stop();
                lblInfo.Text = "Mất quyền sử dụng tính năng tạo Serial. Thử lại.";
            }
        }
        catch
        {
            /* ignore */
        }
    }

    void ReleaseLock()
    {
        if (!hasLock) return;
        try
        {
            SqlDb.Execute("UPDATE dbo.serial_feature_lock SET userId=NULL, username=NULL, heartbeatAt=NULL WHERE lockKey=N'create-serial' AND userId=@id",
                SqlDb.P("@id", Session.UserId));
        }
        catch { /* ignore */ }
    }

    void LoadVouchers()
    {
        if (!hasLock) { AcquireLock(); if (!hasLock) return; }
        gridPx.DataSource = SqlDb.Query(@"SELECT id, number AS [Số phiếu], date AS [Ngày], customerCode AS [Mã KH], customerName AS [Tên KH],
            CASE kind WHEN 'warranty_parts' THEN N'Phụ tùng BH' ELSE N'Xuất bán' END AS [Loại],
            CASE WHEN serialCreated=1 THEN N'Đã tạo Serial' ELSE N'Chưa tạo Serial' END AS [TT Serial]
            FROM dbo.stock_outs
            WHERE ISNULL(serialLocked,0)=0 AND ISNULL(kind,'sale') IN ('sale','warranty_parts')
            ORDER BY date DESC");
        if (gridPx.Columns.Contains("id")) gridPx.Columns["id"]!.Visible = false;
    }

    void Pick()
    {
        if (gridPx.CurrentRow == null) return;
        voucherId = (Guid)gridPx.CurrentRow.Cells["id"].Value;
        var h = SqlDb.Query("SELECT * FROM dbo.stock_outs WHERE id=@id", SqlDb.P("@id", voucherId));
        var r = h.Rows[0];
        lblInfo.Text = $"Phiếu {r["number"]}  |  KH: {r["customerCode"]} {r["customerName"]}\r\nĐịa chỉ: {r["customerAddress"]}  |  SĐT: {r["customerPhone"]}  |  Đơn hàng: {r["orderNumber"]}";
        gridSerial.DataSource = SqlDb.Query(@"SELECT so_serial AS [Số serial], ma_sp AS [Mã SP], ngay_bh_tu AS [BH từ], ngay_bh_den AS [BH đến],
            thoi_gian_bh AS [Thời gian BH], createdBy AS [Người tạo], createdAt AS [Thời gian tạo]
            FROM dbo.dm_serial WHERE stockOutId=@id ORDER BY so_serial", SqlDb.P("@id", voucherId));
    }

    static string Three(string raw)
    {
        var s = new string((raw ?? "").Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        if (s.Length >= 3) return s[..3];
        return s.PadRight(3, 'X');
    }

    void CreateSerials()
    {
        if (!hasLock || voucherId == null) { MessageBox.Show("Chọn phiếu xuất kho trước."); return; }
        try
        {
            var h = SqlDb.Query("SELECT * FROM dbo.stock_outs WHERE id=@id", SqlDb.P("@id", voucherId));
            var vh = h.Rows[0];
            if (ToBool(vh["serialCreated"])) { MessageBox.Show("Phiếu này đã tạo Serial."); return; }
            if (string.IsNullOrWhiteSpace(Convert.ToString(vh["customerCode"]))) { MessageBox.Show("Phiếu chưa có mã khách."); return; }

            var lines = SqlDb.Query(@"SELECT l.id, l.quantity, l.unit, l.warehouseCode, l.lotCode, l.batchNo, p.ma_sp, p.ten_sp, p.nh_vt1, p.dvt
                FROM dbo.stock_out_lines l LEFT JOIN dbo.dmsp p ON p.id=l.materialId WHERE l.stockOutId=@id", SqlDb.P("@id", voucherId));
            if (lines.Rows.Count == 0) { MessageBox.Show("Phiếu không có dòng sản phẩm."); return; }

            var now = DateTime.Now;
            var prefix = $"{now:HH}{now:dd}{now:MM}{now:yy}";
            var ym = now.ToString("yyyyMM");
            var kh = Three(Convert.ToString(vh["customerCode"]) ?? "");
            var dealer = Convert.ToString(vh["customerGroup"]) != "retail";
            var bhTu = now.Date;
            var bhDen = dealer ? bhTu.AddYears(2).AddMonths(3).AddDays(-1) : bhTu.AddYears(2).AddDays(-1);
            var noteBh = dealer ? "2 năm 3 tháng" : "2 năm";

            using var conn = SqlDb.Open();
            using var tran = conn.BeginTransaction();
            int lastNo;
            using (var sel = new SqlCommand("SELECT lastNo FROM dbo.serial_month_seq WITH (UPDLOCK, HOLDLOCK) WHERE ym=@ym", conn, tran))
            {
                sel.Parameters.AddWithValue("@ym", ym);
                lastNo = Convert.ToInt32(sel.ExecuteScalar() ?? 0);
            }
            if (lastNo == 0)
            {
                using var insSeq = new SqlCommand("IF NOT EXISTS (SELECT 1 FROM dbo.serial_month_seq WHERE ym=@ym) INSERT INTO dbo.serial_month_seq(ym,lastNo) VALUES(@ym,0)", conn, tran);
                insSeq.Parameters.AddWithValue("@ym", ym);
                insSeq.ExecuteNonQuery();
            }
            foreach (DataRow line in lines.Rows)
            {
                var group = Convert.ToString(line["nh_vt1"]);
                if (string.IsNullOrWhiteSpace(group))
                    throw new Exception("Sản phẩm " + line["ma_sp"] + " chưa có mã nhóm.\nVào Danh mục sản phẩm → Sửa " + line["ma_sp"] + " → điền Nhóm SP (3 ký tự), rồi tạo Serial lại.");
                var g3 = Three(group);
                var qty = (int)Math.Floor(Convert.ToDecimal(line["quantity"]));
                for (var i = 0; i < qty; i++)
                {
                    lastNo++;
                    var serial = $"{prefix}-{kh}-{g3}{lastNo:0000}";
                    using var ins = new SqlCommand(@"INSERT INTO dbo.dm_serial
                        (id, so_serial, ma_kh, ten_kh, so_don_hang, ngay_xuat, so_px, stockOutId, stockOutLineId, ma_sp, ten_sp, dvt, nh_sp, ma_kho, ma_lo, so_batch,
                         trang_thai, tinh_trang, ghi_chu, ngay_bh_tu, ngay_bh_den, thoi_gian_bh, createdAt, createdBy)
                        VALUES (NEWID(), @s, @makh, @tenkh, @odh, @nx, @spx, @hid, @lid, @masp, @tensp, @dvt, @nh, @kho, @lo, @batch,
                         N'Mới tạo', N'Mới tạo', @note, @tu, @den, @note, GETDATE(), @by)", conn, tran);
                    ins.Parameters.AddWithValue("@s", serial);
                    ins.Parameters.AddWithValue("@makh", vh["customerCode"]);
                    ins.Parameters.AddWithValue("@tenkh", vh["customerName"] ?? "");
                    ins.Parameters.AddWithValue("@odh", vh["orderNumber"] ?? "");
                    ins.Parameters.AddWithValue("@nx", vh["date"]);
                    ins.Parameters.AddWithValue("@spx", vh["number"]);
                    ins.Parameters.AddWithValue("@hid", voucherId);
                    ins.Parameters.AddWithValue("@lid", line["id"]);
                    ins.Parameters.AddWithValue("@masp", line["ma_sp"] ?? "");
                    ins.Parameters.AddWithValue("@tensp", line["ten_sp"] ?? "");
                    ins.Parameters.AddWithValue("@dvt", line["dvt"] ?? line["unit"] ?? "");
                    ins.Parameters.AddWithValue("@nh", group);
                    ins.Parameters.AddWithValue("@kho", line["warehouseCode"] ?? "");
                    ins.Parameters.AddWithValue("@lo", line["lotCode"] ?? "");
                    ins.Parameters.AddWithValue("@batch", line["batchNo"] ?? "");
                    ins.Parameters.AddWithValue("@note", noteBh);
                    ins.Parameters.AddWithValue("@tu", bhTu);
                    ins.Parameters.AddWithValue("@den", bhDen);
                    ins.Parameters.AddWithValue("@by", Session.Username);
                    ins.ExecuteNonQuery();
                }
            }
            using (var upd = new SqlCommand("UPDATE dbo.serial_month_seq SET lastNo=@n WHERE ym=@ym", conn, tran))
            {
                upd.Parameters.AddWithValue("@n", lastNo);
                upd.Parameters.AddWithValue("@ym", ym);
                upd.ExecuteNonQuery();
            }
            using (var flag = new SqlCommand("UPDATE dbo.stock_outs SET serialCreated=1, updatedAt=GETDATE() WHERE id=@id", conn, tran))
            {
                flag.Parameters.AddWithValue("@id", voucherId);
                flag.ExecuteNonQuery();
            }
            tran.Commit();
            Pick();
            LoadVouchers();
            MessageBox.Show("Đã tạo số Serial.");
        }
        catch (Exception ex)
        {
            MessageBox.Show("Không tạo được Serial: " + ex.Message);
        }
    }

    void Complete()
    {
        if (!hasLock || voucherId == null) return;
        SqlDb.Execute(@"UPDATE dbo.stock_outs SET serialLocked=1, status=N'locked', updatedAt=GETDATE() WHERE id=@id AND serialCreated=1",
            SqlDb.P("@id", voucherId));
        SqlDb.Execute("UPDATE dbo.dm_serial SET trang_thai=N'Đã hoàn tất', tinh_trang=N'Đã hoàn tất', changedAt=GETDATE(), changedBy=@u WHERE stockOutId=@id",
            SqlDb.P("@u", Session.Username), SqlDb.P("@id", voucherId));
        Pick();
        LoadVouchers();
        MessageBox.Show("Đã hoàn tất. Phiếu bị khóa.");
    }

    static bool ToBool(object v) => v != DBNull.Value && Convert.ToBoolean(v);

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            beat.Stop();
            beat.Dispose();
            ReleaseLock();
        }
        base.Dispose(disposing);
    }
}
