using System.Data;
using Microsoft.Data.SqlClient;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmStockOut : UserControl
{
    readonly RoundBox txtMaGd = new();
    readonly Label lblTenGd = new() { AutoSize = false, TextAlign = ContentAlignment.MiddleLeft };
    readonly LookupBox txtMaKh = new("Gõ mã hoặc tên khách...");
    readonly LookupBox txtMaSp = new("Gõ mã hoặc tên vật tư...");
    readonly Label lblTenKh = new() { AutoSize = false, TextAlign = ContentAlignment.MiddleLeft };
    readonly RoundBox txtDiaChi = new();
    readonly RoundBox txtDiaChiGh = new();
    readonly RoundBox txtNguoiNhan = new();
    readonly RoundBox txtDienGiai = new();
    readonly RoundBox txtSdt = new();
    readonly RoundBox txtNvBan = new();
    readonly RoundBox txtNvGiao = new();
    readonly RoundBox txtStatus = new();
    readonly RoundBox txtTyGia = new() { Text = "1,00" };
    readonly DateTimePicker dtNgay = new() { Format = DateTimePickerFormat.Short };
    readonly DateTimePicker dtHt = new() { Format = DateTimePickerFormat.Short };
    readonly DateTimePicker dtDh = new() { Format = DateTimePickerFormat.Short, ShowCheckBox = true, Checked = false };
    readonly RoundBox txtSoPhieu = new() { ReadOnly = true };
    readonly RoundBox txtQuyen = new() { Text = "PX001" };
    readonly RoundBox txtSoDh = new();
    readonly RoundBox txtGhiChu = new();
    readonly Label lblTongSl = new() { Text = "0", AutoSize = true, ForeColor = Ui.Danger, Font = new Font("Segoe UI", 10, FontStyle.Bold) };
    readonly DataGridView grid = new();
    readonly DataGridView list = new();
    readonly AutoCompleteStringCollection acKh = [];
    readonly AutoCompleteStringCollection acSp = [];
    readonly AutoCompleteStringCollection acNv = [];
    readonly AutoCompleteStringCollection acKho = [];
    readonly AutoCompleteStringCollection acGd = [];
    readonly AutoCompleteStringCollection acSt = [];
    Guid? currentId;
    bool editing = true;
    string customerGroup = "dealer";

    static readonly (string Code, string Name, string Kind)[] GiaoDich =
    [
        ("1", "Xuất bán", "sale"),
        ("2", "Bán phụ tùng bảo hành", "warranty_parts"),
    ];

    public FrmStockOut()
    {
        Text = "Phiếu xuất kho";
        BackColor = Ui.Bg;
        var root = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 5, ColumnCount = 1 };
        root.Padding = new Padding(0, 0, 0, 4);
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 348));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 58));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 56));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 42));

        var bar = Ui.Toolbar();
        bar.Controls.Add(Ui.Primary("Mới"));
        bar.Controls[0].Click += (_, _) => NewVoucher();
        var bSua = Ui.Ghost("Sửa"); bSua.Click += (_, _) => editing = true; bar.Controls.Add(bSua);
        var bLuu = Ui.Primary("Lưu"); bLuu.Click += (_, _) => Save(); bar.Controls.Add(bLuu);
        var bHuy = Ui.Ghost("Hủy"); bHuy.Click += (_, _) => CancelEdit(); bar.Controls.Add(bHuy);
        var bXoa = Ui.Ghost("Xóa", true); bXoa.Click += (_, _) => Delete(); bar.Controls.Add(bXoa);
        root.Controls.Add(bar, 0, 0);

        var head = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, Padding = new Padding(0, 4, 0, 8) };
        head.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 56));
        head.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 44));
        head.Controls.Add(BuildLeft(), 0, 0);
        head.Controls.Add(BuildRight(), 1, 0);
        root.Controls.Add(head, 0, 1);

        var tab = new TabControl { Dock = DockStyle.Fill };
        var page = new TabPage("1. Hạch toán") { BackColor = Ui.Bg };
        var mid = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 2 };
        mid.RowStyles.Add(new RowStyle(SizeType.Absolute, 52));
        mid.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        var lineBar = new FlowLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(10, 8, 10, 4) };
        var chonVt = Ui.Ghost("Chọn v.tư");
        chonVt.Click += (_, _) => PickProduct();
        txtMaSp.Width = 360;
        txtMaSp.Margin = new Padding(0, 2, 0, 0);
        txtMaSp.Picked += (_, _) => AddProductFromBox();
        lineBar.Controls.Add(chonVt);
        lineBar.Controls.Add(new Label
        {
            Text = "Mã SP/vật tư",
            AutoSize = true,
            Padding = new Padding(12, 10, 8, 0),
            ForeColor = Ui.Muted,
        });
        lineBar.Controls.Add(txtMaSp);
        mid.Controls.Add(lineBar, 0, 0);

        BuildGrid();
        mid.Controls.Add(grid, 0, 1);
        page.Controls.Add(mid);
        tab.TabPages.Add(page);
        root.Controls.Add(tab, 0, 2);
        root.Controls.Add(BuildTotal(), 0, 3);

        list.Dock = DockStyle.Fill;
        list.ReadOnly = true;
        list.Margin = new Padding(0, 8, 0, 0);
        list.CellClick += (_, e) => { if (e.RowIndex >= 0) OpenRow(); };
        Ui.StyleGrid(list);
        root.Controls.Add(list, 0, 4);

        Controls.Add(root);
        Controls.Add(Ui.PageHead("Phiếu xuất kho", "Lập phiếu xuất — gõ mã khách / mã SP để hiện gợi ý"));
        try
        {
            EnsureExtra();
            BindSuggest();
            LoadList();
        }
        catch (Exception ex)
        {
            MessageBox.Show("Không tải được phiếu xuất: " + ex.Message);
        }
        NewVoucher();
    }

    Panel BuildLeft()
    {
        var box = Ui.RoundCard("Thông tin chung");
        var t = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 4 };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 108));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 92));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        txtMaGd.Leave += (_, _) => ApplyGiaoDich();
        txtMaKh.Picked += (_, _) => ApplyCustomer(txtMaKh.Text);
        var browse = Ui.Ghost("...");
        browse.MinimumSize = new Size(36, 34);
        browse.Width = 36;
        browse.Dock = DockStyle.Right;
        browse.Margin = new Padding(8, 0, 0, 0);
        browse.Click += (_, _) => PickCustomer();
        var kh = new Panel { Dock = DockStyle.Fill };
        txtMaKh.Dock = DockStyle.Fill;
        kh.Controls.Add(txtMaKh);
        kh.Controls.Add(browse);
        AddFull(t, "Mã giao dịch", CodeName(txtMaGd, lblTenGd));
        AddFull(t, "Mã khách", kh);
        AddFull(t, "Địa chỉ", txtDiaChi);
        AddPair(t, "Ng. nhận", txtNguoiNhan, "Điện thoại", txtSdt);
        AddFull(t, "Diễn giải", txtDienGiai);
        AddPair(t, "NV bán hàng", txtNvBan, "NV giao", txtNvGiao);
        AddFull(t, "Địa chỉ giao", txtDiaChiGh);
        box.Controls.Add(t);
        return box;
    }

    Panel BuildRight()
    {
        var box = Ui.RoundCard("Chứng từ");
        var t = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2 };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 120));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        AddRow(t, "Ngày ht", dtHt);
        AddRow(t, "Ngày lập PX", dtNgay);
        AddRow(t, "Quyển số", txtQuyen);
        AddRow(t, "Số phiếu xuất", txtSoPhieu);
        var fx = new Panel { Dock = DockStyle.Fill };
        var lblVnd = new Label { Text = "VND", Dock = DockStyle.Left, Width = 40, TextAlign = ContentAlignment.MiddleLeft };
        txtTyGia.Dock = DockStyle.Fill;
        fx.Controls.Add(txtTyGia);
        fx.Controls.Add(lblVnd);
        AddRow(t, "Tỷ giá", fx);
        AddRow(t, "Trạng thái", txtStatus);
        AddRow(t, "Ngày đơn hàng", dtDh);
        AddRow(t, "Số đơn hàng", txtSoDh);
        box.Controls.Add(t);
        return box;
    }

    Panel BuildTotal()
    {
        var box = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Ui.Panel,
            Padding = new Padding(12, 10, 12, 8),
            Margin = new Padding(0, 6, 0, 6),
            Tag = "card",
        };
        box.Paint += (_, e) =>
        {
            e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            Ui.RoundFill(e.Graphics, new Rectangle(1, 1, box.Width - 3, box.Height - 3), 10, Ui.Panel, Ui.Line);
        };
        var t = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 5 };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 88));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 70));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 56));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 64));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        t.Controls.Add(new Label { Text = "Tổng cộng", AutoSize = true, Anchor = AnchorStyles.Left, Font = new Font("Segoe UI", 9.5f, FontStyle.Bold), ForeColor = Ui.BrandDark }, 0, 0);
        t.Controls.Add(new Label { Text = "Số lượng", AutoSize = true, Anchor = AnchorStyles.Left, ForeColor = Ui.Muted }, 1, 0);
        t.Controls.Add(lblTongSl, 2, 0);
        t.Controls.Add(new Label { Text = "Ghi chú", AutoSize = true, Anchor = AnchorStyles.Left, ForeColor = Ui.Muted }, 3, 0);
        txtGhiChu.Dock = DockStyle.Fill;
        t.Controls.Add(txtGhiChu, 4, 0);
        box.Controls.Add(t);
        return box;
    }

    void BuildGrid()
    {
        grid.Dock = DockStyle.Fill;
        grid.AutoGenerateColumns = false;
        grid.AllowUserToAddRows = true;
        grid.BackgroundColor = Ui.Panel;
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Stt", Name = "stt", Width = 40, ReadOnly = true });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã SP/vật tư", Name = "ma_sp", Width = 130 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Tên SP/vật tư", Name = "ten_sp", ReadOnly = true, Width = 200 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Đvt", Name = "dvt", Width = 50 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã hs", Name = "ma_hs", Width = 70 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã kho", Name = "ma_kho", Width = 80 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã kệ", Name = "ma_ke", Width = 70 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã lô", Name = "ma_lo", Width = 70 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã batch", Name = "so_batch", Width = 80 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Tồn", Name = "ton", Width = 60, ReadOnly = true });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "SL", Name = "sl", Width = 60 });
        grid.CellEndEdit += Grid_CellEndEdit;
        grid.EditingControlShowing += Grid_EditingControlShowing;
        grid.RowsAdded += (_, _) => NumberRows();
        grid.RowsRemoved += (_, _) => { NumberRows(); SumQty(); };
        Ui.StyleGrid(grid);
        grid.AllowUserToAddRows = true;
    }

    static Panel CodeName(Control code, Label name, Button? browse = null)
    {
        var p = new Panel { Dock = DockStyle.Fill };
        code.Width = 180;
        code.Dock = DockStyle.Left;
        name.Dock = DockStyle.Fill;
        name.ForeColor = Color.FromArgb(70, 70, 70);
        name.Padding = new Padding(8, 0, 4, 0);
        if (browse != null)
        {
            browse.Dock = DockStyle.Right;
            p.Controls.Add(browse);
        }
        p.Controls.Add(name);
        p.Controls.Add(code);
        return p;
    }

    static void AddRow(TableLayoutPanel t, string label, Control c)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
        t.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left }, 0, r);
        c.Dock = DockStyle.Fill;
        t.Controls.Add(c, 1, r);
    }

    static void AddFull(TableLayoutPanel t, string label, Control c)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
        t.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left }, 0, r);
        c.Dock = DockStyle.Fill;
        t.SetColumnSpan(c, 3);
        t.Controls.Add(c, 1, r);
    }

    static void AddPair(TableLayoutPanel t, string l1, Control c1, string l2, Control c2)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
        t.Controls.Add(new Label { Text = l1, AutoSize = true, Anchor = AnchorStyles.Left }, 0, r);
        c1.Dock = DockStyle.Fill;
        t.Controls.Add(c1, 1, r);
        t.Controls.Add(new Label { Text = l2, AutoSize = true, Anchor = AnchorStyles.Left }, 2, r);
        c2.Dock = DockStyle.Fill;
        t.Controls.Add(c2, 3, r);
    }

    void BindSuggest()
    {
        acGd.AddRange(["1", "1 - Xuất bán", "2", "2 - Bán phụ tùng bảo hành"]);
        acSt.AddRange(["Lập chứng từ", "Đã ghi sổ cái"]);

        try
        {
            acKh.Clear();
            foreach (string s in Ui.SuggestSource(CatalogDb.ListCustomerCodes(), "ma_kh", "ten_kh"))
                acKh.Add(s);
            txtMaKh.Bind(acKh);
        }
        catch { /* chưa có dmkh */ }

        FillProductSuggest();
        txtMaSp.Bind(acSp);
        FillStaffSuggest();
        FillKhoSuggest();
    }

    void FillProductSuggest()
    {
        try
        {
            var dt = SqlDb.Query("SELECT ma_sp, ten_sp FROM dbo.dmsp");
            acSp.Clear();
            foreach (string s in Ui.SuggestSource(dt, "ma_sp", "ten_sp"))
                acSp.Add(s);
        }
        catch { /* */ }
    }

    void FillStaffSuggest()
    {
        try
        {
            var dt = SqlDb.Query("SELECT username, ISNULL(email,N'') AS email FROM dbo.users");
            acNv.Clear();
            foreach (string s in Ui.SuggestSource(dt, "username", "email"))
                acNv.Add(s);
        }
        catch { /* */ }
    }

    void FillKhoSuggest()
    {
        acKho.Clear();
        acKho.Add("KHO1");
        try
        {
            var dt = SqlDb.Query("SELECT DISTINCT warehouseCode FROM dbo.stock_out_lines WHERE ISNULL(warehouseCode,N'')<>N''");
            foreach (DataRow row in dt.Rows)
            {
                var v = Convert.ToString(row[0]) ?? "";
                if (v.Length > 0 && !acKho.Contains(v)) acKho.Add(v);
            }
        }
        catch { /* */ }
    }

    void ApplyGiaoDich()
    {
        var code = Ui.SuggestCode(txtMaGd.Text);
        txtMaGd.Text = code;
        var hit = GiaoDich.FirstOrDefault(x => x.Code == code);
        lblTenGd.Text = hit.Name ?? "";
    }

    void ApplyCustomer(string? ma)
    {
        var code = Ui.SuggestCode(ma);
        if (string.IsNullOrWhiteSpace(code)) return;
        var row = CatalogDb.FindCustomer(code);
        if (row == null) return;
        var ten = Convert.ToString(row["ten_kh"]);
        txtMaKh.Text = string.IsNullOrWhiteSpace(ten) ? Convert.ToString(row["ma_kh"]) : row["ma_kh"] + " - " + ten;
        lblTenKh.Text = ten;
        txtDiaChi.Text = Convert.ToString(row["dia_chi"]);
        var gh = row.Table.Columns.Contains("dia_chi_gh") ? Convert.ToString(row["dia_chi_gh"]) : "";
        txtDiaChiGh.Text = string.IsNullOrWhiteSpace(gh) ? txtDiaChi.Text : gh;
        txtSdt.Text = Convert.ToString(row["dien_thoai"]);
        if (string.IsNullOrWhiteSpace(txtNguoiNhan.Text))
            txtNguoiNhan.Text = Convert.ToString(row["ten_kh"]);
        customerGroup = Convert.ToString(row["nh_kh"]) == "retail" ? "retail" : "dealer";
    }

    void PickCustomer()
    {
        var row = FrmCustomers.Pick(FindForm());
        if (row == null) return;
        BindSuggest();
        ApplyCustomer(Convert.ToString(row["ma_kh"]));
    }

    void PickProduct()
    {
        using var f = new FrmProductPick();
        if (f.ShowDialog(FindForm()) != DialogResult.OK || f.Selected == null) return;
        AddProductLine(Convert.ToString(f.Selected["ma_sp"]), Convert.ToString(f.Selected["ten_sp"]),
            f.Selected.Table.Columns.Contains("dvt") ? Convert.ToString(f.Selected["dvt"]) : "");
    }

    void AddProductFromBox()
    {
        var code = txtMaSp.Code;
        if (string.IsNullOrWhiteSpace(code)) return;
        var dt = SqlDb.Query("SELECT ten_sp, dvt FROM dbo.dmsp WHERE ma_sp=@c", SqlDb.P("@c", code));
        if (dt.Rows.Count == 0) return;
        AddProductLine(code, Convert.ToString(dt.Rows[0]["ten_sp"]), Convert.ToString(dt.Rows[0]["dvt"]));
        txtMaSp.Clear();
    }

    void AddProductLine(string? ma, string? ten, string? dvt)
    {
        if (string.IsNullOrWhiteSpace(ma)) return;
        var i = grid.Rows.Add();
        grid.Rows[i].Cells["ma_sp"].Value = ma;
        grid.Rows[i].Cells["ten_sp"].Value = ten;
        grid.Rows[i].Cells["dvt"].Value = dvt;
        grid.Rows[i].Cells["sl"].Value = 1;
        NumberRows();
        SumQty();
    }

    void Grid_EditingControlShowing(object? sender, DataGridViewEditingControlShowingEventArgs e)
    {
        if (e.Control is not TextBox tb) return;
        var col = grid.CurrentCell?.OwningColumn.Name;
        if (col == "ma_sp") { Ui.Suggest(tb, acSp); tb.CharacterCasing = CharacterCasing.Upper; }
        else if (col == "ma_kho") { Ui.Suggest(tb, acKho); tb.CharacterCasing = CharacterCasing.Upper; }
        else
        {
            tb.AutoCompleteMode = AutoCompleteMode.None;
            tb.AutoCompleteSource = AutoCompleteSource.None;
        }
    }

    void Grid_CellEndEdit(object? sender, DataGridViewCellEventArgs e)
    {
        var name = grid.Columns[e.ColumnIndex].Name;
        if (name == "ma_sp")
        {
            var code = Ui.SuggestCode(grid.Rows[e.RowIndex].Cells["ma_sp"].Value);
            if (string.IsNullOrEmpty(code)) return;
            grid.Rows[e.RowIndex].Cells["ma_sp"].Value = code;
            var dt = SqlDb.Query("SELECT ten_sp, dvt, ISNULL(ma_hs,N'') AS ma_hs FROM dbo.dmsp WHERE ma_sp=@c", SqlDb.P("@c", code));
            if (dt.Rows.Count == 0)
            {
                dt = SqlDb.Query("SELECT ten_sp, dvt FROM dbo.dmsp WHERE ma_sp=@c", SqlDb.P("@c", code));
                if (dt.Rows.Count == 0) return;
            }
            grid.Rows[e.RowIndex].Cells["ten_sp"].Value = dt.Rows[0]["ten_sp"];
            grid.Rows[e.RowIndex].Cells["dvt"].Value = dt.Rows[0]["dvt"];
            if (dt.Columns.Contains("ma_hs"))
                grid.Rows[e.RowIndex].Cells["ma_hs"].Value = dt.Rows[0]["ma_hs"];
            if (grid.Rows[e.RowIndex].Cells["sl"].Value == null)
                grid.Rows[e.RowIndex].Cells["sl"].Value = 1;
        }
        else if (name == "ma_kho")
            grid.Rows[e.RowIndex].Cells["ma_kho"].Value = Ui.SuggestCode(grid.Rows[e.RowIndex].Cells["ma_kho"].Value);
        SumQty();
    }

    void NumberRows()
    {
        var n = 1;
        foreach (DataGridViewRow row in grid.Rows)
        {
            if (row.IsNewRow) continue;
            row.Cells["stt"].Value = n++;
        }
    }

    void SumQty()
    {
        decimal sum = 0;
        foreach (DataGridViewRow row in grid.Rows)
        {
            if (row.IsNewRow) continue;
            decimal.TryParse(Convert.ToString(row.Cells["sl"].Value), out var sl);
            sum += sl;
        }
        lblTongSl.Text = sum.ToString("0.##");
    }

    void NewVoucher()
    {
        currentId = null;
        editing = true;
        customerGroup = "dealer";
        txtSoPhieu.Text = "";
        txtMaGd.Text = "1";
        ApplyGiaoDich();
        txtMaKh.Clear();
        lblTenKh.Text = "";
        txtDiaChi.Clear();
        txtDiaChiGh.Clear();
        txtNguoiNhan.Clear();
        txtDienGiai.Clear();
        txtSoDh.Clear();
        txtSdt.Clear();
        txtNvBan.Clear();
        txtNvGiao.Clear();
        txtGhiChu.Clear();
        txtStatus.Text = "Lập chứng từ";
        txtTyGia.Text = "1,00";
        dtNgay.Value = DateTime.Today;
        dtHt.Value = DateTime.Today;
        dtDh.Checked = false;
        grid.Rows.Clear();
        SumQty();
    }

    void LoadList()
    {
        list.DataSource = SqlDb.Query(@"SELECT id, number AS [Số phiếu], date AS [Ngày], customerCode AS [Mã KH], customerName AS [Tên KH],
            CASE WHEN serialLocked=1 THEN N'Đã khóa' WHEN serialCreated=1 THEN N'Đã tạo Serial' ELSE N'Chưa tạo Serial' END AS [Serial]
            FROM dbo.stock_outs ORDER BY createdAt DESC");
        if (list.Columns.Contains("id")) list.Columns["id"]!.Visible = false;
    }

    void OpenRow()
    {
        if (list.CurrentRow == null) return;
        currentId = (Guid)list.CurrentRow.Cells["id"].Value;
        var h = SqlDb.Query("SELECT * FROM dbo.stock_outs WHERE id=@id", SqlDb.P("@id", currentId));
        if (h.Rows.Count == 0) return;
        var r = h.Rows[0];
        txtSoPhieu.Text = Convert.ToString(r["number"]);
        var kind = Convert.ToString(r["kind"]);
        txtMaGd.Text = kind == "warranty_parts" ? "2" : "1";
        ApplyGiaoDich();
        var tenKh = Convert.ToString(r["customerName"]);
        var maKh = Convert.ToString(r["customerCode"]);
        txtMaKh.Text = string.IsNullOrWhiteSpace(tenKh) ? maKh : maKh + " - " + tenKh;
        lblTenKh.Text = tenKh;
        txtDiaChi.Text = Convert.ToString(r["customerAddress"]);
        txtNguoiNhan.Text = Convert.ToString(r["receiver"]);
        txtDienGiai.Text = Convert.ToString(r["reason"]);
        txtSdt.Text = Col(r, "customerPhone");
        txtSoDh.Text = Convert.ToString(r["orderNumber"]);
        txtNvBan.Text = Col(r, "salesStaff");
        txtNvGiao.Text = Col(r, "deliveryStaff");
        txtDiaChiGh.Text = Col(r, "deliveryAddress");
        txtGhiChu.Text = Col(r, "remark");
        txtTyGia.Text = Col(r, "exchangeRate", "1");
        txtStatus.Text = Convert.ToString(r["status"]) == "posted" ? "Đã ghi sổ cái" : "Lập chứng từ";
        customerGroup = Col(r, "customerGroup", "dealer") == "retail" ? "retail" : "dealer";
        if (r["date"] != DBNull.Value) dtNgay.Value = Convert.ToDateTime(r["date"]);
        if (r.Table.Columns.Contains("postingDate") && r["postingDate"] != DBNull.Value)
            dtHt.Value = Convert.ToDateTime(r["postingDate"]);
        if (r.Table.Columns.Contains("orderDate") && r["orderDate"] != DBNull.Value)
        {
            dtDh.Value = Convert.ToDateTime(r["orderDate"]);
            dtDh.Checked = true;
        }
        else dtDh.Checked = false;
        editing = false;
        grid.Rows.Clear();
        DataTable lines;
        try
        {
            lines = SqlDb.Query(@"SELECT l.quantity, l.unit, l.warehouseCode, l.lotCode, l.batchNo, l.shelfCode, l.hsCode, p.ma_sp, p.ten_sp, p.dvt
                FROM dbo.stock_out_lines l LEFT JOIN dbo.dmsp p ON p.id=l.materialId WHERE l.stockOutId=@id", SqlDb.P("@id", currentId));
        }
        catch
        {
            lines = SqlDb.Query(@"SELECT l.quantity, l.unit, l.warehouseCode, l.lotCode, l.batchNo, p.ma_sp, p.ten_sp, p.dvt
                FROM dbo.stock_out_lines l LEFT JOIN dbo.dmsp p ON p.id=l.materialId WHERE l.stockOutId=@id", SqlDb.P("@id", currentId));
        }
        foreach (DataRow line in lines.Rows)
        {
            var i = grid.Rows.Add();
            grid.Rows[i].Cells["ma_sp"].Value = line["ma_sp"];
            grid.Rows[i].Cells["ten_sp"].Value = line["ten_sp"];
            grid.Rows[i].Cells["dvt"].Value = line["dvt"] ?? line["unit"];
            grid.Rows[i].Cells["ma_kho"].Value = line["warehouseCode"];
            grid.Rows[i].Cells["ma_lo"].Value = line["lotCode"];
            grid.Rows[i].Cells["so_batch"].Value = line["batchNo"];
            grid.Rows[i].Cells["sl"].Value = line["quantity"];
            if (line.Table.Columns.Contains("shelfCode")) grid.Rows[i].Cells["ma_ke"].Value = line["shelfCode"];
            if (line.Table.Columns.Contains("hsCode")) grid.Rows[i].Cells["ma_hs"].Value = line["hsCode"];
        }
        NumberRows();
        SumQty();
    }

    void Save()
    {
        Guid? savedId = currentId;
        try
        {
            if (currentId != null)
            {
                var st = SqlDb.Query("SELECT serialCreated, serialLocked FROM dbo.stock_outs WHERE id=@id", SqlDb.P("@id", currentId.Value));
                if (st.Rows.Count > 0 && (ToBool(st.Rows[0]["serialCreated"]) || ToBool(st.Rows[0]["serialLocked"])))
                {
                    MessageBox.Show("Phiếu đã tạo Serial / khóa, không sửa được.");
                    return;
                }
            }

            var willPost = txtStatus.Text.Contains("ghi sổ", StringComparison.OrdinalIgnoreCase);
            var newQty = CollectLineQty();
            if (newQty.Count == 0)
            {
                MessageBox.Show("Thêm ít nhất một dòng vật tư.");
                return;
            }

            InventoryDb.Ensure();
            EnsureExtra();
            using var conn = SqlDb.Open();
            using var tran = conn.BeginTransaction();
            try
            {
                var exists = false;
                var wasPosted = false;
                var oldQty = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
                if (currentId != null)
                {
                    using var chk = new SqlCommand("SELECT status FROM dbo.stock_outs WHERE id=@id", conn, tran);
                    chk.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = currentId.Value;
                    var stObj = chk.ExecuteScalar();
                    exists = stObj != null && stObj != DBNull.Value;
                    if (exists)
                    {
                        wasPosted = string.Equals(Convert.ToString(stObj), "posted", StringComparison.OrdinalIgnoreCase);
                        if (wasPosted) oldQty = LoadPostedQty(conn, tran, currentId.Value);
                    }
                }

                if (willPost)
                {
                    // hiệu ứng tồn = -new + old (nếu trước đó đã ghi sổ) — đọc tồn trong cùng transaction
                    foreach (var kv in newQty)
                    {
                        var need = kv.Value - (oldQty.TryGetValue(kv.Key, out var o) ? o : 0m);
                        if (need <= 0m) continue;
                        if (!InventoryDb.TracksStock(kv.Key)) continue;
                        var ton = InventoryDb.GetTon(kv.Key, conn, tran);
                        if (ton < need)
                            throw new InvalidOperationException(
                                $"Mã {kv.Key}: tồn {ton:0.####}, cần xuất thêm {need:0.####}.");
                    }
                }

                if (!exists)
                {
                    currentId = Guid.NewGuid();
                    var count = Convert.ToInt32(new SqlCommand("SELECT COUNT(*) FROM dbo.stock_outs", conn, tran).ExecuteScalar());
                    txtSoPhieu.Text = $"PX{DateTime.Today:yyyyMMdd}-{(count + 1):000}";
                    using var cmd = new SqlCommand(@"INSERT INTO dbo.stock_outs
                    (id, number, date, postingDate, bookNumber, receiver, reason, kind, customerCode, customerName, customerAddress, customerPhone,
                     customerGroup, orderNumber, orderDate, status, createdBy, createdAt, updatedAt, serialCreated, serialLocked, currency, exchangeRate,
                     salesStaff, deliveryStaff, deliveryAddress, remark)
                    VALUES (@id,@num,@d,@ht,@book,@recv,@reason,@kind,@makh,@ten,@dc,@sdt,@nhom,@odh,@odhdate,@st,@by,GETDATE(),GETDATE(),0,0,N'VND',@fx,
                     @sale,@nvgh,@dcgh,@note)", conn, tran);
                    FillHeader(cmd);
                    cmd.ExecuteNonQuery();
                }
                else
                {
                    using var cmd = new SqlCommand(@"UPDATE dbo.stock_outs SET date=@d, postingDate=@ht, bookNumber=@book, receiver=@recv, reason=@reason,
                    kind=@kind, customerCode=@makh, customerName=@ten, customerAddress=@dc, customerPhone=@sdt, customerGroup=@nhom, orderNumber=@odh,
                    orderDate=@odhdate, status=@st, updatedAt=GETDATE(), exchangeRate=@fx, salesStaff=@sale, deliveryStaff=@nvgh, deliveryAddress=@dcgh, remark=@note
                    WHERE id=@id", conn, tran);
                    FillHeader(cmd);
                    cmd.ExecuteNonQuery();
                    using var del = new SqlCommand("DELETE FROM dbo.stock_out_lines WHERE stockOutId=@id", conn, tran);
                    del.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = currentId!.Value;
                    del.ExecuteNonQuery();
                }

                foreach (DataGridViewRow row in grid.Rows)
                {
                    if (row.IsNewRow) continue;
                    var ma = Ui.SuggestCode(row.Cells["ma_sp"].Value);
                    if (string.IsNullOrWhiteSpace(ma)) continue;
                    object productId = DBNull.Value;
                    using (var pid = new SqlCommand("SELECT id FROM dbo.dmsp WHERE ma_sp=@c", conn, tran))
                    {
                        pid.Parameters.AddWithValue("@c", ma);
                        var found = pid.ExecuteScalar();
                        if (found != null && found != DBNull.Value) productId = found;
                    }
                    using var ins = new SqlCommand(@"INSERT INTO dbo.stock_out_lines (id, stockOutId, materialId, materialName, quantity, unit, warehouseCode, lotCode, batchNo, shelfCode, hsCode)
                    VALUES (NEWID(), @hid, @mid, @ten, @sl, @dvt, @kho, @lo, @batch, @ke, @hs)", conn, tran);
                    ins.Parameters.Add("@hid", SqlDbType.UniqueIdentifier).Value = currentId!.Value;
                    var mid = ins.Parameters.Add("@mid", SqlDbType.UniqueIdentifier);
                    mid.IsNullable = true;
                    mid.Value = productId;
                    ins.Parameters.AddWithValue("@ten", Convert.ToString(row.Cells["ten_sp"].Value) ?? "");
                    ins.Parameters.AddWithValue("@sl", ToDec(row.Cells["sl"].Value));
                    ins.Parameters.AddWithValue("@dvt", Convert.ToString(row.Cells["dvt"].Value) ?? "");
                    ins.Parameters.AddWithValue("@kho", Ui.SuggestCode(row.Cells["ma_kho"].Value));
                    ins.Parameters.AddWithValue("@lo", Convert.ToString(row.Cells["ma_lo"].Value) ?? "");
                    ins.Parameters.AddWithValue("@batch", Convert.ToString(row.Cells["so_batch"].Value) ?? "");
                    ins.Parameters.AddWithValue("@ke", Convert.ToString(row.Cells["ma_ke"].Value) ?? "");
                    ins.Parameters.AddWithValue("@hs", Convert.ToString(row.Cells["ma_hs"].Value) ?? "");
                    ins.ExecuteNonQuery();
                }

                // Cập nhật tồn: hoàn lại phiếu cũ (nếu đã ghi sổ) rồi trừ phiếu mới (nếu ghi sổ)
                var applyOld = wasPosted ? oldQty : new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
                var applyNew = willPost ? newQty : new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
                InventoryDb.ApplyNet(applyOld, applyNew, conn, tran);

                tran.Commit();
            }
            catch
            {
                try { tran.Rollback(); } catch { /* already rolled back */ }
                if (savedId == null) currentId = null;
                throw;
            }
            editing = false;
            LoadList();
            MessageBox.Show(willPost
                ? "Đã ghi sổ phiếu " + txtSoPhieu.Text + " — đã trừ tồn kho."
                : "Đã lưu nháp phiếu " + txtSoPhieu.Text + " (chưa trừ tồn).");
        }
        catch (Exception ex)
        {
            MessageBox.Show("Không lưu được: " + ex.Message);
        }
    }

    Dictionary<string, decimal> CollectLineQty()
    {
        var list = new List<(string Ma, decimal Sl)>();
        foreach (DataGridViewRow row in grid.Rows)
        {
            if (row.IsNewRow) continue;
            var ma = Ui.SuggestCode(row.Cells["ma_sp"].Value);
            var sl = ToDec(row.Cells["sl"].Value);
            if (string.IsNullOrWhiteSpace(ma) || sl <= 0m) continue;
            list.Add((ma, sl));
        }
        return InventoryDb.SumLines(list);
    }

    static Dictionary<string, decimal> LoadPostedQty(SqlConnection conn, SqlTransaction tran, Guid stockOutId)
    {
        using var cmd = new SqlCommand(@"
SELECT ISNULL(p.ma_sp, N'') ma_sp, SUM(ISNULL(l.quantity,0)) sl
FROM dbo.stock_out_lines l
LEFT JOIN dbo.dmsp p ON p.id = l.materialId
WHERE l.stockOutId = @id
GROUP BY ISNULL(p.ma_sp, N'')", conn, tran);
        cmd.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = stockOutId;
        var map = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        using var rd = cmd.ExecuteReader();
        while (rd.Read())
        {
            var ma = rd.IsDBNull(0) ? "" : rd.GetString(0).Trim();
            if (ma.Length == 0) continue;
            map[ma] = rd.GetDecimal(1);
        }
        return map;
    }

    void FillHeader(SqlCommand cmd)
    {
        var gd = GiaoDich.FirstOrDefault(x => x.Code == Ui.SuggestCode(txtMaGd.Text));
        decimal.TryParse(txtTyGia.Text.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var fx);
        if (fx <= 0) fx = 1;
        cmd.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = currentId!.Value;
        cmd.Parameters.AddWithValue("@num", txtSoPhieu.Text);
        cmd.Parameters.AddWithValue("@d", dtNgay.Value.Date);
        cmd.Parameters.AddWithValue("@ht", dtHt.Value.Date);
        cmd.Parameters.AddWithValue("@book", txtQuyen.Text);
        cmd.Parameters.AddWithValue("@recv", txtNguoiNhan.Text);
        cmd.Parameters.AddWithValue("@reason", txtDienGiai.Text);
        cmd.Parameters.AddWithValue("@kind", string.IsNullOrEmpty(gd.Kind) ? "sale" : gd.Kind);
        cmd.Parameters.AddWithValue("@makh", Ui.SuggestCode(txtMaKh.Text).ToUpper());
        cmd.Parameters.AddWithValue("@ten", lblTenKh.Text.Trim());
        cmd.Parameters.AddWithValue("@dc", txtDiaChi.Text.Trim());
        cmd.Parameters.AddWithValue("@sdt", txtSdt.Text.Trim());
        cmd.Parameters.AddWithValue("@nhom", customerGroup);
        cmd.Parameters.AddWithValue("@odh", txtSoDh.Text.Trim());
        cmd.Parameters.AddWithValue("@odhdate", dtDh.Checked ? dtDh.Value.Date : DBNull.Value);
        cmd.Parameters.AddWithValue("@st", txtStatus.Text.Contains("ghi sổ", StringComparison.OrdinalIgnoreCase) ? "posted" : "draft");
        cmd.Parameters.AddWithValue("@by", Session.Username);
        cmd.Parameters.AddWithValue("@fx", fx);
        cmd.Parameters.AddWithValue("@sale", Ui.SuggestCode(txtNvBan.Text));
        cmd.Parameters.AddWithValue("@nvgh", Ui.SuggestCode(txtNvGiao.Text));
        cmd.Parameters.AddWithValue("@dcgh", txtDiaChiGh.Text.Trim());
        cmd.Parameters.AddWithValue("@note", txtGhiChu.Text.Trim());
    }

    void CancelEdit()
    {
        if (currentId == null) NewVoucher();
        else OpenRow();
    }

    void Delete()
    {
        if (currentId == null) return;
        if (MessageBox.Show("Xóa phiếu này?", "Xóa", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
        try
        {
            InventoryDb.Ensure();
            using var conn = SqlDb.Open();
            using var tran = conn.BeginTransaction();
            using (var chk = new SqlCommand(
                       "SELECT status, ISNULL(serialCreated,0), ISNULL(serialLocked,0) FROM dbo.stock_outs WHERE id=@id",
                       conn, tran))
            {
                chk.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = currentId.Value;
                using var rd = chk.ExecuteReader();
                if (!rd.Read()) throw new InvalidOperationException("Không tìm thấy phiếu.");
                if (Convert.ToInt32(rd[1]) == 1 || Convert.ToInt32(rd[2]) == 1)
                    throw new InvalidOperationException("Phiếu đã tạo Serial / khóa, không xóa được.");
                var posted = string.Equals(Convert.ToString(rd[0]), "posted", StringComparison.OrdinalIgnoreCase);
                rd.Close();
                if (posted)
                {
                    var old = LoadPostedQty(conn, tran, currentId.Value);
                    foreach (var kv in old)
                        InventoryDb.Adjust(kv.Key, kv.Value, conn, tran);
                }
            }
            using (var delL = new SqlCommand("DELETE FROM dbo.stock_out_lines WHERE stockOutId=@id", conn, tran))
            {
                delL.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = currentId.Value;
                delL.ExecuteNonQuery();
            }
            using (var delH = new SqlCommand("DELETE FROM dbo.stock_outs WHERE id=@id", conn, tran))
            {
                delH.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = currentId.Value;
                delH.ExecuteNonQuery();
            }
            tran.Commit();
            NewVoucher();
            LoadList();
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message);
        }
    }

    static void EnsureExtra()
    {
        foreach (var sql in new[]
        {
            "IF COL_LENGTH(N'dbo.stock_outs', N'salesStaff') IS NULL ALTER TABLE dbo.stock_outs ADD salesStaff NVARCHAR(100) NULL",
            "IF COL_LENGTH(N'dbo.stock_outs', N'deliveryStaff') IS NULL ALTER TABLE dbo.stock_outs ADD deliveryStaff NVARCHAR(100) NULL",
            "IF COL_LENGTH(N'dbo.stock_outs', N'deliveryAddress') IS NULL ALTER TABLE dbo.stock_outs ADD deliveryAddress NVARCHAR(255) NULL",
            "IF COL_LENGTH(N'dbo.stock_outs', N'remark') IS NULL ALTER TABLE dbo.stock_outs ADD remark NVARCHAR(500) NULL",
            "IF COL_LENGTH(N'dbo.stock_outs', N'orderDate') IS NULL ALTER TABLE dbo.stock_outs ADD orderDate DATE NULL",
            "IF COL_LENGTH(N'dbo.stock_outs', N'exchangeRate') IS NULL ALTER TABLE dbo.stock_outs ADD exchangeRate DECIMAL(18,4) NULL",
            "IF COL_LENGTH(N'dbo.stock_out_lines', N'shelfCode') IS NULL ALTER TABLE dbo.stock_out_lines ADD shelfCode NVARCHAR(20) NULL",
            "IF COL_LENGTH(N'dbo.stock_out_lines', N'hsCode') IS NULL ALTER TABLE dbo.stock_out_lines ADD hsCode NVARCHAR(20) NULL",
        })
        {
            try { SqlDb.Execute(sql); } catch { /* cột đã có */ }
        }
    }

    static string Col(DataRow r, string name, string def = "")
    {
        if (!r.Table.Columns.Contains(name) || r[name] == DBNull.Value) return def;
        return Convert.ToString(r[name]) ?? def;
    }

    static decimal ToDec(object? v)
    {
        decimal.TryParse(Convert.ToString(v), out var n);
        return n;
    }

    static bool ToBool(object v) => v != DBNull.Value && Convert.ToBoolean(v);
}

sealed class FrmProductPick : Form
{
    readonly DataGridView grid = new();
    public DataRow? Selected { get; private set; }

    public FrmProductPick()
    {
        Text = "Chọn vật tư";
        FormBorderStyle = FormBorderStyle.Sizable;
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(720, 460);
        Font = Ui.Body;
        BackColor = Ui.Bg;
        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.DataSource = CatalogDb.ListProducts();
        if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
        grid.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) AcceptPick(); };
        var chon = Ui.Primary("Chọn");
        chon.Click += (_, _) => AcceptPick();
        var huy = Ui.Ghost("Hủy bỏ");
        huy.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };
        Controls.Add(grid);
        Controls.Add(Ui.DialogFooter(chon, huy));
    }

    void AcceptPick()
    {
        if (grid.CurrentRow == null) return;
        var ma = Convert.ToString(grid.CurrentRow.Cells["Mã SP"].Value);
        if (string.IsNullOrWhiteSpace(ma)) return;
        var dt = SqlDb.Query("SELECT ma_sp, ten_sp, dvt FROM dbo.dmsp WHERE ma_sp=@c", SqlDb.P("@c", ma));
        if (dt.Rows.Count == 0) return;
        Selected = dt.Rows[0];
        DialogResult = DialogResult.OK;
        Close();
    }
}
