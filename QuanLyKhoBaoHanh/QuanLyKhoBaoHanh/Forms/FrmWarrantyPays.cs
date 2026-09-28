using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmWarrantyPays : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmWarrantyPays()
    {
        BackColor = Ui.Bg;
        var tao = Ui.Primary("Thu phụ tùng");
        tao.Click += (_, _) => Create();
        var bar = Ui.Toolbar();
        bar.Controls.Add(tao);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Thu phụ tùng bảo hành", "Thu tiền phụ tùng / công từ phiếu BH đã báo giá"));
        Reload();
    }

    void Say(string t, bool ok) { lblMsg.ForeColor = ok ? Ui.Ok : Ui.Danger; lblMsg.Text = t; }

    void Reload()
    {
        try
        {
            WarrantyDb.Ensure();
            grid.DataSource = WarrantyDb.ListThu();
            WarrantyUi.HideId(grid);
        }
        catch (Exception ex) { Say(ex.Message, false); }
    }

    void Create()
    {
        using var f = new FrmWarrantyPayEdit();
        if (f.ShowDialog(FindForm()) == DialogResult.OK)
        {
            Reload();
            Say("Đã lập phiếu thu", true);
        }
    }
}

public class FrmWarrantyPayEdit : Form
{
    Guid? phieuId;
    readonly Label lblPhieu = new() { AutoSize = false, Height = 28, Dock = DockStyle.Top, Padding = new Padding(12, 8, 8, 0) };
    readonly TextBox txtTien = Ui.Box();
    readonly ComboBox cboHt = new() { DropDownStyle = ComboBoxStyle.DropDownList };
    readonly TextBox txtDg = Ui.Box();
    readonly Label lblErr = new() { ForeColor = Ui.Danger, AutoSize = false, Height = 22, Dock = DockStyle.Bottom, Padding = new Padding(12, 2, 8, 0) };

    public FrmWarrantyPayEdit()
    {
        Text = "Thu phụ tùng BH";
        Size = new Size(520, 340);
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Font = Ui.Body;
        BackColor = Ui.Bg;
        cboHt.Items.AddRange(["Tiền mặt", "Chuyển khoản", "Công nợ"]);
        cboHt.SelectedIndex = 0;

        var chon = Ui.Primary("Chọn phiếu BH");
        chon.Click += (_, _) =>
        {
            var id = WarrantyUi.PickPhieu(this);
            if (id == null) return;
            phieuId = id;
            var ph = WarrantyDb.GetPhieu(id.Value);
            if (ph == null) return;
            lblPhieu.Text = $"{ph["so_ct"]}  |  {ph["ten_kh"]}  |  {ph["so_serial"]}";
            decimal tong = 0;
            foreach (System.Data.DataRow r in WarrantyDb.GetPhieuCt(id.Value).Rows)
                tong += r["tien"] == DBNull.Value ? 0 : Convert.ToDecimal(r["tien"]);
            txtTien.Text = tong.ToString("0.##");
            txtDg.Text = "Thu PT/công phiếu " + ph["so_ct"];
        };

        var body = new FlowLayoutPanel { Dock = DockStyle.Fill, Padding = new Padding(16, 8, 16, 8) };
        body.Controls.Add(Ui.FormField("Số tiền", txtTien, 220));
        body.Controls.Add(Ui.FormField("Hình thức", cboHt, 180));
        txtDg.Width = 420;
        body.Controls.Add(Ui.FormField("Diễn giải", txtDg, 420));

        var luu = Ui.Primary("Lưu");
        luu.Click += (_, _) => Save();
        var dong = Ui.Ghost("Đóng");
        dong.Click += (_, _) => Close();

        var bar = Ui.Toolbar();
        bar.Controls.Add(chon);
        Controls.Add(body);
        Controls.Add(lblPhieu);
        Controls.Add(bar);
        Controls.Add(lblErr);
        Controls.Add(Ui.DialogFooter(luu, dong));
    }

    void Save()
    {
        lblErr.Text = "";
        if (phieuId == null) { lblErr.Text = "Chọn phiếu bảo hành."; return; }
        if (!decimal.TryParse(txtTien.Text, out var tien) || tien <= 0)
        {
            lblErr.Text = "Nhập số tiền > 0.";
            return;
        }
        try
        {
            WarrantyDb.SaveThu(phieuId, tien, Convert.ToString(cboHt.SelectedItem) ?? "", txtDg.Text.Trim());
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex) { lblErr.Text = ex.Message; }
    }
}
