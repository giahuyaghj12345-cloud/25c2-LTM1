using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmCustomers : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmCustomers()
    {
        Text = "Danh mục khách hàng";
        BackColor = Ui.Bg;
        var neu = Ui.Primary("Mới");
        neu.Click += (_, _) => OpenEdit(null);
        var sua = Ui.Ghost("Sửa");
        sua.Click += (_, _) =>
        {
            var id = CurrentId();
            if (id == null) { Say("Chọn dòng cần sửa", false); return; }
            OpenEdit(id);
        };
        var del = Ui.Ghost("Xóa", true);
        del.Click += (_, _) => Delete();
        var bar = Ui.Toolbar();
        bar.Controls.Add(neu);
        bar.Controls.Add(sua);
        bar.Controls.Add(del);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) OpenEdit(CurrentId()); };
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Danh mục khách hàng", "Bấm Mới để thêm khách — double-click để sửa. Mã khách 3 ký tự đầu dùng khi tạo Serial."));
        LoadList();
    }

    void Say(string text, bool ok)
    {
        lblMsg.ForeColor = ok ? Ui.Ok : Ui.Danger;
        lblMsg.Text = text;
    }

    void LoadList()
    {
        try
        {
            grid.DataSource = CatalogDb.ListCustomers();
            if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
        }
        catch (Exception ex)
        {
            Say("Không tải được khách hàng: " + ex.Message, false);
        }
    }

    string? CurrentId()
    {
        if (grid.CurrentRow == null) return null;
        var v = Convert.ToString(grid.CurrentRow.Cells["id"].Value);
        return string.IsNullOrWhiteSpace(v) ? null : v;
    }

    void OpenEdit(string? id)
    {
        using var f = new FrmCustomerEdit(id);
        if (f.ShowDialog(FindForm()) == DialogResult.OK)
        {
            LoadList();
            Say(id == null ? "Đã thêm khách hàng" : "Đã cập nhật khách hàng", true);
        }
    }

    void Delete()
    {
        var id = CurrentId();
        if (id == null)
        {
            Say("Bấm một dòng trên bảng rồi bấm Xóa", false);
            return;
        }
        if (MessageBox.Show(FindForm(), "Xóa khách hàng này?", "Xóa", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
        try
        {
            CatalogDb.DeleteCustomer(id);
            LoadList();
            Say("Đã xóa khách hàng", true);
        }
        catch (Exception ex)
        {
            Say("Không xóa được: " + ex.Message, false);
        }
    }

    public static DataRow? Pick(IWin32Window? owner)
    {
        using var f = new FrmCustomerPick();
        return f.ShowDialog(owner) == DialogResult.OK ? f.Selected : null;
    }
}

sealed class FrmCustomerPick : Form
{
    readonly DataGridView grid = new();
    public DataRow? Selected { get; private set; }

    public FrmCustomerPick()
    {
        Text = "Chọn khách hàng";
        FormBorderStyle = FormBorderStyle.Sizable;
        StartPosition = FormStartPosition.CenterParent;
        Size = new Size(780, 480);
        Font = Ui.Body;
        BackColor = Ui.Bg;

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.MultiSelect = false;
        grid.DataSource = CatalogDb.ListCustomers();
        if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
        grid.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) AcceptPick(); };

        var chon = Ui.Primary("Chọn");
        chon.Click += (_, _) => AcceptPick();
        var moi = Ui.Ghost("Thêm mới");
        moi.Click += (_, _) =>
        {
            using var edit = new FrmCustomerEdit();
            if (edit.ShowDialog(this) == DialogResult.OK)
            {
                grid.DataSource = CatalogDb.ListCustomers();
                if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
            }
        };
        var huy = Ui.Ghost("Hủy bỏ");
        huy.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };
        var foot = Ui.DialogFooter(chon, huy);
        foot.Controls.Add(moi);

        Controls.Add(grid);
        Controls.Add(foot);
    }

    void AcceptPick()
    {
        if (grid.CurrentRow == null) return;
        var id = Convert.ToString(grid.CurrentRow.Cells["id"].Value);
        if (string.IsNullOrWhiteSpace(id)) return;
        Selected = CatalogDb.LoadCustomer(id);
        if (Selected == null) return;
        DialogResult = DialogResult.OK;
        Close();
    }
}
