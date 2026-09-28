using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

static class WarrantyUi
{
    public static Guid? CurrentId(DataGridView grid)
    {
        if (grid.CurrentRow == null) return null;
        var v = Convert.ToString(grid.CurrentRow.Cells["id"].Value);
        return Guid.TryParse(v, out var g) ? g : null;
    }

    public static Guid? PickPhieu(IWin32Window? owner)
    {
        using var f = new FrmWarrantyPick();
        return f.ShowDialog(owner) == DialogResult.OK ? f.SelectedId : null;
    }

    public static void HideId(DataGridView grid)
    {
        if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
    }

    public static AutoCompleteStringCollection Customers()
    {
        try { return Ui.SuggestSource(CatalogDb.ListCustomerCodes(), "ma_kh", "ten_kh"); }
        catch { return []; }
    }

    public static AutoCompleteStringCollection Products()
    {
        try { return Ui.SuggestSource(SqlDb.Query("SELECT ma_sp, ten_sp FROM dbo.dmsp"), "ma_sp", "ten_sp"); }
        catch { return []; }
    }

    public static AutoCompleteStringCollection Labors()
    {
        CatalogDb.EnsureLabor();
        try { return Ui.SuggestSource(SqlDb.Query("SELECT code, name FROM dbo.labor_costs"), "code", "name"); }
        catch { return []; }
    }

    public static AutoCompleteStringCollection Serials()
    {
        try { return Ui.SuggestSource(SqlDb.Query("SELECT so_serial, ISNULL(ten_sp,N'') AS ten FROM dbo.dm_serial"), "so_serial", "ten"); }
        catch { return []; }
    }
}

public class FrmWarrantyTickets : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmWarrantyTickets()
    {
        BackColor = Ui.Bg;
        var neu = Ui.Primary("Mới");
        neu.Click += (_, _) => Open(null);
        var sua = Ui.Ghost("Sửa");
        sua.Click += (_, _) => Open(WarrantyUi.CurrentId(grid));
        var xac = Ui.Ghost("Xác nhận");
        xac.Click += (_, _) => SetStatus("xac_nhan");
        var suaXe = Ui.Ghost("Đang sửa");
        suaXe.Click += (_, _) => SetStatus("dang_sua");
        var cho = Ui.Ghost("Chờ PT");
        cho.Click += (_, _) => SetStatus("cho_pt");
        var xong = Ui.Ghost("Hoàn tất");
        xong.Click += (_, _) => SetStatus("hoan_tat");
        var giao = Ui.Ghost("Đã giao");
        giao.Click += (_, _) => SetStatus("da_giao");
        var huy = Ui.Ghost("Hủy", true);
        huy.Click += (_, _) => SetStatus("huy");
        var xoa = Ui.Ghost("Xóa", true);
        xoa.Click += (_, _) => Delete();

        var bar = Ui.Toolbar();
        foreach (var b in new[] { neu, sua, xac, suaXe, cho, xong, giao, huy, xoa })
            bar.Controls.Add(b);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Open(WarrantyUi.CurrentId(grid)); };
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Phiếu bảo hành", "Tiếp nhận máy — serial, khách, yêu cầu, phụ tùng / tiền công"));
        Reload();
    }

    void Say(string text, bool ok)
    {
        lblMsg.ForeColor = ok ? Ui.Ok : Ui.Danger;
        lblMsg.Text = text;
    }

    void Reload()
    {
        try
        {
            WarrantyDb.Ensure();
            grid.DataSource = WarrantyDb.ListPhieu();
            WarrantyUi.HideId(grid);
        }
        catch (Exception ex)
        {
            Say("Không tải được phiếu: " + ex.Message, false);
        }
    }

    void Open(Guid? id)
    {
        using var f = new FrmWarrantyEdit(id);
        if (f.ShowDialog(FindForm()) == DialogResult.OK)
        {
            Reload();
            Say(id == null ? "Đã lập phiếu bảo hành" : "Đã cập nhật phiếu", true);
        }
    }

    void SetStatus(string status)
    {
        var id = WarrantyUi.CurrentId(grid);
        if (id == null) { Say("Chọn một phiếu trên bảng", false); return; }
        try
        {
            WarrantyDb.SetStatus(id.Value, status);
            Reload();
            Say("Trạng thái: " + WarrantyDb.StatusName(status), true);
        }
        catch (Exception ex) { Say(ex.Message, false); }
    }

    void Delete()
    {
        var id = WarrantyUi.CurrentId(grid);
        if (id == null) { Say("Chọn phiếu cần xóa", false); return; }
        if (MessageBox.Show(FindForm(), "Xóa phiếu bảo hành này?", "Xóa", MessageBoxButtons.YesNo) != DialogResult.Yes)
            return;
        try
        {
            WarrantyDb.DeletePhieu(id.Value);
            Reload();
            Say("Đã xóa phiếu", true);
        }
        catch (Exception ex) { Say("Không xóa được: " + ex.Message, false); }
    }
}

public class FrmWarrantyPick : Form
{
    readonly DataGridView grid = new();
    public Guid? SelectedId { get; private set; }

    public FrmWarrantyPick()
    {
        Text = "Chọn phiếu bảo hành";
        Size = new Size(820, 480);
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Font = Ui.Body;
        BackColor = Ui.Bg;

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Accept(); };
        Controls.Add(grid);

        var ok = Ui.Primary("Chọn");
        ok.Click += (_, _) => Accept();
        var cancel = Ui.Ghost("Đóng");
        cancel.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };
        Controls.Add(Ui.DialogFooter(ok, cancel));

        try
        {
            WarrantyDb.Ensure();
            grid.DataSource = WarrantyDb.ListPhieu();
            WarrantyUi.HideId(grid);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, Text);
        }
    }

    void Accept()
    {
        SelectedId = WarrantyUi.CurrentId(grid);
        if (SelectedId == null) { MessageBox.Show(this, "Chọn một phiếu."); return; }
        DialogResult = DialogResult.OK;
        Close();
    }
}
