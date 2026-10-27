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
        sidebar.BackColor = Ui.SideBg;
        sidebar.Padding = new Padding(12, 16, 12, 12);
        sidebar.Paint += (_, e) =>
        {
            using var pen = new Pen(Ui.Line);
            e.Graphics.DrawLine(pen, sidebar.Width - 1, 0, sidebar.Width - 1, sidebar.Height);
        };

        var avatar = new Panel { Dock = DockStyle.Top, Height = 64, Cursor = Cursors.Hand, BackColor = Ui.SideBg };
        avHead.SetFrom(Session.Avatar, Session.Username);
        lblUser.AutoSize = false;
        lblUser.Bounds = new Rectangle(52, 10, 170, 22);
        lblUser.Font = new Font("Segoe UI", 10, FontStyle.Bold);
        lblUser.ForeColor = Ui.SideInk;
        lblUser.Text = Session.Username;
        lblRole.AutoSize = false;
        lblRole.Bounds = new Rectangle(52, 32, 170, 20);
        lblRole.ForeColor = Ui.SideMuted;
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
        navHost.BackColor = Ui.SideBg;
        navHost.Padding = new Padding(0, 8, 0, 0);

        if (Session.CanAccess("home"))
            navHost.Controls.Add(Nav("home", "Tổng quan", Icons.Home));
        if (Session.CanAccess("profile"))
            navHost.Controls.Add(Nav("profile", "Hồ sơ", Icons.User));
        if (Session.CanAccess("users"))
            navHost.Controls.Add(Nav("users", "Phân quyền", Icons.Shield));

        var catalogItems = NavIf("products", "Danh mục sản phẩm", Icons.Box, 200)
            .Concat(NavIf("customers", "Danh mục khách hàng", Icons.User, 200))
            .Concat(NavIf("labors", "Danh mục tiền công", Icons.Coin, 200))
            .ToArray();
        if (catalogItems.Length > 0)
        {
            navHost.Controls.Add(GroupBtn("1. Danh mục", () =>
            {
                catalogOpen = !catalogOpen;
                if (catalogSub != null) catalogSub.Visible = catalogOpen && !collapsed;
            }));
            catalogSub = Sub(catalogItems);
            navHost.Controls.Add(catalogSub);
        }

        var warehouseItems = NavIf("pxk", "Phiếu xuất kho", Icons.Doc, 200)
            .Concat(NavIf("ton", "Tồn kho sản phẩm", Icons.Box, 200))
            .ToArray();
        if (warehouseItems.Length > 0)
        {
            navHost.Controls.Add(GroupBtn("2. Kho", () =>
            {
                warehouseOpen = !warehouseOpen;
                if (warehouseSub != null) warehouseSub.Visible = warehouseOpen && !collapsed;
            }));
            warehouseSub = Sub(warehouseItems);
            navHost.Controls.Add(warehouseSub);
        }

        if (Session.CanAccess("serial"))
            navHost.Controls.Add(Nav("serial", "3. Tạo số Serial", Icons.Serial));

        var warrantyItems = NavIf("bh_phieu", "Phiếu bảo hành", Icons.Doc, 200)
            .Concat(NavIf("bh_bg", "Báo giá BH", Icons.Coin, 200))
            .Concat(NavIf("bh_kho", "Kho bảo hành", Icons.Box, 200))
            .Concat(NavIf("bh_thu", "Thu phụ tùng BH", Icons.Coin, 200))
            .Concat(NavIf("bh_hd", "Hóa đơn BH", Icons.Doc, 200))
            .Concat(NavIf("bh_seri", "Tra cứu serial", Icons.Serial, 200))
            .ToArray();
        if (warrantyItems.Length > 0)
        {
            navHost.Controls.Add(GroupBtn("4. Bảo hành", () =>
            {
                warrantyOpen = !warrantyOpen;
                if (warrantySub != null) warrantySub.Visible = warrantyOpen && !collapsed;
            }));
            warrantySub = Sub(warrantyItems);
            navHost.Controls.Add(warrantySub);
        }

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
            Margin = new Padding(8, 0, 0, 6),
            BackColor = Ui.SideBg,
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
            Height = 32,
            FlatStyle = FlatStyle.Flat,
            TextAlign = ContentAlignment.MiddleLeft,
            BackColor = Ui.SideBg,
            ForeColor = Ui.SideMuted,
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
            Cursor = Cursors.Hand,
            Margin = new Padding(0, 12, 0, 2),
            Tag = "group",
        };
        b.FlatAppearance.BorderSize = 0;
        b.FlatAppearance.MouseOverBackColor = Ui.SideHover;
        b.Click += (_, _) => toggle();
        return b;
    }

    IEnumerable<Control> NavIf(string key, string text, Action<Graphics, Rectangle, Color?> icon, int width = 216)
    {
        if (!Session.CanAccess(key)) return [];
        return [Nav(key, text, icon, width)];
    }

    Button Nav(string key, string text, Action<Graphics, Rectangle, Color?> icon, int width = 216)
    {
        var b = new Button
        {
            Text = "    " + text,
            Width = width,
            Height = 36,
            FlatStyle = FlatStyle.Flat,
            TextAlign = ContentAlignment.MiddleLeft,
            BackColor = Ui.SideBg,
            ForeColor = Ui.SideMuted,
            Font = Ui.Nav,
            Cursor = Cursors.Hand,
            Tag = key,
            Margin = new Padding(0, 1, 0, 1),
        };
        b.FlatAppearance.BorderSize = 0;
        b.FlatAppearance.MouseOverBackColor = Ui.SideHover;
        b.Paint += (_, e) =>
        {
            var on = b.BackColor == Ui.SideActive || b.ForeColor == Ui.BrandDark;
            icon(e.Graphics, new Rectangle(10, 8, 18, 18), on ? Ui.Brand : Ui.SideMuted);
        };
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
        sidebar.BackColor = Ui.SideBg;
        noticeBox.BackColor = Ui.Panel;
        lblUser.ForeColor = Ui.SideInk;
        lblRole.ForeColor = Ui.SideMuted;
        btnTheme.Text = Ui.Dark ? "Sáng" : "Tối";
        foreach (var b in new[] { btnTheme, btnHide, btnLogout })
        {
            b.BackColor = Ui.Panel;
            b.ForeColor = Ui.Ink;
            b.FlatAppearance.BorderColor = Ui.Line;
            b.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        }
        navHost.BackColor = Ui.SideBg;
        foreach (var btn in navMap.Values)
            btn.FlatAppearance.MouseOverBackColor = Ui.SideHover;
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
                b.BackColor = Ui.SideBg;
                b.ForeColor = Ui.SideMuted;
                b.FlatAppearance.MouseOverBackColor = Ui.SideHover;
            }
            PaintGroups(c);
        }
    }

    void QueueShow(string key, bool force = false)
    {
        if (!Session.CanAccess(key)) key = "home";
        if (navigating || (!force && shown == key)) return;
        BeginInvoke(() => ShowPage(key, force));
    }

    void ShowPage(string key, bool force = false)
    {
        if (!Session.CanAccess(key)) key = "home";
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
            btn.BackColor = on ? Ui.SideActive : Ui.SideBg;
            btn.ForeColor = on ? Ui.BrandDark : Ui.SideMuted;
            btn.Font = new Font("Segoe UI", 9.75f, on ? FontStyle.Bold : FontStyle.Regular);
            btn.Invalidate();
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
            Text = "Xin chào, " + (string.IsNullOrWhiteSpace(Session.Username) ? "bạn" : Session.Username),
            Font = Ui.Title,
            AutoSize = true,
            ForeColor = Ui.Ink,
        });
        wrap.Controls.Add(new Label
        {
            Text = "Chọn chức năng bên dưới hoặc dùng menu trái. Giao diện gọn cho kho & bảo hành.",
            AutoSize = true,
            ForeColor = Ui.Muted,
            Margin = new Padding(0, 4, 0, 20),
        });

        AddSection(wrap, "1", "Danh mục",
            TileIf("Sản phẩm", Ui.Brand, Icons.Box, "products"),
            TileIf("Khách hàng", Ui.Brand, Icons.User, "customers"),
            TileIf("Tiền công", Ui.Brand, Icons.Coin, "labors"));

        AddSection(wrap, "2", "Kho",
            TileIf("Phiếu xuất kho", Ui.Brand, Icons.Doc, "pxk"),
            TileIf("Tồn kho", Ui.Brand, Icons.Box, "ton"));

        AddSection(wrap, "3", "Serial",
            TileIf("Tạo số Serial", Ui.Brand, Icons.Serial, "serial"));

        AddSection(wrap, "4", "Bảo hành",
            TileIf("Phiếu bảo hành", Ui.Brand, Icons.Doc, "bh_phieu"),
            TileIf("Báo giá", Ui.Brand, Icons.Coin, "bh_bg"),
            TileIf("Kho bảo hành", Ui.Brand, Icons.Box, "bh_kho"),
            TileIf("Thu phụ tùng", Ui.Brand, Icons.Coin, "bh_thu"),
            TileIf("Hóa đơn", Ui.Brand, Icons.Doc, "bh_hd"),
            TileIf("Tra cứu serial", Ui.Brand, Icons.Serial, "bh_seri"));

        Controls.Add(wrap);
    }

    void AddSection(FlowLayoutPanel wrap, string num, string title, params Control?[] tiles)
    {
        var visible = tiles.Where(t => t != null).Cast<Control>().ToArray();
        if (visible.Length == 0) return;
        wrap.Controls.Add(Section(num, title));
        for (var i = 0; i < visible.Length; i += 3)
            wrap.Controls.Add(Row(visible.Skip(i).Take(3).ToArray()));
    }

    Control? TileIf(string label, Color tone, Action<Graphics, Rectangle, Color?> icon, string key)
        => Session.CanAccess(key) ? Tile(label, tone, icon, key) : null;

    static Control Section(string num, string title)
    {
        var p = new Panel { Width = 560, Height = 32, Margin = new Padding(0, 12, 0, 6) };
        var t = new Label
        {
            Text = title.ToUpperInvariant(),
            AutoSize = true,
            Location = new Point(0, 6),
            Font = new Font("Segoe UI", 9f, FontStyle.Bold),
            ForeColor = Ui.Muted,
        };
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
        return new DashTile(label, tone, (g, r) => icon(g, r, Ui.BrandDark), () =>
        {
            if (FindForm() is FrmMain main)
                main.OpenPage(key);
        });
    }
}
