using System.Data;
using Microsoft.Data.SqlClient;
using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmLogin : Form
{
    readonly TextBox txtUser = Ui.Box();
    readonly TextBox txtPass = Ui.Box();
    readonly Label lblError = new();
    readonly Button btnLogin;

    public FrmLogin()
    {
        Text = "Đăng nhập — Kho & Bảo hành";
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        ClientSize = new Size(440, 480);
        Font = Ui.Body;
        BackColor = Ui.Bg;

        var theme = Ui.Ghost(Ui.Dark ? "Sáng" : "Tối");
        theme.Location = new Point(332, 10);

        var card = new Panel
        {
            Size = new Size(380, 400),
            Location = new Point(30, 48),
            BackColor = Ui.Panel,
            Padding = new Padding(28, 24, 28, 24),
            Tag = "card",
        };
        theme.Click += (_, _) =>
        {
            Ui.SetDark(!Ui.Dark);
            ApplyLogin(card, theme);
        };
        card.Paint += (_, e) =>
        {
            var g = e.Graphics;
            using (var accent = new SolidBrush(Ui.Brand))
                g.FillRectangle(accent, 0, 0, 4, card.Height);
            using var pen = new Pen(Ui.Line);
            g.DrawRectangle(pen, 0, 0, card.Width - 1, card.Height - 1);
        };

        var y = 20;
        card.Controls.Add(new Label
        {
            Text = "KHO & BẢO HÀNH",
            ForeColor = Ui.Brand,
            Font = Ui.Small,
            AutoSize = true,
            Location = new Point(28, y),
        });
        y += 24;
        card.Controls.Add(new Label
        {
            Text = "Đăng nhập",
            Font = Ui.Title,
            AutoSize = true,
            Location = new Point(28, y),
        });
        y += 36;
        card.Controls.Add(new Label
        {
            Text = "Xuất kho · Serial · Tiếp nhận bảo hành",
            ForeColor = Ui.Muted,
            AutoSize = true,
            Location = new Point(28, y),
        });
        y += 40;
        card.Controls.Add(new Label { Text = "Email hoặc tên đăng nhập", ForeColor = Ui.Muted, AutoSize = true, Location = new Point(28, y) });
        y += 22;
        txtUser.Bounds = new Rectangle(28, y, 316, 34);
        y += 50;
        card.Controls.Add(new Label { Text = "Mật khẩu", ForeColor = Ui.Muted, AutoSize = true, Location = new Point(28, y) });
        y += 22;
        txtPass.Bounds = new Rectangle(28, y, 316, 34);
        txtPass.UseSystemPasswordChar = true;
        y += 52;
        btnLogin = Ui.Primary("Đăng nhập");
        btnLogin.Bounds = new Rectangle(28, y, 316, 40);
        btnLogin.Click += (_, _) => DoLogin();
        y += 52;
        var register = new LinkLabel
        {
            Text = "Chưa có tài khoản? Đăng ký",
            AutoSize = true,
            Location = new Point(28, y),
            LinkColor = Ui.BrandDark,
        };
        register.Click += (_, _) =>
        {
            using var f = new FrmRegister();
            f.ShowDialog(this);
        };
        lblError.ForeColor = Ui.Danger;
        lblError.AutoSize = false;
        lblError.Bounds = new Rectangle(28, 360, 316, 22);
        card.Controls.AddRange([txtUser, txtPass, btnLogin, register, lblError]);
        Controls.Add(card);
        Controls.Add(theme);
        AcceptButton = btnLogin;
        ApplyLogin(card, theme);
    }

    void ApplyLogin(Panel card, Button theme)
    {
        BackColor = Ui.Bg;
        card.BackColor = Ui.Panel;
        theme.Text = Ui.Dark ? "Sáng" : "Tối";
        theme.BackColor = Ui.Panel;
        theme.ForeColor = Ui.Ink;
        theme.FlatAppearance.BorderColor = Ui.Line;
        theme.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        Ui.ApplyTree(this);
        card.BackColor = Ui.Panel;
        theme.BringToFront();
    }

    void DoLogin()
    {
        lblError.Text = "";
        btnLogin.Enabled = false;
        try
        {
            AvatarStore.EnsureColumn();
            DataTable table;
            try
            {
                table = SqlDb.Query(
                    @"SELECT TOP 1 id, username, email, password, role, status,
                             ISNULL(canCreateSerial,0) AS canCreateSerial,
                             ISNULL(phone,'') AS phone, ISNULL(address,'') AS address, ISNULL(cccd,'') AS cccd,
                             ISNULL(avatar,'') AS avatar
                      FROM dbo.users WHERE email=@u OR username=@u",
                    SqlDb.P("@u", txtUser.Text.Trim()));
            }
            catch
            {
                table = SqlDb.Query(
                    @"SELECT TOP 1 id, username, email, password, role, status,
                             ISNULL(canCreateSerial,0) AS canCreateSerial,
                             ISNULL(phone,'') AS phone, ISNULL(address,'') AS address, ISNULL(cccd,'') AS cccd
                      FROM dbo.users WHERE email=@u OR username=@u",
                    SqlDb.P("@u", txtUser.Text.Trim()));
            }
            if (table.Rows.Count == 0)
            {
                lblError.Text = "Sai tài khoản hoặc mật khẩu";
                return;
            }
            var row = table.Rows[0];
            var hash = Convert.ToString(row["password"]) ?? "";
            var ok = hash.StartsWith("$2") && BCrypt.Net.BCrypt.Verify(txtPass.Text, hash);
            if (!ok && txtPass.Text != hash)
            {
                lblError.Text = "Sai tài khoản hoặc mật khẩu";
                return;
            }
            if (Convert.ToString(row["status"]) is string st && st != "active" && st != "")
            {
                lblError.Text = "Tài khoản không hoạt động";
                return;
            }
            Session.UserId = (Guid)row["id"];
            Session.Username = Convert.ToString(row["username"]) ?? "";
            Session.Email = Convert.ToString(row["email"]) ?? "";
            Session.Role = Convert.ToString(row["role"]) ?? "user";
            Session.CanCreateSerial = Convert.ToBoolean(row["canCreateSerial"]);
            Session.Phone = Convert.ToString(row["phone"]) ?? "";
            Session.Address = Convert.ToString(row["address"]) ?? "";
            Session.Cccd = Convert.ToString(row["cccd"]) ?? "";
            Session.Avatar = row.Table.Columns.Contains("avatar") ? Convert.ToString(row["avatar"]) ?? "" : "";
            Hide();
            using (var main = new FrmMain())
                main.ShowDialog();
            Close();
        }
        catch (SqlException ex)
        {
            lblError.Text = "Không kết nối SQL: " + ex.Message;
        }
        catch (Exception ex)
        {
            lblError.Text = ex.Message;
        }
        finally
        {
            btnLogin.Enabled = true;
        }
    }
}

public class FrmRegister : Form
{
    readonly TextBox txtUser = Ui.Box();
    readonly TextBox txtEmail = Ui.Box();
    readonly TextBox txtPass = Ui.Box();
    readonly Label lblError = new() { ForeColor = Ui.Danger, AutoSize = false };

    public FrmRegister()
    {
        Text = "Đăng ký";
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        ClientSize = new Size(420, 320);
        Font = Ui.Body;
        BackColor = Ui.Bg;
        Padding = new Padding(24);

        var y = 20;
        Controls.Add(new Label { Text = "Tạo tài khoản", Font = new Font("Segoe UI", 16, FontStyle.Bold), AutoSize = true, Location = new Point(24, y) });
        y += 40;
        Controls.Add(new Label { Text = "Tên đăng nhập", ForeColor = Ui.Muted, AutoSize = true, Location = new Point(24, y) });
        y += 22; txtUser.Bounds = new Rectangle(24, y, 360, 30); y += 40;
        Controls.Add(new Label { Text = "Email", ForeColor = Ui.Muted, AutoSize = true, Location = new Point(24, y) });
        y += 22; txtEmail.Bounds = new Rectangle(24, y, 360, 30); y += 40;
        Controls.Add(new Label { Text = "Mật khẩu", ForeColor = Ui.Muted, AutoSize = true, Location = new Point(24, y) });
        y += 22; txtPass.Bounds = new Rectangle(24, y, 360, 30); txtPass.UseSystemPasswordChar = true; y += 44;
        var btn = Ui.Primary("Đăng ký");
        btn.Bounds = new Rectangle(24, y, 160, 36);
        btn.Click += (_, _) => Save();
        lblError.Bounds = new Rectangle(200, y, 190, 36);
        Controls.AddRange([txtUser, txtEmail, txtPass, btn, lblError]);
        Ui.ApplyTree(this);
    }

    void Save()
    {
        lblError.Text = "";
        if (txtUser.Text.Trim().Length < 2 || txtEmail.Text.Trim().Length < 3 || txtPass.Text.Length < 4)
        {
            lblError.Text = "Nhập đủ tên, email, mật khẩu";
            return;
        }
        try
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(txtPass.Text);
            var count = Convert.ToInt32(SqlDb.Scalar("SELECT COUNT(*) FROM dbo.users") ?? 0);
            SqlDb.Execute(
                @"INSERT INTO dbo.users (id, username, email, password, role, status, canCreateSerial, createdAt, updatedAt)
                  VALUES (NEWID(), @u, @e, @p, @r, N'active', @s, GETDATE(), GETDATE())",
                SqlDb.P("@u", txtUser.Text.Trim()),
                SqlDb.P("@e", txtEmail.Text.Trim()),
                SqlDb.P("@p", hash),
                SqlDb.P("@r", count == 0 ? "admin" : "user"),
                SqlDb.P("@s", count == 0));
            MessageBox.Show("Đã tạo tài khoản. Hãy đăng nhập.");
            Close();
        }
        catch (Exception ex)
        {
            lblError.Text = ex.Message;
        }
    }
}
