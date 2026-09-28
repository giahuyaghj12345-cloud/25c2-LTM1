using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmWarrantyInvoices : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmWarrantyInvoices()
    {
        BackColor = Ui.Bg;
        var tao = Ui.Primary("Lập hóa đơn");
        tao.Click += (_, _) => Create();
        var bar = Ui.Toolbar();
        bar.Controls.Add(tao);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Hóa đơn bảo hành", "Xuất hóa đơn từ phiếu BH (cộng phụ tùng + tiền công)"));
        Reload();
    }

    void Say(string t, bool ok) { lblMsg.ForeColor = ok ? Ui.Ok : Ui.Danger; lblMsg.Text = t; }

    void Reload()
    {
        try
        {
            WarrantyDb.Ensure();
            grid.DataSource = WarrantyDb.ListHd();
            WarrantyUi.HideId(grid);
        }
        catch (Exception ex) { Say(ex.Message, false); }
    }

    void Create()
    {
        var id = WarrantyUi.PickPhieu(FindForm());
        if (id == null) return;
        try
        {
            var ph = WarrantyDb.GetPhieu(id.Value);
            WarrantyDb.SaveHd(id, "Hóa đơn BH " + (ph?["so_ct"] ?? ""));
            Reload();
            Say("Đã lập hóa đơn", true);
        }
        catch (Exception ex) { Say(ex.Message, false); }
    }
}
