using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmProducts : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmProducts()
    {
        Text = "Danh mục sản phẩm";
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
        var import = Ui.Ghost("Import Excel");
        import.Click += (_, _) =>
        {
            if (FrmImportExcel.Run(FindForm(), FrmImportExcel.ImportMode.Products))
            {
                LoadList();
                Say("Đã import Excel sản phẩm", true);
            }
        };
        var export = Ui.Ghost("Kết xuất");
        export.Click += (_, _) =>
        {
            try { FrmImportExcel.ExportGrid(FindForm(), CatalogDb.ListProducts(), "dmsp.xlsx"); }
            catch (Exception ex) { Say(ex.Message, false); }
        };
        var bar = Ui.Toolbar();
        bar.Controls.Add(neu);
        bar.Controls.Add(sua);
        bar.Controls.Add(del);
        bar.Controls.Add(import);
        bar.Controls.Add(export);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) OpenEdit(CurrentId()); };
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Danh mục sản phẩm", "Bấm Mới để thêm vật tư — double-click để sửa"));
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
            grid.DataSource = CatalogDb.ListProducts();
            if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
        }
        catch (Exception ex)
        {
            Say("Không tải được sản phẩm: " + ex.Message, false);
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
        using var f = new FrmProductEdit(id);
        if (f.ShowDialog(FindForm()) == DialogResult.OK)
        {
            LoadList();
            Say(id == null ? "Đã thêm vật tư" : "Đã cập nhật vật tư", true);
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
        if (MessageBox.Show(FindForm(), "Xóa sản phẩm này?", "Xóa", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
        try
        {
            SqlDb.Execute("DELETE FROM dbo.dmsp WHERE id=@id", SqlDb.P("@id", CatalogDb.KeyParam(id)));
            LoadList();
            Say("Đã xóa sản phẩm", true);
        }
        catch (Exception ex)
        {
            Say("Không xóa được: " + ex.Message, false);
            MessageBox.Show(FindForm(), "Không xóa được (có thể đang dùng trong phiếu xuất): " + ex.Message, Text);
        }
    }
}
