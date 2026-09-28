using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmWarrantyQuotes : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmWarrantyQuotes()
    {
        BackColor = Ui.Bg;
        var tao = Ui.Primary("Lập từ phiếu BH");
        tao.Click += (_, _) => Create();
        var duyet = Ui.Ghost("Duyệt");
        duyet.Click += (_, _) => Duyet();
        var bar = Ui.Toolbar();
        bar.Controls.Add(tao);
        bar.Controls.Add(duyet);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Báo giá bảo hành", "Lấy phụ tùng / tiền công từ phiếu BH — duyệt trước khi thu / xuất HĐ"));
        Reload();
    }

    void Say(string t, bool ok) { lblMsg.ForeColor = ok ? Ui.Ok : Ui.Danger; lblMsg.Text = t; }

    void Reload()
    {
        try
        {
            WarrantyDb.Ensure();
            grid.DataSource = WarrantyDb.ListBg();
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
            WarrantyDb.SaveBg(id, "Báo giá từ phiếu bảo hành");
            Reload();
            Say("Đã lập báo giá", true);
        }
        catch (Exception ex) { Say(ex.Message, false); }
    }

    void Duyet()
    {
        var id = WarrantyUi.CurrentId(grid);
        if (id == null) { Say("Chọn một báo giá", false); return; }
        WarrantyDb.DuyetBg(id.Value);
        Reload();
        Say("Đã duyệt báo giá", true);
    }
}
