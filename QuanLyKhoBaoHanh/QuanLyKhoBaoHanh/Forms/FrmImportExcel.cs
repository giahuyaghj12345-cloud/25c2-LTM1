using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

/// <summary>Form Import Excel — UX giống AA_ImportExcel (STHINK): duyệt file → sheet → preview → upsert.</summary>
public class FrmImportExcel : Form
{
    public enum ImportMode { Labor, Products, Customers }

    readonly ImportMode mode;
    readonly TextBox txtFile = new() { ReadOnly = true, Width = 420 };
    readonly ComboBox cbSheets = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 180 };
    readonly DataGridView grid = new();
    readonly Label lblHint = new() { AutoSize = true, ForeColor = Ui.Muted };
    string filePath = "";
    readonly Dictionary<string, DataTable> sheets = new(StringComparer.OrdinalIgnoreCase);

    public FrmImportExcel(ImportMode mode)
    {
        this.mode = mode;
        Text = mode switch
        {
            ImportMode.Labor => "Import Excel — Tiền công",
            ImportMode.Products => "Import Excel — Sản phẩm",
            _ => "Import Excel — Khách hàng",
        };
        Size = new Size(920, 620);
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Font = Ui.Body;
        BackColor = Ui.Bg;

        lblHint.Text = mode switch
        {
            ImportMode.Labor => "Cột bắt buộc: ma_tcong / Mã tiền công. Gợi ý: ten_tcong, don_gia, status",
            ImportMode.Products => "Cột bắt buộc: ma_sp / Mã SP. Gợi ý: ten_sp, dvt, sl_ton, vt_ton_kho",
            _ => "Cột bắt buộc: ma_kh / Mã KH. Gợi ý: ten_kh, dien_thoai, dia_chi",
        };

        var top = new FlowLayoutPanel
        {
            Dock = DockStyle.Top,
            Height = 88,
            Padding = new Padding(12, 10, 12, 4),
            WrapContents = true,
        };
        top.Controls.Add(new Label { Text = "Chọn file Excel:", AutoSize = true, Margin = new Padding(0, 8, 8, 0) });
        top.Controls.Add(txtFile);
        var browse = Ui.Ghost("Duyệt...");
        browse.Click += (_, _) => Browse();
        top.Controls.Add(browse);
        var mau = Ui.Ghost("Tải mẫu");
        mau.Click += (_, _) => SaveTemplate();
        top.Controls.Add(mau);
        top.Controls.Add(new Label { Text = "Chọn Sheet:", AutoSize = true, Margin = new Padding(16, 8, 8, 0) });
        top.Controls.Add(cbSheets);
        cbSheets.SelectedIndexChanged += (_, _) => ShowSheet();
        top.Controls.Add(lblHint);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        grid.AllowUserToAddRows = false;

        var bottom = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            Height = 52,
            FlowDirection = FlowDirection.RightToLeft,
            Padding = new Padding(12, 8, 12, 8),
        };
        var cancel = Ui.Ghost("Hủy bỏ");
        cancel.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };
        var import = Ui.Primary("Import");
        import.Width = 110;
        import.Click += (_, _) => DoImport();
        bottom.Controls.Add(cancel);
        bottom.Controls.Add(import);

        Controls.Add(grid);
        Controls.Add(bottom);
        Controls.Add(top);
        Controls.Add(Ui.PageHead("Import dữ liệu từ Excel", "Chọn file → xem trước → Import (thêm mới / cập nhật theo mã)"));
    }

    void Browse()
    {
        using var dlg = new OpenFileDialog
        {
            Filter = "Excel / CSV|*.xlsx;*.xlsm;*.xls;*.csv|Excel|*.xlsx;*.xlsm;*.xls|CSV|*.csv",
            Title = "Chọn file Excel để Import",
        };
        if (dlg.ShowDialog(this) != DialogResult.OK) return;
        filePath = dlg.FileName;
        txtFile.Text = filePath;
        LoadFile();
    }

    void LoadFile()
    {
        sheets.Clear();
        cbSheets.Items.Clear();
        grid.DataSource = null;
        try
        {
            if (filePath.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                var dt = ExcelIo.ReadCsv(filePath);
                sheets["CSV"] = dt;
                cbSheets.Items.Add("CSV");
                cbSheets.SelectedIndex = 0;
                return;
            }
            foreach (var name in ExcelIo.ListSheetNames(filePath))
            {
                var dt = ExcelIo.ReadSheet(filePath, name);
                sheets[name] = dt;
                cbSheets.Items.Add(name);
            }
            if (cbSheets.Items.Count > 0) cbSheets.SelectedIndex = 0;
            else MessageBox.Show(this, "File không có sheet dữ liệu.", Text);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "Lỗi đọc file Excel: " + ex.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    void ShowSheet()
    {
        if (cbSheets.SelectedItem == null) return;
        var name = cbSheets.SelectedItem.ToString()!;
        if (sheets.TryGetValue(name, out var dt))
            grid.DataSource = dt;
    }

    void SaveTemplate()
    {
        using var dlg = new SaveFileDialog
        {
            Filter = "Excel|*.xlsx",
            FileName = mode switch
            {
                ImportMode.Labor => "mau_import_tiencong.xlsx",
                ImportMode.Products => "mau_import_dmsp.xlsx",
                _ => "mau_import_dmkh.xlsx",
            },
        };
        if (dlg.ShowDialog(this) != DialogResult.OK) return;
        try
        {
            if (mode == ImportMode.Labor)
                ExcelIo.WriteTemplate(dlg.FileName,
                    ("ma_tcong", "TC0002"), ("ten_tcong", "Cong thay nhot"), ("don_gia", "150000"), ("status", "1"));
            else if (mode == ImportMode.Products)
                ExcelIo.WriteTemplate(dlg.FileName,
                    ("ma_sp", "SP000010"), ("ten_sp", "Phu tung demo"), ("dvt", "Cai"), ("sl_ton", "20"), ("vt_ton_kho", "1"));
            else
                ExcelIo.WriteTemplate(dlg.FileName,
                    ("ma_kh", "KHDEMO"), ("ten_kh", "Khach demo Excel"), ("dien_thoai", "0900000002"), ("dia_chi", "TP.HCM"));
            MessageBox.Show(this, "Đã lưu mẫu: " + dlg.FileName, Text);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    void DoImport()
    {
        if (cbSheets.SelectedItem == null)
        {
            MessageBox.Show(this, "Vui lòng chọn một Sheet để import.", Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }
        var name = cbSheets.SelectedItem.ToString()!;
        if (!sheets.TryGetValue(name, out var table) || table.Rows.Count == 0)
        {
            MessageBox.Show(this, "Sheet đã chọn không có dữ liệu để import.", Text);
            return;
        }

        string[] keyNames = mode switch
        {
            ImportMode.Labor => ["ma_tcong", "ma tien cong", "mã tiền công", "code", "ma"],
            ImportMode.Products => ["ma_sp", "ma sp", "mã sp", "mã sản phẩm"],
            _ => ["ma_kh", "ma kh", "mã kh", "mã khách"],
        };
        if (ExcelIo.FindColumn(table, keyNames) == null)
        {
            MessageBox.Show(this,
                "Sheet phải có cột khóa.\n" + lblHint.Text,
                Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        try
        {
            var (ins, upd, skip) = mode switch
            {
                ImportMode.Labor => CatalogDb.ImportLaborsFromExcel(table),
                ImportMode.Products => CatalogDb.ImportProductsFromExcel(table),
                _ => CatalogDb.ImportCustomersFromExcel(table),
            };
            MessageBox.Show(this,
                "Import xong.\nThêm mới: " + ins + "\nCập nhật: " + upd + "\nBỏ qua (thiếu mã): " + skip,
                Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            var inner = ex;
            while (inner.InnerException != null) inner = inner.InnerException;
            MessageBox.Show(this, "Lỗi khi import: " + inner.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    public static bool Run(IWin32Window? owner, ImportMode mode)
    {
        using var f = new FrmImportExcel(mode);
        return f.ShowDialog(owner) == DialogResult.OK;
    }

    public static void ExportGrid(IWin32Window? owner, DataTable? data, string fileName)
    {
        if (data == null || data.Rows.Count == 0)
        {
            MessageBox.Show(owner, "Không có dữ liệu để kết xuất.", "Kết xuất Excel");
            return;
        }
        using var dlg = new SaveFileDialog { Filter = "Excel|*.xlsx", FileName = fileName };
        if (dlg.ShowDialog(owner) != DialogResult.OK) return;
        try
        {
            var copy = data.Copy();
            if (copy.Columns.Contains("id")) copy.Columns.Remove("id");
            ExcelIo.WriteTable(dlg.FileName, copy);
            MessageBox.Show(owner, "Đã kết xuất: " + dlg.FileName, "Kết xuất Excel");
        }
        catch (Exception ex)
        {
            MessageBox.Show(owner, ex.Message, "Kết xuất Excel", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
