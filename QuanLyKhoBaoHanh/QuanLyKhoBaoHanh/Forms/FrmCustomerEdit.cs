using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmCustomerEdit : Form
{
    readonly string? editingId;
    readonly CheckBox chkDn = new() { Text = "Là K.H doanh nghiệp", AutoSize = true, Checked = true };
    readonly CheckBox chkCn = new() { Text = "Là K.H cá nhân", AutoSize = true };
    readonly TextBox txtMst = T();
    readonly TextBox txtCmnd = T();
    readonly TextBox txtCode = T();
    readonly TextBox txtSearch = T();
    readonly TextBox txtName = T();
    readonly TextBox txtName2 = T();
    readonly TextBox txtAddress = T();
    readonly TextBox txtShip = T();
    readonly TextBox txtPartner = T();
    readonly TextBox txtDktt = T();
    readonly TextBox txtTkNd = T();
    readonly TextBox txtCountry = T();
    readonly TextBox txtMien = T();
    readonly TextBox txtVung = T();
    readonly TextBox txtTinh = T();
    readonly TextBox txtQuan = T();
    readonly TextBox txtKenh = T();
    readonly TextBox txtNhom1 = T();
    readonly TextBox txtNhom2 = T();
    readonly TextBox txtSale1 = T();
    readonly TextBox txtSale2 = T();
    readonly TextBox txtPhone = T();
    readonly TextBox txtBank = T();
    readonly TextBox txtCk = T();
    readonly CheckBox chkHd = new() { Text = "Xuất hóa đơn", AutoSize = true };
    readonly CheckBox chkLot = new() { Text = "Lô và hạn sd", AutoSize = true };
    readonly CheckBox chkKenh = new() { Text = "Lưỡng kênh", AutoSize = true };
    readonly CheckBox chkLaKh = new() { Text = "Là khách hàng", AutoSize = true, Checked = true };
    readonly TextBox txtNvGh = T();
    readonly TextBox txtNote = T();
    readonly TextBox txtStatus = T();
    readonly TextBox txtFax = T();
    readonly TextBox txtWeb = T();
    readonly TextBox txtDd = T();
    readonly TextBox txtChucVu = T();
    readonly TextBox txtHanMuc = T();
    readonly TextBox txtSoNgay = T();
    readonly DateTimePicker dtSinh = new() { Format = DateTimePickerFormat.Short, ShowCheckBox = true, Checked = false };
    readonly TextBox txtGioi = T();
    readonly TextBox txtNoiCap = T();
    readonly Label lblErr = new() { ForeColor = Ui.Danger, AutoSize = false, Height = 22, Dock = DockStyle.Bottom, Padding = new Padding(12, 2, 8, 0) };

    public FrmCustomerEdit(string? id = null)
    {
        editingId = id;
        Text = id == null ? "Thêm khách hàng" : "Sửa khách hàng";
        FormBorderStyle = FormBorderStyle.Sizable;
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Size = new Size(820, 760);
        MinimumSize = new Size(760, 640);
        Font = new Font("Segoe UI", 9f);
        BackColor = Ui.Bg;

        txtCode.CharacterCasing = CharacterCasing.Upper;
        txtCode.MaxLength = 50;
        txtStatus.Text = "1";
        txtStatus.Width = 40;
        txtCk.Text = "0";

        chkDn.CheckedChanged += (_, _) => { if (chkDn.Checked) chkCn.Checked = false; };
        chkCn.CheckedChanged += (_, _) => { if (chkCn.Checked) chkDn.Checked = false; };

        var tabs = new TabControl { Dock = DockStyle.Fill };
        tabs.TabPages.Add(BuildMain());
        tabs.TabPages.Add(BuildOther());

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
        Ui.ApplyTree(this);
    }

    TabPage BuildMain()
    {
        var page = new TabPage("1. Thông tin chính") { BackColor = Ui.Bg };
        var scroll = new Panel { Dock = DockStyle.Fill, AutoScroll = true, Padding = new Padding(10, 8, 16, 8) };
        var t = Grid();

        var kinds = new FlowLayoutPanel { Dock = DockStyle.Fill, Height = 24, WrapContents = false };
        kinds.Controls.Add(chkDn);
        kinds.Controls.Add(chkCn);
        Full(t, "", kinds);

        Pair(t, "Mã số thuế", txtMst, "Số CMND/CCCD", txtCmnd);
        Pair(t, "Mã khách", txtCode, "Mã tra cứu", txtSearch);
        Full(t, "Tên khách", txtName);
        Full(t, "Tên 2", txtName2);
        Full(t, "Địa chỉ", txtAddress);
        Full(t, "Địa chỉ giao hàng", txtShip);
        Full(t, "Đối tác", txtPartner, 160);
        Pair(t, "Mã điều khoản tt ngầm định", txtDktt, "Tài khoản ngầm định", txtTkNd);
        Full(t, "Quốc gia", txtCountry, 160);
        Pair(t, "Miền", txtMien, "Vùng", txtVung);
        Pair(t, "Tỉnh", txtTinh, "Quận", txtQuan);
        Pair(t, "Kênh", txtKenh, "Nhóm khách 1", txtNhom1);
        Pair(t, "Sale 1", txtSale1, "Sale 2", txtSale2);
        Full(t, "Nhóm khách 2", txtNhom2, 160);
        Full(t, "Điện thoại / email", txtPhone);
        Full(t, "Tài khoản \\ tên ngân hàng", txtBank);
        Full(t, "Tl chiết khấu (%)", txtCk, 80);

        var flags = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false, Height = 24 };
        flags.Controls.AddRange([chkHd, chkLot, chkKenh, chkLaKh]);
        Full(t, "", flags);

        Full(t, "NV giao hàng", txtNvGh, 160);
        Full(t, "Ghi chú", txtNote);

        var st = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = false };
        txtStatus.Width = 36;
        st.Controls.Add(txtStatus);
        st.Controls.Add(new Label
        {
            Text = "0 - Không sử dụng, 1 - Sử dụng",
            AutoSize = true,
            ForeColor = Ui.Muted,
            Padding = new Padding(8, 4, 0, 0),
        });
        Full(t, "Trạng thái sử dụng", st);

        scroll.Controls.Add(t);
        page.Controls.Add(scroll);
        return page;
    }

    TabPage BuildOther()
    {
        var page = new TabPage("2. Thông tin khác") { BackColor = Ui.Bg };
        var scroll = new Panel { Dock = DockStyle.Fill, AutoScroll = true, Padding = new Padding(10, 8, 16, 8) };
        var t = Grid();
        Pair(t, "Fax", txtFax, "Website", txtWeb);
        Pair(t, "Người đại diện", txtDd, "Chức vụ", txtChucVu);
        Pair(t, "Hạn mức nợ", txtHanMuc, "Số ngày được nợ", txtSoNgay);
        Pair(t, "Ngày sinh", dtSinh, "Giới tính", txtGioi);
        Full(t, "Nơi cấp CMND/CCCD", txtNoiCap);
        scroll.Controls.Add(t);
        page.Controls.Add(scroll);
        return page;
    }

    static TableLayoutPanel Grid()
    {
        var t = new TableLayoutPanel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            ColumnCount = 4,
            Padding = new Padding(0),
        };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 168));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 168));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        return t;
    }

    static void Full(TableLayoutPanel t, string label, Control c, int? width = null)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        t.Controls.Add(Lab(label), 0, r);
        if (width is int w) c.Width = w;
        else c.Dock = DockStyle.Fill;
        t.SetColumnSpan(c, 3);
        t.Controls.Add(c, 1, r);
    }

    static void Pair(TableLayoutPanel t, string l1, Control c1, string l2, Control c2)
    {
        var r = t.RowCount++;
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
        t.Controls.Add(Lab(l1), 0, r);
        c1.Dock = DockStyle.Fill;
        t.Controls.Add(c1, 1, r);
        t.Controls.Add(Lab(l2), 2, r);
        c2.Dock = DockStyle.Fill;
        t.Controls.Add(c2, 3, r);
    }

    static Label Lab(string text) => new()
    {
        Text = text,
        AutoSize = true,
        Anchor = AnchorStyles.Left,
        ForeColor = Color.FromArgb(50, 50, 50),
        Padding = new Padding(0, 4, 6, 0),
    };

    static TextBox T() => new()
    {
        BorderStyle = BorderStyle.FixedSingle,
        Height = 22,
    };

    void LoadRow(string id)
    {
        var row = CatalogDb.LoadCustomer(id);
        if (row == null) return;
        var loai = Str(row, "loai_kh");
        chkDn.Checked = loai != "individual";
        chkCn.Checked = loai == "individual";
        txtMst.Text = Str(row, "ma_so_thue");
        txtCmnd.Text = Str(row, "cmnd");
        txtCode.Text = Str(row, "ma_kh");
        txtSearch.Text = Str(row, "ma_tra_cuu");
        txtName.Text = Str(row, "ten_kh");
        txtName2.Text = Str(row, "ten_kh2");
        txtAddress.Text = Str(row, "dia_chi");
        txtShip.Text = Str(row, "dia_chi_gh");
        txtPartner.Text = Str(row, "doi_tac");
        txtDktt.Text = Str(row, "ma_dktt");
        txtTkNd.Text = Str(row, "tk_ngam_dinh");
        txtCountry.Text = Str(row, "quoc_gia");
        txtMien.Text = Str(row, "mien");
        txtVung.Text = Str(row, "vung");
        txtTinh.Text = Str(row, "tinh");
        txtQuan.Text = Str(row, "quan");
        txtKenh.Text = Str(row, "kenh");
        txtNhom1.Text = Str(row, "nh_kh1");
        txtNhom2.Text = Str(row, "nh_kh2");
        txtSale1.Text = Str(row, "sale1");
        txtSale2.Text = Str(row, "sale2");
        txtPhone.Text = string.IsNullOrWhiteSpace(Str(row, "email"))
            ? Str(row, "dien_thoai")
            : (Str(row, "dien_thoai") + " / " + Str(row, "email")).Trim(' ', '/');
        txtBank.Text = Str(row, "tk_nh");
        txtCk.Text = Str(row, "tl_ck", "0");
        chkHd.Checked = Bit(row, "xuat_hd");
        chkLot.Checked = Bit(row, "lo_hsd");
        chkKenh.Checked = Bit(row, "luong_kenh");
        chkLaKh.Checked = Bit(row, "la_kh", true);
        txtNvGh.Text = Str(row, "nv_gh");
        txtNote.Text = Str(row, "ghi_chu");
        txtStatus.Text = string.IsNullOrWhiteSpace(Str(row, "status")) ? "1" : Str(row, "status");
        txtFax.Text = Str(row, "fax");
        txtWeb.Text = Str(row, "website");
        txtDd.Text = Str(row, "nguoi_dd");
        txtChucVu.Text = Str(row, "chuc_vu");
        txtHanMuc.Text = Str(row, "han_muc");
        txtSoNgay.Text = Str(row, "so_ngay_no");
        if (row.Table.Columns.Contains("ngay_sinh") && row["ngay_sinh"] != DBNull.Value)
        {
            dtSinh.Value = Convert.ToDateTime(row["ngay_sinh"]);
            dtSinh.Checked = true;
        }
        txtGioi.Text = Str(row, "gioi_tinh");
        txtNoiCap.Text = Str(row, "noi_cap");
    }

    void Accept()
    {
        var ma = txtCode.Text.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(ma))
        {
            lblErr.Text = "Nhập mã khách";
            txtCode.Focus();
            return;
        }
        if (string.IsNullOrWhiteSpace(txtName.Text))
        {
            lblErr.Text = "Nhập tên khách";
            txtName.Focus();
            return;
        }
        var phone = txtPhone.Text.Trim();
        var email = "";
        var slash = phone.IndexOf('/');
        if (slash >= 0)
        {
            email = phone[(slash + 1)..].Trim();
            phone = phone[..slash].Trim();
        }
        else if (phone.Contains('@'))
        {
            email = phone;
            phone = "";
        }
        decimal.TryParse(txtCk.Text.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var ck);
        decimal.TryParse(txtHanMuc.Text.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var han);
        int.TryParse(txtSoNgay.Text, out var ngayNo);
        var loai = chkCn.Checked ? "individual" : "enterprise";
        try
        {
            CatalogDb.SaveCustomer(editingId, new Dictionary<string, object?>
            {
                ["ma_kh"] = ma,
                ["ma_tra_cuu"] = string.IsNullOrWhiteSpace(txtSearch.Text) ? ma : txtSearch.Text.Trim(),
                ["ten_kh"] = txtName.Text.Trim(),
                ["ten_kh2"] = txtName2.Text.Trim(),
                ["ma_so_thue"] = txtMst.Text.Trim(),
                ["cmnd"] = txtCmnd.Text.Trim(),
                ["loai_kh"] = loai,
                ["nh_kh"] = chkCn.Checked ? "retail" : "dealer",
                ["dia_chi"] = txtAddress.Text.Trim(),
                ["dia_chi_gh"] = txtShip.Text.Trim(),
                ["doi_tac"] = txtPartner.Text.Trim(),
                ["ma_dktt"] = txtDktt.Text.Trim(),
                ["tk_ngam_dinh"] = txtTkNd.Text.Trim(),
                ["quoc_gia"] = txtCountry.Text.Trim(),
                ["mien"] = txtMien.Text.Trim(),
                ["vung"] = txtVung.Text.Trim(),
                ["tinh"] = txtTinh.Text.Trim(),
                ["quan"] = txtQuan.Text.Trim(),
                ["kenh"] = txtKenh.Text.Trim(),
                ["nh_kh1"] = txtNhom1.Text.Trim(),
                ["nh_kh2"] = txtNhom2.Text.Trim(),
                ["sale1"] = txtSale1.Text.Trim(),
                ["sale2"] = txtSale2.Text.Trim(),
                ["dien_thoai"] = phone,
                ["email"] = email,
                ["tk_nh"] = txtBank.Text.Trim(),
                ["tl_ck"] = ck,
                ["xuat_hd"] = chkHd.Checked,
                ["lo_hsd"] = chkLot.Checked,
                ["luong_kenh"] = chkKenh.Checked,
                ["la_kh"] = chkLaKh.Checked,
                ["nv_gh"] = txtNvGh.Text.Trim(),
                ["ghi_chu"] = txtNote.Text.Trim(),
                ["status"] = txtStatus.Text.Trim() == "0" ? "0" : "1",
                ["fax"] = txtFax.Text.Trim(),
                ["website"] = txtWeb.Text.Trim(),
                ["nguoi_dd"] = txtDd.Text.Trim(),
                ["chuc_vu"] = txtChucVu.Text.Trim(),
                ["han_muc"] = han,
                ["so_ngay_no"] = ngayNo,
                ["ngay_sinh"] = dtSinh.Checked ? dtSinh.Value.Date : DBNull.Value,
                ["gioi_tinh"] = txtGioi.Text.Trim(),
                ["noi_cap"] = txtNoiCap.Text.Trim(),
            });
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            lblErr.Text = ex.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase)
                ? "Mã khách đã tồn tại"
                : ex.Message;
        }
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
}
