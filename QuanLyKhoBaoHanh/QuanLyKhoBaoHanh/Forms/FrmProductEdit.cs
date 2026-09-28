using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmProductEdit : Form
{
    readonly string? editingId;
    readonly TextBox txtCode = Ui.Box();
    readonly TextBox txtSearch = Ui.Box();
    readonly TextBox txtName = Ui.Box();
    readonly TextBox txtName2 = Ui.Box();
    readonly TextBox txtUnit = Ui.Box();
    readonly CheckBox chkMulti = new() { Text = "Nhiều đvt", AutoSize = true };
    readonly CheckBox chkShelf = new() { Text = "Theo dõi theo kệ", AutoSize = true };
    readonly CheckBox chkStock = new() { Text = "Theo dõi tồn kho", AutoSize = true, Checked = true };
    readonly CheckBox chkLot = new() { Text = "Theo dõi lô", AutoSize = true };
    readonly ComboBox cboCost = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 220 };
    readonly TextBox txtKind = Ui.Box();
    readonly TextBox txtTkVt = Ui.Box();
    readonly TextBox txtTax = Ui.Box();
    readonly ComboBox cboEditTk = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 160 };
    readonly TextBox txtQty = Ui.Box();
    readonly TextBox txtGroup1 = Ui.Box();
    readonly TextBox txtGroup2 = Ui.Box();
    readonly TextBox txtGroup3 = Ui.Box();
    readonly TextBox txtMin = Ui.Box();
    readonly TextBox txtMax = Ui.Box();
    readonly TextBox txtNganh = Ui.Box();
    readonly TextBox txtNote = Ui.Box();
    readonly ComboBox cboStatus = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 180 };
    readonly TextBox txtDt = Ui.Box();
    readonly TextBox txtTl = Ui.Box();
    readonly TextBox txtDtnb = Ui.Box();
    readonly TextBox txtCl = Ui.Box();
    readonly TextBox txtGv = Ui.Box();
    readonly TextBox txtSpdd = Ui.Box();
    readonly TextBox txtVat = Ui.Box();
    readonly TextBox txtBvmt = Ui.Box();
    readonly TextBox txtCk = Ui.Box();
    readonly TextBox txtLoaiMa = Ui.Box();
    readonly TextBox txtHs = Ui.Box();
    readonly TextBox txtBrand = Ui.Box();
    readonly TextBox txtFamily = Ui.Box();
    readonly TextBox txtColor = Ui.Box();
    readonly TextBox txtCar = Ui.Box();
    readonly TextBox txtYear = Ui.Box();
    readonly TextBox txtOrigin = Ui.Box();
    readonly TextBox txtHang = Ui.Box();
    readonly TextBox txtSpec = Ui.Box();
    readonly DataTable prices = new();
    readonly DataGridView gridGia = new();
    readonly Label lblErr = new() { ForeColor = Ui.Danger, AutoSize = false, Height = 22, Dock = DockStyle.Bottom, Padding = new Padding(12, 2, 8, 0) };

    public FrmProductEdit(string? id = null)
    {
        editingId = id;
        Text = id == null ? "Thêm vật tư" : "Sửa vật tư";
        FormBorderStyle = FormBorderStyle.Sizable;
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Size = new Size(1040, 760);
        MinimumSize = new Size(900, 640);
        Font = Ui.Body;
        BackColor = Ui.Bg;

        cboCost.Items.AddRange(["0 - Thực tế đích danh", "1 - Trung bình tháng", "2 - Trung bình di động", "3 - Nhập trước xuất trước"]);
        cboCost.SelectedIndex = 1;
        cboEditTk.Items.AddRange(["0 - Không", "1 - Được"]);
        cboEditTk.SelectedIndex = 0;
        cboStatus.Items.AddRange(["0 - Không sử dụng", "1 - Sử dụng"]);
        cboStatus.SelectedIndex = 1;
        txtUnit.Text = "Cái";
        txtMin.Text = "0";
        txtMax.Text = "0";
        txtQty.Text = "0,000";
        txtQty.ReadOnly = true;
        txtQty.ForeColor = Ui.Danger;
        txtCode.ReadOnly = true;
        txtSearch.ReadOnly = true;

        prices.Columns.Add("ngay_hl", typeof(string));
        prices.Columns.Add("gia", typeof(decimal));
        prices.Columns.Add("gia_vat", typeof(decimal));
        prices.Columns.Add("nh_kh", typeof(string));
        prices.Columns.Add("ma_kh", typeof(string));

        var tabs = new TabControl { Dock = DockStyle.Fill };
        tabs.TabPages.Add(BuildMainTab());
        tabs.TabPages.Add(BuildOriginTab());

        var nhan = Ui.Primary("Nhận");
        nhan.Click += (_, _) => Accept();
        var huy = Ui.Ghost("Hủy bỏ");
        huy.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };
        AcceptButton = nhan;
        CancelButton = huy;

        Controls.Add(tabs);
        Controls.Add(lblErr);
        Controls.Add(Ui.DialogFooter(nhan, huy));

        if (id != null) LoadRow(id);
        else
        {
            var code = CatalogDb.NextProductCode();
            txtCode.Text = code;
            txtSearch.Text = "TC" + (code.Length > 2 ? code[2..] : code);
        }
        Ui.ApplyTree(this);
    }

    TabPage BuildMainTab()
    {
        var page = new TabPage("1. Thông tin vật tư") { BackColor = Ui.Bg };
        var wrap = new Panel { Dock = DockStyle.Fill };
        var fields = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            WrapContents = true,
            AutoScroll = true,
            Padding = new Padding(10, 8, 10, 8),
        };

        txtGroup1.MaxLength = 20;
        txtGroup1.CharacterCasing = CharacterCasing.Upper;
        F(fields, "Mã sản phẩm, vật tư", txtCode, 320);
        F(fields, "Mã tra cứu", txtSearch, 220);
        F(fields, "Tên sản phẩm, vật tư", txtName, 560);
        F(fields, "Nhóm SP (3 ký tự, dùng cho Serial)", txtGroup1, 220);
        F(fields, "Tên 2", txtName2, 420);
        F(fields, "Đơn vị tính", txtUnit, 120);
        var checks = new FlowLayoutPanel { Width = 520, Height = 28, Margin = new Padding(0, 22, 0, 0) };
        checks.Controls.AddRange([chkMulti, chkShelf, chkStock, chkLot]);
        fields.Controls.Add(checks);

        F(fields, "Cách tính giá tồn kho", cboCost, 240);
        F(fields, "Loại vật tư", txtKind, 120);
        F(fields, "Tài khoản kho", txtTkVt, 160);
        F(fields, "Thuế suất", txtTax, 100);
        F(fields, "Sửa tài khoản kho", cboEditTk, 160);
        F(fields, "Số tồn", txtQty, 120);
        F(fields, "Tài khoản doanh thu", txtDt, 180);
        F(fields, "Tài khoản hàng bán bị trả lại", txtTl, 200);
        F(fields, "Tài khoản doanh thu nội bộ", txtDtnb, 200);
        F(fields, "Tài khoản chênh lệch giá vật tư", txtCl, 220);
        F(fields, "Tài khoản giá vốn", txtGv, 180);
        F(fields, "Tài khoản sản phẩm dở dang", txtSpdd, 200);
        F(fields, "Nhóm SP, vật tư 2", txtGroup2, 160);
        F(fields, "Nhóm 3", txtGroup3, 120);
        F(fields, "Số lượng tồn tối thiểu", txtMin, 150);
        F(fields, "Số lượng tồn tối đa", txtMax, 150);
        F(fields, "Mã ngành", txtNganh, 140);
        F(fields, "Trạng thái", cboStatus, 180);
        F(fields, "Thuế GTGT", txtVat, 100);
        F(fields, "Thuế BVMT", txtBvmt, 100);
        F(fields, "Mã % CK (Sale Group)", txtCk, 160);
        F(fields, "Loại mã (Type code)", txtLoaiMa, 140);
        F(fields, "Mã HS code", txtHs, 140);
        F(fields, "Thương hiệu", txtBrand, 180);
        F(fields, "Gia đình SP", txtFamily, 180);
        F(fields, "Màu sắc", txtColor, 140);
        F(fields, "Mẫu xe", txtCar, 160);
        F(fields, "Năm SX của mẫu xe", txtYear, 140);
        F(fields, "Ghi chú", txtNote, 700);

        gridGia.DataSource = prices;
        gridGia.AllowUserToAddRows = true;
        gridGia.AllowUserToDeleteRows = true;
        gridGia.RowHeadersVisible = false;
        gridGia.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        gridGia.BackgroundColor = Ui.Panel;
        gridGia.Dock = DockStyle.Bottom;
        gridGia.Height = 150;
        gridGia.DataBindingComplete += (_, _) =>
        {
            if (gridGia.Columns.Contains("ngay_hl")) gridGia.Columns["ngay_hl"]!.HeaderText = "Ngày hiệu lực";
            if (gridGia.Columns.Contains("gia")) gridGia.Columns["gia"]!.HeaderText = "Giá";
            if (gridGia.Columns.Contains("gia_vat")) gridGia.Columns["gia_vat"]!.HeaderText = "Giá có VAT";
            if (gridGia.Columns.Contains("nh_kh")) gridGia.Columns["nh_kh"]!.HeaderText = "Nhóm khách hàng";
            if (gridGia.Columns.Contains("ma_kh")) gridGia.Columns["ma_kh"]!.HeaderText = "Mã khách";
        };

        wrap.Controls.Add(fields);
        wrap.Controls.Add(gridGia);
        page.Controls.Add(wrap);
        return page;
    }

    TabPage BuildOriginTab()
    {
        var page = new TabPage("2. Xuất xứ") { Padding = new Padding(12), BackColor = Ui.Bg };
        var box = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = true };
        F(box, "Nước xuất xứ", txtOrigin, 220);
        F(box, "Hãng sản xuất", txtHang, 280);
        F(box, "Quy cách / tên", txtSpec, 520);
        page.Controls.Add(box);
        return page;
    }

    static void F(FlowLayoutPanel host, string label, Control input, int width) =>
        host.Controls.Add(Ui.FormField(label, input, width));

    void LoadRow(string id)
    {
        var row = CatalogDb.LoadProductRow(id);
        if (row == null) return;
        txtCode.Text = Str(row, "ma_sp");
        txtSearch.Text = Str(row, "ma_tra_cuu");
        txtName.Text = Str(row, "ten_sp");
        txtName2.Text = Str(row, "ten_sp2");
        txtUnit.Text = Str(row, "dvt", "Cái");
        chkMulti.Checked = Bit(row, "nhieu_dvt");
        chkShelf.Checked = Bit(row, "vt_ke");
        chkStock.Checked = Bit(row, "vt_ton_kho", true);
        chkLot.Checked = Bit(row, "lot_yn");
        cboCost.SelectedIndex = Clamp(Int(row, "gia_ton", 1), 0, 3);
        txtKind.Text = Str(row, "loai_vt");
        txtTkVt.Text = Str(row, "tk_vt");
        txtTax.Text = Str(row, "thue_suat");
        cboEditTk.SelectedIndex = Clamp(Int(row, "sua_tk_vt", 0), 0, 1);
        txtGroup1.Text = Str(row, "nh_vt1");
        txtGroup2.Text = Str(row, "nh_vt2");
        txtGroup3.Text = Str(row, "nh_vt3");
        txtMin.Text = Str(row, "sl_min", "0");
        txtMax.Text = Str(row, "sl_max", "0");
        txtNganh.Text = Str(row, "ma_nganh");
        txtNote.Text = Str(row, "ghi_chu");
        cboStatus.SelectedIndex = Str(row, "status", "1") == "0" ? 0 : 1;
        txtDt.Text = Str(row, "tk_dt");
        txtTl.Text = Str(row, "tk_tl");
        txtDtnb.Text = Str(row, "tk_dtnb");
        txtCl.Text = Str(row, "tk_cl_vt");
        txtGv.Text = Str(row, "tk_gv");
        txtSpdd.Text = Str(row, "tk_spdd");
        txtVat.Text = Str(row, "thue_gtgt");
        txtBvmt.Text = Str(row, "thue_bvmt");
        txtCk.Text = Str(row, "ma_ck");
        txtLoaiMa.Text = Str(row, "loai_ma");
        txtHs.Text = Str(row, "ma_hs");
        txtBrand.Text = Str(row, "thuong_hieu");
        txtFamily.Text = Str(row, "gia_dinh_sp");
        txtColor.Text = Str(row, "mau_sac");
        txtCar.Text = Str(row, "mau_xe");
        txtYear.Text = Str(row, "nam_sx");
        txtOrigin.Text = Str(row, "nuoc_xx");
        txtHang.Text = Str(row, "hang_sx");
        txtSpec.Text = Str(row, "quy_cach_ten");

        prices.Rows.Clear();
        foreach (DataRow p in CatalogDb.LoadPrices(id).Rows)
        {
            prices.Rows.Add(
                p["ngay_hl"] == DBNull.Value ? "" : Convert.ToDateTime(p["ngay_hl"]).ToString("yyyy-MM-dd"),
                ToDec(p["gia"]), ToDec(p["gia_vat"]),
                Convert.ToString(p["nh_kh"]) ?? "", Convert.ToString(p["ma_kh"]) ?? "");
        }
    }

    void Accept()
    {
        if (string.IsNullOrWhiteSpace(txtName.Text))
        {
            lblErr.Text = "Nhập tên sản phẩm, vật tư";
            return;
        }
        var nhom = txtGroup1.Text.Trim().ToUpper();
        if (nhom.Length < 1)
        {
            lblErr.Text = "Nhập mã nhóm SP (ít nhất 1 ký tự, Serial lấy 3 ký tự đầu)";
            txtGroup1.Focus();
            return;
        }
        try
        {
            var code = txtCode.Text.Trim();
            if (string.IsNullOrEmpty(code)) code = CatalogDb.NextProductCode();
            var search = string.IsNullOrWhiteSpace(txtSearch.Text) ? "TC" + code[2..] : txtSearch.Text.Trim();
            var fields = new Dictionary<string, object?>
            {
                ["ma_sp"] = code,
                ["ma_tra_cuu"] = search,
                ["ten_sp"] = txtName.Text.Trim(),
                ["ten_sp2"] = txtName2.Text.Trim(),
                ["dvt"] = string.IsNullOrWhiteSpace(txtUnit.Text) ? "Cái" : txtUnit.Text.Trim(),
                ["nhieu_dvt"] = chkMulti.Checked,
                ["vt_ke"] = chkShelf.Checked,
                ["vt_ton_kho"] = chkStock.Checked,
                ["lot_yn"] = chkLot.Checked,
                ["gia_ton"] = cboCost.SelectedIndex,
                ["loai_vt"] = txtKind.Text.Trim(),
                ["tk_vt"] = txtTkVt.Text.Trim(),
                ["thue_suat"] = Num(txtTax.Text),
                ["sua_tk_vt"] = cboEditTk.SelectedIndex,
                ["tk_dt"] = txtDt.Text.Trim(),
                ["tk_tl"] = txtTl.Text.Trim(),
                ["tk_dtnb"] = txtDtnb.Text.Trim(),
                ["tk_cl_vt"] = txtCl.Text.Trim(),
                ["tk_gv"] = txtGv.Text.Trim(),
                ["tk_spdd"] = txtSpdd.Text.Trim(),
                ["nh_vt1"] = txtGroup1.Text.Trim().ToUpper(),
                ["nh_vt2"] = txtGroup2.Text.Trim(),
                ["nh_vt3"] = txtGroup3.Text.Trim(),
                ["sl_min"] = Num(txtMin.Text),
                ["sl_max"] = Num(txtMax.Text),
                ["ma_nganh"] = txtNganh.Text.Trim(),
                ["ghi_chu"] = txtNote.Text.Trim(),
                ["status"] = cboStatus.SelectedIndex == 0 ? "0" : "1",
                ["thue_gtgt"] = Num(txtVat.Text),
                ["thue_bvmt"] = Num(txtBvmt.Text),
                ["ma_ck"] = txtCk.Text.Trim(),
                ["loai_ma"] = txtLoaiMa.Text.Trim(),
                ["ma_hs"] = txtHs.Text.Trim(),
                ["thuong_hieu"] = txtBrand.Text.Trim(),
                ["gia_dinh_sp"] = txtFamily.Text.Trim(),
                ["mau_sac"] = txtColor.Text.Trim(),
                ["mau_xe"] = txtCar.Text.Trim(),
                ["nam_sx"] = txtYear.Text.Trim(),
                ["nuoc_xx"] = txtOrigin.Text.Trim(),
                ["hang_sx"] = txtHang.Text.Trim(),
                ["quy_cach_ten"] = txtSpec.Text.Trim(),
                ["updatedAt"] = DateTime.Now,
            };
            if (editingId == null) fields["createdAt"] = DateTime.Now;
            gridGia.EndEdit();
            CatalogDb.SaveProduct(editingId, fields, prices);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            lblErr.Text = ex.Message;
        }
    }

    static decimal Num(string s)
    {
        decimal.TryParse(s.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var n);
        return n;
    }

    static string Str(DataRow row, string col, string def = "")
    {
        if (!row.Table.Columns.Contains(col) || row[col] == DBNull.Value) return def;
        return Convert.ToString(row[col]) ?? def;
    }

    static bool Bit(DataRow row, string col, bool def = false)
    {
        if (!row.Table.Columns.Contains(col) || row[col] == DBNull.Value) return def;
        return Convert.ToBoolean(row[col]);
    }

    static int Int(DataRow row, string col, int def)
    {
        if (!row.Table.Columns.Contains(col) || row[col] == DBNull.Value) return def;
        return Convert.ToInt32(row[col]);
    }

    static int Clamp(int v, int a, int b) => Math.Min(b, Math.Max(a, v));

    static decimal ToDec(object v)
    {
        if (v == null || v == DBNull.Value) return 0;
        return Convert.ToDecimal(v);
    }
}
