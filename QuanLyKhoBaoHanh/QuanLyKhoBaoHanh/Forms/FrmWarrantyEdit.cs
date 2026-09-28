using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmWarrantyEdit : Form
{
    readonly Guid? editingId;
    readonly RoundBox txtSo = new() { ReadOnly = true };
    readonly DateTimePicker dtNgay = new() { Format = DateTimePickerFormat.Short };
    readonly ComboBox cboStatus = new() { DropDownStyle = ComboBoxStyle.DropDownList };
    readonly LookupBox txtMaKh = new("Gõ mã hoặc tên khách...");
    readonly RoundBox txtTenKh = new();
    readonly RoundBox txtDt = new();
    readonly RoundBox txtDc = new();
    readonly RoundBox txtEmail = new();
    readonly LookupBox txtSerial = new("Gõ số serial...");
    readonly LookupBox txtMaSp = new("Gõ mã sản phẩm...");
    readonly RoundBox txtTenSp = new();
    readonly RoundBox txtHangXe = new();
    readonly RoundBox txtTenXe = new();
    readonly RoundBox txtNam = new();
    readonly RoundBox txtOdo = new();
    readonly RoundBox txtBien = new();
    readonly RoundBox txtYc = new();
    readonly RoundBox txtTv = new();
    readonly RoundBox txtTt = new();
    readonly DateTimePicker dtHen = new() { Format = DateTimePickerFormat.Short, ShowCheckBox = true, Checked = false };
    readonly RoundBox txtGc = new();
    readonly DataGridView grid = new();
    readonly DataTable ct = WarrantyDb.EmptyCt();
    readonly Label lblTong = new() { AutoSize = true, Font = new Font("Segoe UI", 10, FontStyle.Bold), ForeColor = Ui.BrandDark };
    readonly Label lblErr = new() { ForeColor = Ui.Danger, AutoSize = false, Height = 22, Dock = DockStyle.Bottom, Padding = new Padding(12, 2, 8, 0) };

    public FrmWarrantyEdit(Guid? id = null)
    {
        editingId = id;
        Text = id == null ? "Phiếu bảo hành mới" : "Sửa phiếu bảo hành";
        FormBorderStyle = FormBorderStyle.Sizable;
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Size = new Size(1080, 760);
        MinimumSize = new Size(920, 640);
        Font = Ui.Body;
        BackColor = Ui.Bg;

        cboStatus.Items.AddRange([
            "nhap — Nháp", "xac_nhan — Đã xác nhận", "dang_sua — Đang sửa",
            "cho_pt — Chờ phụ tùng", "hoan_tat — Hoàn tất sửa", "da_giao — Đã giao khách", "huy — Hủy"]);
        cboStatus.SelectedIndex = 0;
        txtSo.Text = WarrantyDb.NextSo("BH");

        txtMaKh.Bind(WarrantyUi.Customers());
        txtMaKh.Picked += (_, _) => ApplyKh();
        txtSerial.Bind(WarrantyUi.Serials());
        txtSerial.Picked += (_, _) => ApplySerial();
        txtMaSp.Bind(WarrantyUi.Products());
        txtMaSp.Picked += (_, _) => ApplySp();

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 4, Padding = new Padding(12, 8, 12, 4) };
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 210));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 170));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 40));

        root.Controls.Add(BuildHead(), 0, 0);
        root.Controls.Add(BuildReq(), 0, 1);
        root.Controls.Add(BuildLines(), 0, 2);
        root.Controls.Add(lblTong, 0, 3);
        Controls.Add(root);
        Controls.Add(lblErr);

        var luu = Ui.Primary("Lưu");
        luu.Click += (_, _) => Save();
        var dong = Ui.Ghost("Đóng");
        dong.Click += (_, _) => Close();
        Controls.Add(Ui.DialogFooter(luu, dong));

        if (id != null) LoadExisting(id.Value);
        Recalc();
    }

    Panel BuildHead()
    {
        var box = Ui.RoundCard("Thông tin phiếu / khách / máy");
        var t = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 4, Padding = new Padding(8, 4, 8, 4) };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 100));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 100));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Pair(t, "Số phiếu", txtSo, "Ngày", dtNgay);
        Pair(t, "Trạng thái", cboStatus, "Serial", txtSerial);
        Pair(t, "Mã khách", txtMaKh, "Tên khách", txtTenKh);
        Pair(t, "Điện thoại", txtDt, "Email", txtEmail);
        Full(t, "Địa chỉ", txtDc);
        Pair(t, "Mã SP", txtMaSp, "Tên SP", txtTenSp);
        return box.With(t);
    }

    Panel BuildReq()
    {
        var box = Ui.RoundCard("Xe / yêu cầu / tư vấn");
        var t = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 4, Padding = new Padding(8, 4, 8, 4) };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 100));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 100));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        Pair(t, "Hãng xe", txtHangXe, "Tên xe", txtTenXe);
        Pair(t, "Năm SX", txtNam, "Odo", txtOdo);
        Pair(t, "Biển số", txtBien, "Hẹn trả", dtHen);
        Full(t, "Yêu cầu KH", txtYc);
        Full(t, "Tư vấn", txtTv);
        Pair(t, "TT sản phẩm", txtTt, "Ghi chú", txtGc);
        return box.With(t);
    }

    Panel BuildLines()
    {
        var box = Ui.RoundCard("Phụ tùng / tiền công");
        var mid = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 2 };
        mid.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
        mid.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var bar = new FlowLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(8, 6, 8, 2) };
        var pt = Ui.Ghost("Thêm phụ tùng");
        pt.Click += (_, _) => AddLine("pt");
        var tc = Ui.Ghost("Thêm tiền công");
        tc.Click += (_, _) => AddLine("tc");
        var xoa = Ui.Ghost("Xóa dòng", true);
        xoa.Click += (_, _) =>
        {
            if (grid.CurrentRow != null && !grid.CurrentRow.IsNewRow)
                grid.Rows.Remove(grid.CurrentRow);
            Recalc();
        };
        bar.Controls.Add(pt);
        bar.Controls.Add(tc);
        bar.Controls.Add(xoa);
        mid.Controls.Add(bar, 0, 0);

        grid.Dock = DockStyle.Fill;
        grid.AutoGenerateColumns = false;
        grid.AllowUserToAddRows = true;
        grid.DataSource = ct;
        grid.Columns.Add(new DataGridViewComboBoxColumn
        {
            HeaderText = "Loại", DataPropertyName = "loai", Name = "loai", Width = 90,
            DataSource = new[] { "pt", "tc" },
        });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã", DataPropertyName = "ma", Name = "ma", Width = 120 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Tên", DataPropertyName = "ten", Name = "ten", Width = 240 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "ĐVT", DataPropertyName = "dvt", Name = "dvt", Width = 60 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "SL", DataPropertyName = "so_luong", Name = "so_luong", Width = 70 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Giá", DataPropertyName = "gia", Name = "gia", Width = 90 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Tiền", DataPropertyName = "tien", Name = "tien", Width = 100, ReadOnly = true });
        grid.CellEndEdit += (_, _) => Recalc();
        Ui.StyleGrid(grid);
        mid.Controls.Add(grid, 0, 1);
        return box.With(mid);
    }

    void AddLine(string loai)
    {
        var r = ct.NewRow();
        r["loai"] = loai;
        r["ma"] = "";
        r["ten"] = loai == "tc" ? "Tiền công" : "";
        r["dvt"] = loai == "tc" ? "Lần" : "Cái";
        r["so_luong"] = 1m;
        r["gia"] = 0m;
        r["tien"] = 0m;
        ct.Rows.Add(r);
        var ix = ct.Rows.Count - 1;
        if (ix >= 0 && ix < grid.Rows.Count && grid.Columns.Contains("ma"))
            grid.CurrentCell = grid.Rows[ix].Cells["ma"];
    }

    void ApplyKh()
    {
        var kh = CatalogDb.FindCustomer(txtMaKh.Code);
        if (kh == null) return;
        txtMaKh.Text = Convert.ToString(kh["ma_kh"]) ?? "";
        txtTenKh.Text = Convert.ToString(kh["ten_kh"]) ?? "";
        txtDt.Text = Convert.ToString(kh["dien_thoai"]) ?? "";
        txtDc.Text = Convert.ToString(kh["dia_chi"]) ?? "";
        if (kh.Table.Columns.Contains("email"))
            txtEmail.Text = Convert.ToString(kh["email"]) ?? "";
    }

    void ApplySerial()
    {
        var row = WarrantyDb.FindSerial(txtSerial.Code);
        if (row == null) return;
        txtSerial.Text = Convert.ToString(row["so_serial"]) ?? "";
        txtMaSp.Text = Convert.ToString(row["ma_sp"]) ?? "";
        txtTenSp.Text = Convert.ToString(row["ten_sp"]) ?? "";
        if (row.Table.Columns.Contains("ma_kh") && txtMaKh.Text.Length == 0)
        {
            txtMaKh.Text = Convert.ToString(row["ma_kh"]) ?? "";
            ApplyKh();
            if (string.IsNullOrWhiteSpace(txtTenKh.Text))
                txtTenKh.Text = Convert.ToString(row["ten_kh"]) ?? "";
        }
        var tu = row.Table.Columns.Contains("ngay_bh_tu") ? row["ngay_bh_tu"] : null;
        var den = row.Table.Columns.Contains("ngay_bh_den") ? row["ngay_bh_den"] : null;
        if (tu != null && tu != DBNull.Value && den != null && den != DBNull.Value)
            txtTt.Text = $"BH {Convert.ToDateTime(tu):dd/MM/yyyy} → {Convert.ToDateTime(den):dd/MM/yyyy}";
    }

    void ApplySp()
    {
        var p = WarrantyDb.FindProduct(txtMaSp.Code);
        if (p == null) return;
        txtMaSp.Text = Convert.ToString(p["ma_sp"]) ?? "";
        txtTenSp.Text = Convert.ToString(p["ten_sp"]) ?? "";
    }

    void LoadExisting(Guid id)
    {
        var h = WarrantyDb.GetPhieu(id);
        if (h == null) return;
        txtSo.Text = Convert.ToString(h["so_ct"]) ?? "";
        dtNgay.Value = h["ngay_ct"] is DateTime d ? d : DateTime.Today;
        SelectStatus(Convert.ToString(h["status"]));
        txtMaKh.Text = Convert.ToString(h["ma_kh"]) ?? "";
        txtTenKh.Text = Convert.ToString(h["ten_kh"]) ?? "";
        txtDt.Text = Convert.ToString(h["dien_thoai"]) ?? "";
        txtDc.Text = Convert.ToString(h["dia_chi"]) ?? "";
        txtEmail.Text = Convert.ToString(h["email"]) ?? "";
        txtSerial.Text = Convert.ToString(h["so_serial"]) ?? "";
        txtMaSp.Text = Convert.ToString(h["ma_sp"]) ?? "";
        txtTenSp.Text = Convert.ToString(h["ten_sp"]) ?? "";
        txtHangXe.Text = Convert.ToString(h["hang_xe"]) ?? "";
        txtTenXe.Text = Convert.ToString(h["ten_xe"]) ?? "";
        txtNam.Text = Convert.ToString(h["nam_sx"]) ?? "";
        txtOdo.Text = Convert.ToString(h["odo"]) ?? "";
        txtBien.Text = Convert.ToString(h["bien_so"]) ?? "";
        txtYc.Text = Convert.ToString(h["yeu_cau"]) ?? "";
        txtTv.Text = Convert.ToString(h["tu_van"]) ?? "";
        txtTt.Text = Convert.ToString(h["tt_sp"]) ?? "";
        txtGc.Text = Convert.ToString(h["ghi_chu"]) ?? "";
        if (h["ngay_hen"] is DateTime hen)
        {
            dtHen.Checked = true;
            dtHen.Value = hen;
        }
        ct.Rows.Clear();
        foreach (DataRow r in WarrantyDb.GetPhieuCt(id).Rows)
        {
            var n = ct.NewRow();
            n["loai"] = r["loai"];
            n["ma"] = r["ma"];
            n["ten"] = r["ten"];
            n["dvt"] = r["dvt"];
            n["so_luong"] = r["so_luong"];
            n["gia"] = r["gia"];
            n["tien"] = r["tien"];
            ct.Rows.Add(n);
        }
    }

    void SelectStatus(string? s)
    {
        var key = (s ?? "nhap") + " —";
        for (var i = 0; i < cboStatus.Items.Count; i++)
            if (Convert.ToString(cboStatus.Items[i])?.StartsWith(key, StringComparison.Ordinal) == true)
            {
                cboStatus.SelectedIndex = i;
                return;
            }
        cboStatus.SelectedIndex = 0;
    }

    string StatusCode()
    {
        var t = Convert.ToString(cboStatus.SelectedItem) ?? "nhap";
        var i = t.IndexOf(' ');
        return i > 0 ? t[..i] : t;
    }

    void Recalc()
    {
        grid.EndEdit();
        decimal tong = 0;
        foreach (DataRow r in ct.Rows)
        {
            if (r.RowState == DataRowState.Deleted) continue;
            var ma = Convert.ToString(r["ma"])?.Trim();
            if (string.IsNullOrEmpty(r["ten"]?.ToString()) && !string.IsNullOrEmpty(ma))
            {
                if (Convert.ToString(r["loai"]) == "tc")
                {
                    var lb = WarrantyDb.FindLabor(ma);
                    if (lb != null)
                    {
                        r["ten"] = lb["name"];
                        r["gia"] = lb["amount"];
                    }
                }
                else
                {
                    var p = WarrantyDb.FindProduct(ma);
                    if (p != null)
                    {
                        r["ten"] = p["ten_sp"];
                        r["dvt"] = p["dvt"];
                    }
                }
            }
            var sl = ToDec(r["so_luong"]);
            var gia = ToDec(r["gia"]);
            r["tien"] = sl * gia;
            tong += sl * gia;
        }
        lblTong.Text = "Tổng tiền phụ tùng + công: " + tong.ToString("N0");
    }

    void Save()
    {
        lblErr.Text = "";
        if (string.IsNullOrWhiteSpace(txtSerial.Text) && string.IsNullOrWhiteSpace(txtMaKh.Text))
        {
            lblErr.Text = "Nhập mã khách hoặc số serial.";
            return;
        }
        Recalc();
        try
        {
            var h = new Dictionary<string, object?>
            {
                ["so_ct"] = string.IsNullOrWhiteSpace(txtSo.Text) ? WarrantyDb.NextSo("BH") : txtSo.Text.Trim(),
                ["ngay_ct"] = dtNgay.Value.Date,
                ["status"] = StatusCode(),
                ["ma_kh"] = txtMaKh.Code,
                ["ten_kh"] = txtTenKh.Text.Trim(),
                ["dien_thoai"] = txtDt.Text.Trim(),
                ["dia_chi"] = txtDc.Text.Trim(),
                ["email"] = txtEmail.Text.Trim(),
                ["so_serial"] = txtSerial.Code.Length > 0 ? txtSerial.Code : txtSerial.Text.Trim(),
                ["ma_sp"] = txtMaSp.Code.Length > 0 ? txtMaSp.Code : txtMaSp.Text.Trim(),
                ["ten_sp"] = txtTenSp.Text.Trim(),
                ["hang_xe"] = txtHangXe.Text.Trim(),
                ["ten_xe"] = txtTenXe.Text.Trim(),
                ["nam_sx"] = txtNam.Text.Trim(),
                ["odo"] = txtOdo.Text.Trim(),
                ["bien_so"] = txtBien.Text.Trim(),
                ["yeu_cau"] = txtYc.Text.Trim(),
                ["tu_van"] = txtTv.Text.Trim(),
                ["tt_sp"] = txtTt.Text.Trim(),
                ["ngay_hen"] = dtHen.Checked ? dtHen.Value.Date : null,
                ["ghi_chu"] = txtGc.Text.Trim(),
            };
            WarrantyDb.SavePhieu(editingId, h, ct);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            lblErr.Text = ex.Message;
        }
    }

    static decimal ToDec(object? v)
    {
        decimal.TryParse(Convert.ToString(v), out var n);
        return n;
    }

    static void Pair(TableLayoutPanel t, string l1, Control c1, string l2, Control c2)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
        t.Controls.Add(new Label { Text = l1, AutoSize = true, Anchor = AnchorStyles.Left, ForeColor = Ui.Muted }, 0, r);
        c1.Dock = DockStyle.Fill;
        t.Controls.Add(c1, 1, r);
        t.Controls.Add(new Label { Text = l2, AutoSize = true, Anchor = AnchorStyles.Left, ForeColor = Ui.Muted }, 2, r);
        c2.Dock = DockStyle.Fill;
        t.Controls.Add(c2, 3, r);
    }

    static void Full(TableLayoutPanel t, string label, Control c)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
        t.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left, ForeColor = Ui.Muted }, 0, r);
        c.Dock = DockStyle.Fill;
        t.SetColumnSpan(c, 3);
        t.Controls.Add(c, 1, r);
    }
}

static class PanelExt
{
    public static Panel With(this Panel box, Control inner)
    {
        inner.Dock = DockStyle.Fill;
        box.Controls.Add(inner);
        return box;
    }
}
