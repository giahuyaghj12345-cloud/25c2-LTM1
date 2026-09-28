using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmWarrantyLookup : UserControl
{
    readonly LookupBox txtSerial = new("Gõ số serial...");
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmWarrantyLookup()
    {
        BackColor = Ui.Bg;
        var bar = Ui.Toolbar();
        txtSerial.Width = 360;
        txtSerial.Bind(WarrantyUi.Serials());
        txtSerial.Picked += (_, _) => Search();
        var tim = Ui.Primary("Tra cứu");
        tim.Click += (_, _) => Search();
        bar.Controls.Add(new Label { Text = "Serial", AutoSize = true, Padding = new Padding(0, 10, 8, 0), ForeColor = Ui.Muted });
        bar.Controls.Add(txtSerial);
        bar.Controls.Add(tim);
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Tra cứu serial", "Lịch sử serial: bảo hành, phiếu BH, kho BH, thu, hóa đơn"));
        try { WarrantyDb.Ensure(); } catch { /* */ }
    }

    void Search()
    {
        var s = txtSerial.Code.Length > 0 ? txtSerial.Code : txtSerial.Text.Trim();
        if (s.Length == 0)
        {
            lblMsg.ForeColor = Ui.Danger;
            lblMsg.Text = "Nhập số serial.";
            return;
        }
        try
        {
            grid.DataSource = WarrantyDb.TraCuuSerial(s);
            lblMsg.ForeColor = Ui.Ok;
            lblMsg.Text = grid.Rows.Count + " dòng";
        }
        catch (Exception ex)
        {
            lblMsg.ForeColor = Ui.Danger;
            lblMsg.Text = ex.Message;
        }
    }
}
