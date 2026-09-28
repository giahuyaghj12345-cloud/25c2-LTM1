using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmLaborEdit : Form
{
    readonly string? editingId;
    readonly TextBox txtCode = Ui.Box();
    readonly TextBox txtName = Ui.Box();
    readonly TextBox txtName2 = Ui.Box();
    readonly TextBox txtAmount = Ui.Box();
    readonly TextBox txtStatus = Ui.Box();
    readonly TextBox txtNote = Ui.Box();
    readonly Label lblErr = new() { ForeColor = Ui.Danger, AutoSize = true, Padding = new Padding(12, 4, 8, 0) };

    public FrmLaborEdit(string? id = null)
    {
        editingId = id;
        Text = id == null ? "Thêm tiền công BH" : "Sửa tiền công BH";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(540, 380);
        Font = Ui.Body;
        BackColor = Ui.Bg;

        var tabs = new TabControl { Dock = DockStyle.Fill, Padding = new Point(8, 4) };
        var tab1 = new TabPage("1. Thông tin chính") { Padding = new Padding(12), BackColor = Ui.Bg };
        var tab2 = new TabPage("2. Thông tin khác") { Padding = new Padding(12), BackColor = Ui.Bg };

        var main = new FlowLayoutPanel { Dock = DockStyle.Fill, WrapContents = true };
        txtCode.Width = 490; txtName.Width = 490; txtName2.Width = 310; txtAmount.Width = 160;
        txtStatus.Width = 80; txtStatus.Text = "1";
        main.Controls.Add(Ui.FormField("Mã tiền công", txtCode, 490));
        main.Controls.Add(Ui.FormField("Tên tiền công", txtName, 490));
        main.Controls.Add(Ui.FormField("Tên 2", txtName2, 310));
        main.Controls.Add(Ui.FormField("Đơn giá (VAT)", txtAmount, 160));
        var stWrap = new Panel { Width = 490, Height = 48, Margin = new Padding(0, 0, 10, 2) };
        stWrap.Controls.Add(Ui.FormField("Trạng thái", txtStatus, 80));
        stWrap.Controls.Add(new Label
        {
            Text = "0 - Không sử dụng, 1 - Sử dụng",
            AutoSize = true,
            Location = new Point(100, 24),
            ForeColor = Ui.Muted,
        });
        main.Controls.Add(stWrap);
        tab1.Controls.Add(main);

        txtNote.Multiline = true;
        txtNote.Height = 90;
        txtNote.Width = 490;
        var other = new FlowLayoutPanel { Dock = DockStyle.Fill };
        other.Controls.Add(Ui.FormField("Ghi chú", txtNote, 490));
        tab2.Controls.Add(other);

        tabs.TabPages.Add(tab1);
        tabs.TabPages.Add(tab2);

        var nhan = Ui.Primary("Nhận");
        nhan.Click += (_, _) => Accept();
        var huy = Ui.Ghost("Hủy bỏ");
        huy.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };

        AcceptButton = nhan;
        CancelButton = huy;
        Controls.Add(tabs);
        Controls.Add(lblErr);
        lblErr.Dock = DockStyle.Bottom;
        Controls.Add(Ui.DialogFooter(nhan, huy));

        if (id != null) LoadRow(id);
        else txtCode.Text = CatalogDb.NextLaborCode();
        Ui.ApplyTree(this);
    }

    void LoadRow(string id)
    {
        var row = CatalogDb.LoadLabor(id);
        if (row == null) return;
        txtCode.Text = Str(row, "code");
        txtName.Text = Str(row, "name");
        txtName2.Text = Str(row, "name2");
        txtAmount.Text = Str(row, "amount");
        txtNote.Text = Str(row, "note");
        txtStatus.Text = string.IsNullOrWhiteSpace(Str(row, "status")) ? "1" : Str(row, "status");
    }

    void Accept()
    {
        if (string.IsNullOrWhiteSpace(txtName.Text))
        {
            lblErr.Text = "Nhập tên tiền công";
            return;
        }
        decimal.TryParse(txtAmount.Text.Replace(",", "."), System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var amount);
        var status = txtStatus.Text.Trim() == "0" ? "0" : "1";
        try
        {
            CatalogDb.SaveLabor(editingId, txtCode.Text.Trim(), txtName.Text.Trim(), txtName2.Text.Trim(),
                amount, txtNote.Text.Trim(), status);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            lblErr.Text = ex.Message;
        }
    }

    static string Str(System.Data.DataRow row, string col)
    {
        if (!row.Table.Columns.Contains(col) || row[col] == DBNull.Value) return "";
        return Convert.ToString(row[col]) ?? "";
    }
}
