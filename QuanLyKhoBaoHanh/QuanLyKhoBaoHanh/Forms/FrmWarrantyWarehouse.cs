using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmWarrantyWarehouse : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmWarrantyWarehouse()
    {
        BackColor = Ui.Bg;
        var bar = Ui.Toolbar();
        bar.Controls.Add(Btn("7. Xuất PT BH", 7, "xuat"));
        bar.Controls.Add(Btn("8. Đổi 1-1", 8, "xuat"));
        bar.Controls.Add(Btn("10. Nhập sau BH", 10, "nhap"));
        bar.Controls.Add(Btn("10. Xuất giao KH", 10, "xuat"));
        bar.Controls.Add(Btn("11. Nhập serial cũ", 11, "nhap"));
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = true;
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Kho bảo hành", "MGD 7 xuất PT · 8 đổi 1-1 · 10 nhập/xuất sau BH · 11 nhập serial cũ"));
        Reload();
    }

    Button Btn(string text, int gd, string nx)
    {
        var b = Ui.Ghost(text);
        b.Click += (_, _) => Open(gd, nx);
        return b;
    }

    void Say(string t, bool ok) { lblMsg.ForeColor = ok ? Ui.Ok : Ui.Danger; lblMsg.Text = t; }

    void Reload()
    {
        try
        {
            WarrantyDb.Ensure();
            grid.DataSource = WarrantyDb.ListKho();
            WarrantyUi.HideId(grid);
        }
        catch (Exception ex) { Say(ex.Message, false); }
    }

    void Open(int gd, string nx)
    {
        using var f = new FrmWarrantyWhEdit(gd, nx);
        if (f.ShowDialog(FindForm()) == DialogResult.OK)
        {
            Reload();
            Say("Đã ghi phiếu " + WarrantyDb.GdName(gd), true);
        }
    }
}

public class FrmWarrantyWhEdit : Form
{
    readonly int maGd;
    readonly string loaiNx;
    Guid? phieuId;
    readonly Label lblPhieu = new() { AutoSize = false, Height = 28, TextAlign = ContentAlignment.MiddleLeft };
    readonly LookupBox txtSp = new("Gõ mã phụ tùng...");
    readonly RoundBox txtSerialMoi = new();
    readonly DataGridView grid = new();
    readonly DataTable ct = WarrantyDb.EmptyKhoCt();
    readonly Label lblErr = new() { ForeColor = Ui.Danger, AutoSize = false, Height = 22, Dock = DockStyle.Bottom, Padding = new Padding(12, 2, 8, 0) };

    public FrmWarrantyWhEdit(int gd, string nx)
    {
        maGd = gd;
        loaiNx = nx;
        Text = WarrantyDb.GdName(gd) + (gd == 10 ? " — " + (nx == "nhap" ? "Nhập" : "Xuất giao") : "");
        Size = new Size(860, 560);
        StartPosition = FormStartPosition.CenterParent;
        MinimizeBox = false;
        Font = Ui.Body;
        BackColor = Ui.Bg;

        var bar = Ui.Toolbar();
        var chon = Ui.Primary("Chọn phiếu BH");
        chon.Click += (_, _) =>
        {
            var id = WarrantyUi.PickPhieu(this);
            if (id == null) return;
            phieuId = id;
            var ph = WarrantyDb.GetPhieu(id.Value);
            lblPhieu.Text = ph == null ? "" : $"{ph["so_ct"]}  |  {ph["ten_kh"]}  |  Serial {ph["so_serial"]}";
            Prefill(ph);
        };
        bar.Controls.Add(chon);
        bar.Controls.Add(lblPhieu);
        lblPhieu.Width = 480;

        var line = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 48, Padding = new Padding(12, 8, 12, 4) };
        txtSp.Width = 320;
        txtSp.Bind(WarrantyUi.Products());
        txtSp.Picked += (_, _) => AddSp();
        var add = Ui.Ghost("Thêm dòng");
        add.Click += (_, _) => AddSp();
        var xoa = Ui.Ghost("Xóa dòng", true);
        xoa.Click += (_, _) =>
        {
            if (grid.CurrentRow != null && !grid.CurrentRow.IsNewRow)
                grid.Rows.Remove(grid.CurrentRow);
        };
        line.Controls.Add(new Label { Text = "Vật tư", AutoSize = true, Padding = new Padding(0, 8, 8, 0), ForeColor = Ui.Muted });
        line.Controls.Add(txtSp);
        line.Controls.Add(add);
        line.Controls.Add(xoa);
        if (maGd == 8)
        {
            txtSerialMoi.Width = 180;
            line.Controls.Add(new Label { Text = "Serial mới", AutoSize = true, Padding = new Padding(12, 8, 8, 0), ForeColor = Ui.Muted });
            line.Controls.Add(txtSerialMoi);
        }

        grid.Dock = DockStyle.Fill;
        grid.AutoGenerateColumns = false;
        grid.DataSource = ct;
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Mã SP", DataPropertyName = "ma_sp", Width = 140 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Tên", DataPropertyName = "ten_sp", Width = 260 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "SL", DataPropertyName = "so_luong", Width = 70 });
        grid.Columns.Add(new DataGridViewTextBoxColumn { HeaderText = "Serial", DataPropertyName = "so_serial", Width = 160 });
        Ui.StyleGrid(grid);

        var luu = Ui.Primary("Ghi sổ");
        luu.Click += (_, _) => Save();
        var dong = Ui.Ghost("Đóng");
        dong.Click += (_, _) => Close();

        Controls.Add(grid);
        Controls.Add(line);
        Controls.Add(bar);
        Controls.Add(lblErr);
        Controls.Add(Ui.DialogFooter(luu, dong));
    }

    void Prefill(DataRow? ph)
    {
        if (ph == null) return;
        ct.Rows.Clear();
        if (maGd is 7)
        {
            foreach (DataRow r in WarrantyDb.GetPhieuCt(phieuId!.Value).Rows)
            {
                if (Convert.ToString(r["loai"]) != "pt") continue;
                var n = ct.NewRow();
                n["ma_sp"] = r["ma"];
                n["ten_sp"] = r["ten"];
                n["so_luong"] = r["so_luong"];
                n["so_serial"] = "";
                ct.Rows.Add(n);
            }
        }
        if (maGd is 8 or 11)
        {
            var n = ct.NewRow();
            n["ma_sp"] = ph["ma_sp"];
            n["ten_sp"] = ph["ten_sp"];
            n["so_luong"] = 1m;
            n["so_serial"] = ph["so_serial"];
            ct.Rows.Add(n);
        }
    }

    void AddSp()
    {
        var p = WarrantyDb.FindProduct(txtSp.Code);
        if (p == null) { lblErr.Text = "Không tìm thấy mã vật tư."; return; }
        var n = ct.NewRow();
        n["ma_sp"] = p["ma_sp"];
        n["ten_sp"] = p["ten_sp"];
        n["so_luong"] = 1m;
        n["so_serial"] = "";
        ct.Rows.Add(n);
        txtSp.Clear();
        lblErr.Text = "";
    }

    void Save()
    {
        lblErr.Text = "";
        if (phieuId == null && maGd != 11)
        {
            lblErr.Text = "Chọn phiếu bảo hành.";
            return;
        }
        if (ct.Rows.Count == 0)
        {
            lblErr.Text = "Thêm ít nhất một dòng vật tư.";
            return;
        }
        try
        {
            WarrantyDb.SaveKho(phieuId, maGd, loaiNx, txtSerialMoi.Text.Trim(), ct);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex) { lblErr.Text = ex.Message; }
    }
}
