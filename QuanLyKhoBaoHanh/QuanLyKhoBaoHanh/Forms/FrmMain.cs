using QuanLyKhoBaoHanh.Data;

namespace QuanLyKhoBaoHanh.Forms;

public class FrmMain : Form
{
    readonly Panel sidebar = new();
    readonly Panel content = new();
    readonly Panel topbar = new();
    readonly Panel noticeBox = new();
    readonly FlowLayoutPanel navHost = new();
    readonly Dictionary<string, Button> navMap = new();
    readonly Label lblUser = new();
    readonly Label lblRole = new();
    readonly Label lblNoticeBadge = new();
    readonly AvatarView avHead = new() { Size = new Size(40, 40), Location = new Point(4, 8) };
    readonly Button btnTheme = Ui.Ghost("Tối");
    readonly Button btnHide = Ui.Ghost("Ẩn menu");
    readonly Button btnLogout = Ui.Ghost("Đăng xuất");
    bool navigating;
    bool collapsed;
    bool catalogOpen = true;
    bool warehouseOpen = true;
    bool warrantyOpen = true;
    string shown = "";
    Panel? catalogSub;
    Panel? warehouseSub;
    Panel? warrantySub;

    public FrmMain()
    {
        Text = "Quản lý xuất kho & bảo hành";
        WindowState = FormWindowState.Maximized;
        Font = Ui.Body;
        MinimumSize = new Size(1100, 700);
        BackColor = Ui.Bg;
        KeyPreview = true;

        BuildSidebar();
        BuildMain();
        Controls.Add(BuildRight());
        Controls.Add(sidebar);
        Ui.DoubleBuffer(this);
        Shown += (_, _) => QueueShow("home");
        FormClosing += (_, _) =>
        {
            foreach (Control c in content.Controls.Cast<Control>().ToArray())
                c.Dispose();
        };
    }

    Control BuildRight()
    {
        var right = new Panel { Dock = DockStyle.Fill, BackColor = Ui.Bg };
        right.Controls.Add(content);
        right.Controls.Add(topbar);
        return right;
    }

    void BuildMain()
    {
        topbar.Dock = DockStyle.Top;
        topbar.Height = 56;
        topbar.BackColor = Ui.Panel;
        topbar.Padding = new Padding(12, 10, 16, 10);
        topbar.Paint += (_, e) =>
        {
            using var pen = new Pen(Ui.Line);
            e.Graphics.DrawLine(pen, 0, topbar.Height - 1, topbar.Width, topbar.Height - 1);
        };

        btnHide.Dock = DockStyle.Left;
        btnHide.Click += (_, _) => ToggleSidebar(btnHide);

        btnTheme.Dock = DockStyle.Right;
        btnTheme.Click += (_, _) => ToggleTheme();

        btnLogout.Dock = DockStyle.Right;
        btnLogout.Click += (_, _) => Close();

        var notify = new Panel { Dock = DockStyle.Right, Width = 48, Cursor = Cursors.Hand };
        notify.Paint += (_, e) =>
        {
            Icons.Bell(e.Graphics, new Rectangle(14, 10, 18, 18));
        };
        notify.Click += (_, _) => ToggleNotices();
        lblNoticeBadge.AutoSize = false;
        lblNoticeBadge.Size = new Size(18, 18);
        lblNoticeBadge.Location = new Point(26, 4);
        lblNoticeBadge.BackColor = Ui.Danger;
        lblNoticeBadge.ForeColor = Color.White;
        lblNoticeBadge.TextAlign = ContentAlignment.MiddleCenter;
        lblNoticeBadge.Font = new Font("Segoe UI", 7, FontStyle.Bold);
        lblNoticeBadge.Visible = false;
        notify.Controls.Add(lblNoticeBadge);

        noticeBox.Visible = false;
        noticeBox.Width = 320;
        noticeBox.Height = 280;
        noticeBox.BackColor = Ui.Panel;
        noticeBox.BorderStyle = BorderStyle.FixedSingle;

        topbar.Controls.Add(notify);
        topbar.Controls.Add(btnLogout);
        topbar.Controls.Add(btnTheme);
        topbar.Controls.Add(btnHide);
        ApplyChrome();

        content.Dock = DockStyle.Fill;
        content.Padding = new Padding(24, 16, 24, 20);
        content.BackColor = Ui.Bg;
        content.Controls.Add(noticeBox);
        LoadNoticeBadge();
    }

    void BuildSidebar()
    {
        sidebar.Dock = DockStyle.Left;
        sidebar.Width = 248;
        sidebar.BackColor = Ui.Panel;
        sidebar.Padding = new Padding(12, 16, 12, 12);
        sidebar.Paint += (_, e) =>
        {
            using var pen = new Pen(Ui.Line);
            e.Graphics.DrawLine(pen, sidebar.Width - 1, 0, sidebar.Width - 1, sidebar.Height);
        };

        var avatar = new Panel { Dock = DockStyle.Top, Height = 58, Cursor = Cursors.Hand };
        avHead.SetFrom(Session.Avatar, Session.Username);
        lblUser.AutoSize = false;
        lblUser.Bounds = new Rectangle(52, 8, 170, 22);
        lblUser.Font = new Font("Segoe UI", 10, FontStyle.Bold);
        lblUser.Text = Session.Username;
        lblRole.AutoSize = false;
        lblRole.Bounds = new Rectangle(52, 30, 170, 20);
        lblRole.ForeColor = Ui.Muted;
        lblRole.Font = Ui.Subtitle;
        lblRole.Text = Session.RoleLabel;
        avatar.Controls.Add(avHead);
        avatar.Controls.Add(lblUser);
        avatar.Controls.Add(lblRole);
        avatar.Click += (_, _) => QueueShow("profile");
        avHead.Click += (_, _) => QueueShow("profile");
        lblUser.Click += (_, _) => QueueShow("profile");
        lblRole.Click += (_, _) => QueueShow("profile");

        navHost.Dock = DockStyle.Fill;
        navHost.FlowDirection = FlowDirection.TopDown;
        navHost.WrapContents = false;
        navHost.AutoScroll = true;
        navHost.BackColor = Ui.Panel;
        navHost.Padding = new Padding(0, 8, 0, 0);

        navHost.Controls.Add(Nav("home", "Tổng quan", Icons.Home));
        navHost.Controls.Add(Nav("profile", "Hồ sơ", Icons.User));
        if (Session.IsAdmin)
            navHost.Controls.Add(Nav("users", "Phân quyền", Icons.Shield));

        navHost.Controls.Add(GroupBtn("1. Danh mục", () =>
        {
            catalogOpen = !catalogOpen;
            if (catalogSub != null) catalogSub.Visible = catalogOpen && !collapsed;
        }));
        catalogSub = Sub(
            Nav("products", "Danh mục sản phẩm", Icons.Box, 200),
            Nav("customers", "Danh mục khách hàng", Icons.User, 200),
            Nav("labors", "Danh mục tiền công", Icons.Coin, 200));
        navHost.Controls.Add(catalogSub);

        navHost.Controls.Add(GroupBtn("2. Kho", () =>
        {
            warehouseOpen = !warehouseOpen;
            if (warehouseSub != null) warehouseSub.Visible = warehouseOpen && !collapsed;
        }));
        warehouseSub = Sub(
            Nav("pxk", "Phiếu xuất kho", Icons.Doc, 200),
            Nav("ton", "Tồn kho sản phẩm", Icons.Box, 200));
        navHost.Controls.Add(warehouseSub);

        if (Session.SerialAllowed)
            navHost.Controls.Add(Nav("serial", "3. Tạo số Serial", Icons.Serial));

        navHost.Controls.Add(GroupBtn("4. Bảo hành", () =>
        {
            warrantyOpen = !warrantyOpen;
            if (warrantySub != null) warrantySub.Visible = warrantyOpen && !collapsed;
        }));
        warrantySub = Sub(
            Nav("bh_phieu", "Phiếu bảo hành", Icons.Doc, 200),
            Nav("bh_bg", "Báo giá BH", Icons.Coin, 200),
            Nav("bh_kho", "Kho bảo hành", Icons.Box, 200),
            Nav("bh_thu", "Thu phụ tùng BH", Icons.Coin, 200),
            Nav("bh_hd", "Hóa đơn BH", Icons.Doc, 200),
            Nav("bh_seri", "Tra cứu serial", Icons.Serial, 200));
        navHost.Controls.Add(warrantySub);

        sidebar.Controls.Add(navHost);
        sidebar.Controls.Add(avatar);
    }

    static Panel Sub(params Control[] items)
    {
        var p = new FlowLayoutPanel
        {
            AutoSize = true,
            Width = 220,
            FlowDirection = FlowDirection.TopDown,
            WrapContents = false,
            Margin = new Padding(12, 0, 0, 6),
        };
        foreach (var c in items) p.Controls.Add(c);
        return p;
    }

    Button GroupBtn(string text, Action toggle)
    {
        var b = new Button
        {
            Text = text,
            Width = 216,
            Height = 36,
            FlatStyle = FlatStyle.Flat,
            TextAlign = ContentAlignment.MiddleLeft,
            BackColor = Ui.Panel,
            ForeColor = Ui.Ink,
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            Cursor = Cursors.Hand,
            Margin = new Padding(0, 10, 0, 2),
            Tag = "group",
        };
        b.FlatAppearance.BorderSize = 0;
        b.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        b.Click += (_, _) => toggle();
        return b;
    }

    Button Nav(string key, string text, Action<Graphics, Rectangle, Color?> icon, int width = 216)
    {
        var b = new Button
        {
            Text = "    " + text,
            Width = width,
            Height = 38,
            FlatStyle = FlatStyle.Flat,
            TextAlign = ContentAlignment.MiddleLeft,
            BackColor = Ui.Panel,
            ForeColor = Ui.Muted,
            Font = Ui.Nav,
            Cursor = Cursors.Hand,
            Tag = key,
            Margin = new Padding(0, 2, 0, 2),
        };
        b.FlatAppearance.BorderSize = 0;
        b.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        b.Paint += (_, e) => icon(e.Graphics, new Rectangle(10, 9, 18, 18), Ui.BrandDark);
        b.Click += (_, _) => QueueShow(key);
        navMap[key] = b;
        return b;
    }

    void ToggleSidebar(Button hide)
    {
        collapsed = !collapsed;
        sidebar.Width = collapsed ? 0 : 248;
        hide.Text = collapsed ? "Hiện menu" : "Ẩn menu";
    }

    public void OpenPage(string key) => QueueShow(key);

    public void RefreshUser()
    {
        lblUser.Text = Session.Username;
        lblRole.Text = Session.RoleLabel;
        avHead.SetFrom(Session.Avatar, Session.Username);
    }

    void ToggleTheme()
    {
        Ui.SetDark(!Ui.Dark);
        ApplyChrome();
        var key = string.IsNullOrEmpty(shown) ? "home" : shown;
        QueueShow(key, true);
    }

    void ApplyChrome()
    {
        BackColor = Ui.Bg;
        content.BackColor = Ui.Bg;
        if (content.Parent != null) content.Parent.BackColor = Ui.Bg;
        topbar.BackColor = Ui.Panel;
        sidebar.BackColor = Ui.Panel;
        noticeBox.BackColor = Ui.Panel;
        lblUser.ForeColor = Ui.Ink;
        lblRole.ForeColor = Ui.Muted;
        btnTheme.Text = Ui.Dark ? "Sáng" : "Tối";
        foreach (var b in new[] { btnTheme, btnHide, btnLogout })
        {
            b.BackColor = Ui.Panel;
            b.ForeColor = Ui.Ink;
            b.FlatAppearance.BorderColor = Ui.Line;
            b.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        }
        navHost.BackColor = Ui.Panel;
        foreach (var btn in navMap.Values)
            btn.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        PaintGroups(sidebar);
        if (!string.IsNullOrEmpty(shown))
            Highlight(shown);
        Invalidate(true);
    }

    static void PaintGroups(Control host)
    {
        foreach (Control c in host.Controls)
        {
            if (c is Button b && Equals(b.Tag, "group"))
            {
                b.BackColor = Ui.Panel;
                b.ForeColor = Ui.Ink;
                b.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
            }
            PaintGroups(c);
        }
    }

    void QueueShow(string key, bool force = false)
    {
        if (navigating || (!force && shown == key)) return;
        BeginInvoke(() => ShowPage(key, force));
    }

    void ShowPage(string key, bool force = false)
    {
        if (navigating || (!force && shown == key)) return;
        navigating = true;
        UseWaitCursor = true;
        try
        {
            Highlight(key);
            Control page;
            try
            {
                page = CreatePage(key);
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, ex.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            page.Dock = DockStyle.Fill;
            Ui.ApplyTree(page);
            var old = content.Controls.Cast<Control>().Where(c => c != noticeBox).ToArray();
            content.Controls.Add(page);
            page.BringToFront();
            noticeBox.BringToFront();
            shown = key;

            foreach (var ctl in old)
            {
                content.Controls.Remove(ctl);
                ctl.Dispose();
            }
        }
        finally
        {
            navigating = false;
            UseWaitCursor = false;
        }
    }

    static Control CreatePage(string key) => key switch
    {
        "profile" => new FrmProfile(),
        "users" => new FrmUsers(),
        "products" => new FrmProducts(),
        "customers" => new FrmCustomers(),
        "labors" => new FrmLabors(),
        "pxk" => new FrmStockOut(),
        "ton" => new FrmInventory(),
        "serial" => new FrmSerial(),
        "bh_phieu" => new FrmWarrantyTickets(),
        "bh_bg" => new FrmWarrantyQuotes(),
        "bh_kho" => new FrmWarrantyWarehouse(),
        "bh_thu" => new FrmWarrantyPays(),
        "bh_hd" => new FrmWarrantyInvoices(),
        "bh_seri" => new FrmWarrantyLookup(),
        _ => new FrmHome(),
    };

    void Highlight(string key)
    {
        foreach (var (k, btn) in navMap)
        {
            var on = k == key;
            btn.BackColor = on ? Ui.BrandSoft : Ui.Panel;
            btn.ForeColor = on ? Ui.BrandDark : Ui.Muted;
            btn.Font = new Font("Segoe UI", 10, on ? FontStyle.Bold : FontStyle.Regular);
        }
    }

    void LoadNoticeBadge()
    {
        try
        {
            var n = Convert.ToInt32(SqlDb.Scalar("SELECT COUNT(*) FROM dbo.notifications") ?? 0);
            lblNoticeBadge.Text = n > 9 ? "9+" : n.ToString();
            lblNoticeBadge.Visible = n > 0;
        }
        catch
        {
            lblNoticeBadge.Visible = false;
        }
    }

    void ToggleNotices()
    {
        if (noticeBox.Visible)
        {
            noticeBox.Visible = false;
            return;
        }
        noticeBox.Controls.Clear();
        noticeBox.Location = new Point(Math.Max(8, content.Width - 340), 8);
        var head = new Label
        {
            Text = "Thông báo",
            Dock = DockStyle.Top,
            Height = 36,
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            Padding = new Padding(10, 8, 8, 0),
        };
        var list = new ListBox { Dock = DockStyle.Fill, BorderStyle = BorderStyle.None, Font = Ui.Subtitle };
        try
        {
            var dt = SqlDb.Query("SELECT TOP 12 message, createdAt FROM dbo.notifications ORDER BY createdAt DESC");
            if (dt.Rows.Count == 0) list.Items.Add("Chưa có hoạt động");
            foreach (System.Data.DataRow row in dt.Rows)
                list.Items.Add($"{row["message"]}");
        }
        catch
        {
            list.Items.Add("Chưa có bảng thông báo");
        }
        noticeBox.Controls.Add(list);
        noticeBox.Controls.Add(head);
        noticeBox.Visible = true;
        noticeBox.BringToFront();
        lblNoticeBadge.Visible = false;
    }
}

public class FrmHome : UserControl
{
    public FrmHome()
    {
        BackColor = Ui.Bg;
        AutoScroll = true;
        var wrap = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.TopDown,
            WrapContents = false,
            AutoScroll = true,
            Padding = new Padding(4),
        };
        wrap.Controls.Add(new Label
        {
            Text = "Tổng quan",
            Font = Ui.Title,
            AutoSize = true,
            ForeColor = Ui.Ink,
        });
        wrap.Controls.Add(new Label
        {
            Text = "Chọn nhóm chức năng, rồi bấm icon để vào trang",
            AutoSize = true,
            ForeColor = Ui.Muted,
            Margin = new Padding(0, 0, 0, 18),
        });

        wrap.Controls.Add(Section("1", "Danh mục"));
        wrap.Controls.Add(Row(
            Tile("DM sản phẩm", Color.FromArgb(56, 189, 248), Icons.Box, "products"),
            Tile("DM khách hàng", Color.FromArgb(129, 140, 248), Icons.User, "customers"),
            Tile("DM tiền công", Color.FromArgb(45, 212, 191), Icons.Coin, "labors")));

        wrap.Controls.Add(Section("2", "Kho"));
        wrap.Controls.Add(Row(
            Tile("Phiếu xuất kho", Color.FromArgb(251, 146, 60), Icons.Doc, "pxk"),
            Tile("Tồn kho sản phẩm", Color.FromArgb(79, 70, 229), Icons.Box, "ton")));

        if (Session.SerialAllowed)
        {
            wrap.Controls.Add(Section("3", "Tạo số Serial"));
            wrap.Controls.Add(Row(
                Tile("Tạo số Serial", Color.FromArgb(5, 150, 105), Icons.Serial, "serial")));
        }

        wrap.Controls.Add(Section("4", "Bảo hành"));
        wrap.Controls.Add(Row(
            Tile("Phiếu bảo hành", Color.FromArgb(244, 114, 182), Icons.Doc, "bh_phieu"),
            Tile("Báo giá BH", Color.FromArgb(251, 191, 36), Icons.Coin, "bh_bg"),
            Tile("Kho bảo hành", Color.FromArgb(96, 165, 250), Icons.Box, "bh_kho")));
        wrap.Controls.Add(Row(
            Tile("Thu phụ tùng BH", Color.FromArgb(52, 211, 153), Icons.Coin, "bh_thu"),
            Tile("Hóa đơn BH", Color.FromArgb(167, 139, 250), Icons.Doc, "bh_hd"),
            Tile("Tra cứu serial", Color.FromArgb(45, 212, 191), Icons.Serial, "bh_seri")));

        Controls.Add(wrap);
    }

    static Control Section(string num, string title)
    {
        var p = new Panel { Width = 420, Height = 36, Margin = new Padding(0, 10, 0, 8) };
        var badge = new Label
        {
            Text = num,
            AutoSize = false,
            Size = new Size(28, 28),
            Location = new Point(0, 2),
            TextAlign = ContentAlignment.MiddleCenter,
            BackColor = Ui.Brand,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
        };
        var t = new Label
        {
            Text = title,
            AutoSize = true,
            Location = new Point(36, 6),
            Font = new Font("Segoe UI", 13, FontStyle.Bold),
            ForeColor = Ui.Ink,
        };
        p.Controls.Add(badge);
        p.Controls.Add(t);
        return p;
    }

    static FlowLayoutPanel Row(params Control[] tiles)
    {
        var row = new FlowLayoutPanel { AutoSize = true, Margin = new Padding(0, 0, 0, 4) };
        foreach (var t in tiles) row.Controls.Add(t);
        return row;
    }

    DashTile Tile(string label, Color tone, Action<Graphics, Rectangle, Color?> icon, string key)
    {
        return new DashTile(label, tone, (g, r) => icon(g, r, Color.White), () =>
        {
            if (FindForm() is FrmMain main)
                main.OpenPage(key);
        });
    }
}
