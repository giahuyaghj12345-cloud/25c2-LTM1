using System.Data;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmLabors : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8, 8, 8, 0) };

    public FrmLabors()
    {
        Text = "Danh mục tiền công";
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
        Controls.Add(Ui.PageHead("Danh mục tiền công", "Bấm Mới để thêm tiền công — double-click để sửa"));
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
            CatalogDb.EnsureLabor();
            grid.DataSource = SqlDb.Query("SELECT id, code AS [Mã], name AS [Tên], amount AS [Số tiền], note AS [Ghi chú] FROM dbo.labor_costs ORDER BY code");
            if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
        }
        catch (Exception ex)
        {
            Say("Không tải được tiền công: " + ex.Message, false);
            MessageBox.Show(FindForm(), "Không tải được tiền công: " + ex.Message, Text);
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
        using var f = new FrmLaborEdit(id);
        if (f.ShowDialog(FindForm()) == DialogResult.OK)
        {
            LoadList();
            Say(id == null ? "Đã thêm tiền công" : "Đã cập nhật tiền công", true);
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
        if (MessageBox.Show(FindForm(), "Xóa khoản tiền công này?", "Xóa", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
        try
        {
            SqlDb.Execute("DELETE FROM dbo.labor_costs WHERE id=@id", SqlDb.P("@id", Guid.Parse(id)));
            LoadList();
            Say("Đã xóa tiền công", true);
        }
        catch (Exception ex)
        {
            Say("Không xóa được: " + ex.Message, false);
            MessageBox.Show(FindForm(), "Không xóa được: " + ex.Message, Text);
        }
    }
}

public class FrmInventory : UserControl
{
    public FrmInventory()
    {
        Text = "Tồn kho sản phẩm";
        BackColor = Ui.Bg;
        var grid = new DataGridView { Dock = DockStyle.Fill, ReadOnly = true };
        Ui.StyleGrid(grid);
        Controls.Add(grid);
        Controls.Add(Ui.PageHead("Tồn kho sản phẩm", "Các sản phẩm được đánh dấu theo dõi tồn kho"));
        try
        {
            grid.DataSource = CatalogDb.ListProducts();
        }
        catch (Exception ex)
        {
            MessageBox.Show("Không tải được tồn kho: " + ex.Message);
        }
    }
}

public class FrmProfile : UserControl
{
    readonly TextBox txtUser = Ui.Box();
    readonly TextBox txtEmail = Ui.Box();
    readonly TextBox txtPhone = Ui.Box();
    readonly TextBox txtCccd = Ui.Box();
    readonly TextBox txtAddress = Ui.Box();
    readonly TextBox txtOld = Ui.Box();
    readonly TextBox txtNew = Ui.Box();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8) };
    readonly AvatarView avt = new() { Size = new Size(88, 88), Location = new Point(4, 10) };
    string? pendingFile;

    public FrmProfile()
    {
        Text = "Hồ sơ";
        BackColor = Ui.Bg;
        var card = Ui.Card(520);
        card.Dock = DockStyle.Fill;
        var t = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 7,
            Padding = new Padding(8),
        };
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        t.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        t.RowStyles.Add(new RowStyle(SizeType.Absolute, 112));
        for (var i = 0; i < 6; i++)
            t.RowStyles.Add(new RowStyle(SizeType.Absolute, 72));

        var pick = Ui.Ghost("Chọn ảnh đại diện");
        pick.Location = new Point(108, 28);
        pick.Click += (_, _) => PickAvatar();
        var hint = new Label
        {
            Text = "JPG, PNG — tối đa 2 MB",
            ForeColor = Ui.Muted,
            Font = Ui.Subtitle,
            AutoSize = true,
            Location = new Point(108, 70),
        };
        var avtBox = new Panel { Dock = DockStyle.Fill, Padding = new Padding(4, 2, 8, 8) };
        avtBox.Controls.Add(avt);
        avtBox.Controls.Add(pick);
        avtBox.Controls.Add(hint);
        avt.Click += (_, _) => PickAvatar();
        t.Controls.Add(avtBox, 0, 0);
        t.SetColumnSpan(avtBox, 2);

        Add(t, "Tên đăng nhập", txtUser, 0, 1);
        Add(t, "Email", txtEmail, 1, 1);
        Add(t, "Số điện thoại", txtPhone, 0, 2);
        Add(t, "CCCD", txtCccd, 1, 2);
        Add(t, "Địa chỉ", txtAddress, 0, 3, 2);
        var role = Ui.Box();
        role.Text = Session.RoleLabel;
        role.ReadOnly = true;
        role.BackColor = Ui.Bg;
        Add(t, "Vai trò", role, 0, 4);
        txtOld.UseSystemPasswordChar = true;
        txtNew.UseSystemPasswordChar = true;
        Add(t, "Mật khẩu hiện tại", txtOld, 0, 5);
        Add(t, "Mật khẩu mới", txtNew, 1, 5);
        var save = Ui.Primary("Lưu thay đổi");
        save.Click += (_, _) => Save();
        var bar = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 48, Padding = new Padding(8, 4, 8, 8) };
        bar.Controls.Add(save);
        bar.Controls.Add(lblMsg);

        txtUser.Text = Session.Username;
        txtEmail.Text = Session.Email;
        txtPhone.Text = Session.Phone;
        txtCccd.Text = Session.Cccd;
        txtAddress.Text = Session.Address;
        avt.SetFrom(Session.Avatar, Session.Username);

        card.Controls.Add(t);
        card.Controls.Add(bar);
        Controls.Add(card);
        Controls.Add(Ui.PageHead("Hồ sơ người dùng", "Cập nhật ảnh đại diện, thông tin cá nhân và mật khẩu"));
    }

    void PickAvatar()
    {
        using var dlg = new OpenFileDialog
        {
            Title = "Chọn ảnh đại diện",
            Filter = "Ảnh|*.jpg;*.jpeg;*.png;*.bmp;*.gif|Tất cả|*.*",
        };
        if (dlg.ShowDialog(FindForm()) != DialogResult.OK) return;
        var info = new FileInfo(dlg.FileName);
        if (info.Length > 2 * 1024 * 1024)
        {
            lblMsg.ForeColor = Ui.Danger;
            lblMsg.Text = "Ảnh tối đa 2 MB";
            return;
        }
        pendingFile = dlg.FileName;
        avt.SetFile(pendingFile, txtUser.Text);
        lblMsg.Text = "";
    }

    static void Add(TableLayoutPanel t, string label, Control c, int col, int row, int span = 1)
    {
        while (t.RowCount <= row + 1) t.RowCount++;
        var box = new Panel { Dock = DockStyle.Fill, Padding = new Padding(4, 2, 8, 8) };
        c.Dock = DockStyle.Bottom;
        c.Height = 32;
        box.Controls.Add(c);
        box.Controls.Add(new Label
        {
            Text = label,
            Dock = DockStyle.Top,
            Height = 22,
            ForeColor = Ui.Muted,
            Font = Ui.Subtitle,
            TextAlign = ContentAlignment.MiddleLeft,
        });
        t.Controls.Add(box, col, row);
        if (span > 1) t.SetColumnSpan(box, span);
    }

    void Save()
    {
        lblMsg.ForeColor = Ui.Danger;
        try
        {
            if (!string.IsNullOrWhiteSpace(txtNew.Text))
            {
                var hash = Convert.ToString(SqlDb.Scalar("SELECT password FROM dbo.users WHERE id=@id", SqlDb.P("@id", Session.UserId))) ?? "";
                var ok = hash.StartsWith("$2") && BCrypt.Net.BCrypt.Verify(txtOld.Text, hash);
                if (!ok && txtOld.Text != hash)
                {
                    lblMsg.Text = "Mật khẩu hiện tại không đúng";
                    return;
                }
                SqlDb.Execute("UPDATE dbo.users SET password=@p, updatedAt=GETDATE() WHERE id=@id",
                    SqlDb.P("@p", BCrypt.Net.BCrypt.HashPassword(txtNew.Text)), SqlDb.P("@id", Session.UserId));
            }
            var avatar = Session.Avatar;
            if (!string.IsNullOrWhiteSpace(pendingFile))
            {
                AvatarStore.EnsureColumn();
                avatar = AvatarStore.Save(Session.UserId, pendingFile);
            }
            SqlDb.Execute(
                @"UPDATE dbo.users SET username=@u, email=@e, phone=@p, address=@a, cccd=@c, avatar=@av, updatedAt=GETDATE() WHERE id=@id",
                SqlDb.P("@u", txtUser.Text.Trim()), SqlDb.P("@e", txtEmail.Text.Trim()),
                SqlDb.P("@p", txtPhone.Text.Trim()), SqlDb.P("@a", txtAddress.Text.Trim()),
                SqlDb.P("@c", txtCccd.Text.Trim()), SqlDb.P("@av", avatar), SqlDb.P("@id", Session.UserId));
            Session.Username = txtUser.Text.Trim();
            Session.Email = txtEmail.Text.Trim();
            Session.Phone = txtPhone.Text.Trim();
            Session.Address = txtAddress.Text.Trim();
            Session.Cccd = txtCccd.Text.Trim();
            Session.Avatar = avatar;
            pendingFile = null;
            if (FindForm() is FrmMain main) main.RefreshUser();
            lblMsg.ForeColor = Ui.Ok;
            lblMsg.Text = "Đã lưu hồ sơ";
            txtOld.Clear();
            txtNew.Clear();
        }
        catch (Exception ex)
        {
            lblMsg.Text = ex.Message;
        }
    }
}

public class FrmUsers : UserControl
{
    readonly DataGridView grid = new();
    readonly Label lblMsg = new() { AutoSize = true, Padding = new Padding(8) };

    public FrmUsers()
    {
        Text = "Phân quyền";
        BackColor = Ui.Bg;
        if (!Session.IsAdmin)
        {
            Controls.Add(new Label { Text = "Chỉ quản trị viên được phân quyền.", Location = new Point(24, 24), AutoSize = true });
            return;
        }
        var bar = Ui.Toolbar();
        bar.Controls.Add(Btn("Lưu vai trò / Serial", false, SaveRow));
        bar.Controls.Add(Btn("Chặn", false, () => SetStatus("blocked")));
        bar.Controls.Add(Btn("Tạm ngừng", false, () => SetStatus("suspended")));
        bar.Controls.Add(Btn("Mở lại", false, () => SetStatus("active")));
        bar.Controls.Add(Btn("Xóa", true, Delete));
        bar.Controls.Add(lblMsg);

        Ui.StyleGrid(grid);
        grid.Dock = DockStyle.Fill;
        grid.ReadOnly = false;
        Controls.Add(grid);
        Controls.Add(bar);
        Controls.Add(Ui.PageHead("Phân quyền", "Đổi vai trò, cấp quyền tạo Serial, chặn hoặc xóa user"));
        LoadList();
    }

    Button Btn(string t, bool danger, Action act)
    {
        var b = danger ? Ui.Ghost(t, true) : Ui.Ghost(t);
        b.Click += (_, _) => act();
        return b;
    }

    void LoadList()
    {
        try
        {
            AvatarStore.EnsureColumn();
            grid.DataSource = SqlDb.Query(@"SELECT id, ISNULL(avatar,'') AS avatar, username AS [Người dùng], email AS [Email], ISNULL(phone,'') AS [SĐT],
                role AS [Vai trò], ISNULL(canCreateSerial,0) AS [Tạo Serial], status AS [Trạng thái]
                FROM dbo.users ORDER BY createdAt DESC");
            if (grid.Columns.Contains("id")) grid.Columns["id"]!.Visible = false;
            if (grid.Columns.Contains("avatar")) grid.Columns["avatar"]!.Visible = false;
            if (!grid.Columns.Contains("_avt"))
            {
                var img = new DataGridViewImageColumn
                {
                    Name = "_avt",
                    HeaderText = "",
                    Width = 48,
                    AutoSizeMode = DataGridViewAutoSizeColumnMode.None,
                    ImageLayout = DataGridViewImageCellLayout.Zoom,
                    ReadOnly = true,
                };
                grid.Columns.Insert(0, img);
                grid.RowTemplate.Height = 40;
            }
            foreach (DataGridViewRow row in grid.Rows)
            {
                if (row.IsNewRow) continue;
                var path = Convert.ToString(row.Cells["avatar"].Value);
                var name = Convert.ToString(row.Cells["Người dùng"].Value) ?? "";
                row.Cells["_avt"].Value = AvatarStore.Load(path) ?? AvatarStore.Letter(name, 36);
            }
            foreach (DataGridViewColumn col in grid.Columns)
                col.ReadOnly = col.Name is not "Vai trò" and not "Tạo Serial";
        }
        catch (Exception ex)
        {
            lblMsg.ForeColor = Ui.Danger;
            lblMsg.Text = "Không tải được user: " + ex.Message;
        }
    }

    Guid? SelectedId()
    {
        if (grid.CurrentRow == null) return null;
        return (Guid)grid.CurrentRow.Cells["id"].Value;
    }

    bool IsSelf(Guid id) => id == Session.UserId;

    void SaveRow()
    {
        var id = SelectedId();
        if (id == null) return;
        var role = Convert.ToString(grid.CurrentRow!.Cells["Vai trò"].Value) ?? "user";
        var serial = ToBool(grid.CurrentRow.Cells["Tạo Serial"].Value);
        if (role is "admin" or "warehouse") serial = true;
        SqlDb.Execute("UPDATE dbo.users SET role=@r, canCreateSerial=@s, updatedAt=GETDATE() WHERE id=@id",
            SqlDb.P("@r", role), SqlDb.P("@s", serial), SqlDb.P("@id", id));
        lblMsg.ForeColor = Ui.Ok;
        lblMsg.Text = "Đã cập nhật quyền";
        LoadList();
    }

    void SetStatus(string status)
    {
        var id = SelectedId();
        if (id == null) return;
        if (IsSelf(id.Value)) { lblMsg.ForeColor = Ui.Danger; lblMsg.Text = "Không thao tác trên chính bạn"; return; }
        SqlDb.Execute("UPDATE dbo.users SET status=@s, updatedAt=GETDATE() WHERE id=@id", SqlDb.P("@s", status), SqlDb.P("@id", id));
        LoadList();
    }

    void Delete()
    {
        var id = SelectedId();
        if (id == null) return;
        if (IsSelf(id.Value)) { MessageBox.Show("Không xóa chính bạn"); return; }
        if (MessageBox.Show("Xóa tài khoản này?", "Xóa", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
        SqlDb.Execute("DELETE FROM dbo.users WHERE id=@id", SqlDb.P("@id", id));
        LoadList();
    }

    static bool ToBool(object? v) => v != null && v != DBNull.Value && Convert.ToBoolean(v);
}
