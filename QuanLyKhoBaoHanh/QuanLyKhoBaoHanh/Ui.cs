using System.Drawing.Drawing2D;
using System.Reflection;

namespace QuanLyKhoBaoHanh;

static class Ui
{
    public static Color Bg { get; private set; } = Color.FromArgb(243, 248, 247);
    public static Color Panel { get; private set; } = Color.White;
    public static Color Ink { get; private set; } = Color.FromArgb(27, 46, 50);
    public static Color Muted { get; private set; } = Color.FromArgb(110, 131, 136);
    public static Color Line { get; private set; } = Color.FromArgb(220, 234, 232);
    public static Color Brand { get; private set; } = Color.FromArgb(20, 184, 166);
    public static Color BrandSoft { get; private set; } = Color.FromArgb(216, 246, 241);
    public static Color BrandDark { get; private set; } = Color.FromArgb(15, 118, 110);
    public static Color Danger { get; private set; } = Color.FromArgb(225, 29, 72);
    public static Color Ok { get; private set; } = Color.FromArgb(5, 150, 105);
    public static Color GridAlt { get; private set; } = Color.FromArgb(247, 252, 251);
    public static Color Select { get; private set; } = Color.FromArgb(204, 251, 241);
    public static bool Dark { get; private set; }

    static string ThemeFile =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "QuanLyKhoBaoHanh", "theme.txt");

    public static void LoadSaved()
    {
        try
        {
            if (File.Exists(ThemeFile) && File.ReadAllText(ThemeFile).Trim() == "dark")
                SetDark(true, false);
        }
        catch { /* lần đầu chưa có file */ }
    }

    public static void SetDark(bool dark, bool save = true)
    {
        Dark = dark;
        if (dark)
        {
            Bg = Color.FromArgb(18, 22, 24);
            Panel = Color.FromArgb(30, 36, 38);
            Ink = Color.FromArgb(232, 238, 236);
            Muted = Color.FromArgb(148, 162, 164);
            Line = Color.FromArgb(52, 62, 64);
            Brand = Color.FromArgb(20, 184, 166);
            BrandSoft = Color.FromArgb(18, 52, 50);
            BrandDark = Color.FromArgb(94, 234, 212);
            Select = Color.FromArgb(16, 70, 66);
            GridAlt = Color.FromArgb(36, 42, 44);
        }
        else
        {
            Bg = Color.FromArgb(243, 248, 247);
            Panel = Color.White;
            Ink = Color.FromArgb(27, 46, 50);
            Muted = Color.FromArgb(110, 131, 136);
            Line = Color.FromArgb(220, 234, 232);
            Brand = Color.FromArgb(20, 184, 166);
            BrandSoft = Color.FromArgb(216, 246, 241);
            BrandDark = Color.FromArgb(15, 118, 110);
            Select = Color.FromArgb(204, 251, 241);
            GridAlt = Color.FromArgb(247, 252, 251);
        }
        if (save)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(ThemeFile)!);
                File.WriteAllText(ThemeFile, dark ? "dark" : "light");
            }
            catch { /* bỏ qua */ }
        }
    }

    public static void ApplyTree(Control root)
    {
        Walk(root);
        root.Invalidate(true);
    }

    static void Walk(Control c)
    {
        switch (c)
        {
            case DataGridView g:
                StyleGrid(g);
                break;
            case RoundBox rb:
                rb.ApplyTheme();
                break;
            case LookupBox lb:
                lb.ApplyTheme();
                break;
            case TextBox tb:
                tb.BackColor = Panel;
                tb.ForeColor = Ink;
                break;
            case ComboBox cb:
                cb.BackColor = Panel;
                cb.ForeColor = Ink;
                break;
            case ListBox list:
                list.BackColor = Panel;
                list.ForeColor = Ink;
                break;
            case DateTimePicker dt:
                dt.CalendarForeColor = Ink;
                dt.CalendarMonthBackground = Panel;
                break;
            case TabControl tab:
                tab.BackColor = Panel;
                break;
            case TabPage page:
                page.BackColor = Bg;
                page.ForeColor = Ink;
                break;
            case Button b:
                ApplyButton(b);
                break;
            case LinkLabel link:
                link.LinkColor = BrandDark;
                link.ActiveLinkColor = Brand;
                break;
            case Label lab:
                ApplyLabel(lab);
                break;
            case Form or UserControl:
                c.BackColor = Bg;
                c.ForeColor = Ink;
                break;
            case System.Windows.Forms.Panel or FlowLayoutPanel or TableLayoutPanel or GroupBox:
                if (Equals(c.Tag, "card"))
                    c.BackColor = Panel;
                else if (IsSurface(c.BackColor))
                    c.BackColor = c.Dock == DockStyle.Left || LooksLikeCard(c) ? Panel : Bg;
                break;
        }
        foreach (Control child in c.Controls)
            Walk(child);
    }

    static void ApplyButton(Button b)
    {
        if (Equals(b.Tag, "primary"))
        {
            b.BackColor = Brand;
            b.ForeColor = Color.White;
            return;
        }
        if (Equals(b.Tag, "danger"))
        {
            b.BackColor = Panel;
            b.ForeColor = Danger;
            b.FlatAppearance.BorderColor = Line;
            b.FlatAppearance.MouseOverBackColor = BrandSoft;
            return;
        }
        if (Equals(b.Tag, "ghost") || Equals(b.Tag, "group"))
        {
            b.BackColor = Panel;
            b.ForeColor = Ink;
            b.FlatAppearance.BorderColor = Line;
            b.FlatAppearance.MouseOverBackColor = BrandSoft;
            return;
        }
        b.FlatAppearance.MouseOverBackColor = BrandSoft;
    }

    static void ApplyLabel(Label l)
    {
        if (l.BackColor == Danger || l.BackColor == Brand)
        {
            l.ForeColor = Color.White;
            return;
        }
        if (l.ForeColor == Danger || l.ForeColor == Ok)
            return;
        if (Equals(l.Tag, "accent") || LooksAccent(l.ForeColor))
        {
            l.ForeColor = BrandDark;
            return;
        }
        if (l.Font == Small || l.Font == Subtitle || Equals(l.Tag, "muted"))
            l.ForeColor = Muted;
        else
            l.ForeColor = Ink;
    }

    static bool LooksAccent(Color c) =>
        c == Brand || c == BrandDark || (c.G >= c.R + 40 && c.B > c.R && c.R < 120);

    static bool IsSurface(Color c) =>
        c == Color.White || c.A < 255
        || (c.R >= 230 && c.G >= 240)
        || (c.R <= 40 && c.G <= 50 && c.B <= 50);

    static bool LooksLikeCard(Control c) =>
        c.Height is > 40 and < 90 && c.Dock == DockStyle.Top;

    public static readonly Font Body = new("Segoe UI", 10f);
    public static readonly Font Title = new("Segoe UI", 18f, FontStyle.Bold);
    public static readonly Font Subtitle = new("Segoe UI", 9.5f);
    public static readonly Font Nav = new("Segoe UI", 10f);
    public static readonly Font Small = new("Segoe UI", 8.5f, FontStyle.Bold);

    public static void StyleGrid(DataGridView grid)
    {
        grid.BackgroundColor = Panel;
        grid.BorderStyle = BorderStyle.None;
        grid.GridColor = Line;
        grid.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
        grid.EnableHeadersVisualStyles = false;
        grid.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None;
        grid.ColumnHeadersDefaultCellStyle.BackColor = BrandSoft;
        grid.ColumnHeadersDefaultCellStyle.ForeColor = BrandDark;
        grid.ColumnHeadersDefaultCellStyle.SelectionBackColor = BrandSoft;
        grid.ColumnHeadersDefaultCellStyle.SelectionForeColor = BrandDark;
        grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
        grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(6, 0, 0, 0);
        grid.ColumnHeadersHeight = 40;
        grid.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
        grid.RowHeadersVisible = false;
        grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        grid.MultiSelect = false;
        grid.AllowUserToAddRows = false;
        grid.AllowUserToDeleteRows = false;
        grid.AllowUserToResizeRows = false;
        grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
        grid.DefaultCellStyle.BackColor = Panel;
        grid.DefaultCellStyle.ForeColor = Ink;
        grid.DefaultCellStyle.SelectionBackColor = Select;
        grid.DefaultCellStyle.SelectionForeColor = Ink;
        grid.DefaultCellStyle.Padding = new Padding(6, 0, 0, 0);
        grid.AlternatingRowsDefaultCellStyle.BackColor = GridAlt;
        grid.RowTemplate.Height = 34;
        grid.DataBindingComplete += (_, _) => grid.ClearSelection();
    }

    public static Panel PageHead(string title, string subtitle)
    {
        var box = new Panel
        {
            Dock = DockStyle.Top,
            Height = 70,
            Padding = new Padding(2, 4, 2, 8),
        };
        var sub = new Label
        {
            Text = subtitle,
            Dock = DockStyle.Top,
            Height = 22,
            ForeColor = Muted,
            Font = Subtitle,
            TextAlign = ContentAlignment.TopLeft,
        };
        var head = new Label
        {
            Text = title,
            Dock = DockStyle.Top,
            Height = 34,
            Font = Title,
            ForeColor = Ink,
            TextAlign = ContentAlignment.MiddleLeft,
            AutoEllipsis = true,
        };
        box.Controls.Add(sub);
        box.Controls.Add(head);
        return box;
    }

    public static Panel Card(int height)
    {
        var p = new Panel
        {
            Dock = DockStyle.Top,
            Height = height,
            BackColor = Panel,
            Padding = new Padding(16, 12, 16, 12),
            Margin = new Padding(0, 0, 0, 10),
        };
        p.Paint += (_, e) =>
        {
            using var pen = new Pen(Line);
            e.Graphics.DrawRectangle(pen, 0, 0, p.Width - 1, p.Height - 1);
        };
        return p;
    }

    public static FlowLayoutPanel Toolbar() => new()
    {
        Dock = DockStyle.Top,
        Height = 48,
        WrapContents = false,
        Padding = new Padding(0, 4, 0, 8),
    };

    public static Control FieldCol(string label, Control input, int width)
    {
        var p = new Panel
        {
            Width = width,
            Height = 62,
            Margin = new Padding(0, 0, 14, 6),
        };
        input.Dock = DockStyle.Bottom;
        input.Height = 32;
        var l = new Label
        {
            Text = label,
            Dock = DockStyle.Top,
            Height = 22,
            ForeColor = Muted,
            Font = Subtitle,
            TextAlign = ContentAlignment.MiddleLeft,
        };
        p.Controls.Add(input);
        p.Controls.Add(l);
        return p;
    }

    public static Control FormField(string label, Control input, int width, string? hint = null)
    {
        input.Width = width;
        input.Height = 26;
        var p = new Panel
        {
            Width = width,
            Height = hint == null ? 48 : 62,
            Margin = new Padding(0, 0, 10, 2),
        };
        var l = new Label
        {
            Text = label,
            Dock = DockStyle.Top,
            Height = 18,
            ForeColor = Muted,
            Font = Small,
        };
        input.Dock = DockStyle.Top;
        p.Controls.Add(input);
        p.Controls.Add(l);
        if (hint != null)
        {
            p.Controls.Add(new Label
            {
                Text = hint,
                Dock = DockStyle.Bottom,
                Height = 16,
                ForeColor = Muted,
                Font = Small,
            });
        }
        return p;
    }

    public static Panel DialogFooter(Button accept, Button cancel)
    {
        var bar = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            Height = 48,
            Padding = new Padding(12, 8, 12, 8),
            BackColor = Bg,
        };
        bar.Controls.Add(accept);
        bar.Controls.Add(cancel);
        return bar;
    }

    public static void DoubleBuffer(Control control)
    {
        typeof(Control)
            .GetProperty("DoubleBuffered", BindingFlags.Instance | BindingFlags.NonPublic)
            ?.SetValue(control, true, null);
        foreach (Control child in control.Controls)
            DoubleBuffer(child);
    }

    public static Button Primary(string text)
    {
        var b = new Button
        {
            Text = text,
            AutoSize = true,
            MinimumSize = new Size(96, 36),
            FlatStyle = FlatStyle.Flat,
            BackColor = Brand,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10f, FontStyle.Bold),
            Cursor = Cursors.Hand,
            Padding = new Padding(10, 4, 10, 4),
            Margin = new Padding(0, 0, 8, 0),
            Tag = "primary",
        };
        b.FlatAppearance.BorderSize = 0;
        RoundCtl(b, 10);
        return b;
    }

    public static Button Ghost(string text, bool danger = false)
    {
        var b = new Button
        {
            Text = text,
            AutoSize = true,
            MinimumSize = new Size(88, 36),
            FlatStyle = FlatStyle.Flat,
            BackColor = Panel,
            ForeColor = danger ? Danger : Ink,
            Cursor = Cursors.Hand,
            Padding = new Padding(10, 4, 10, 4),
            Margin = new Padding(0, 0, 8, 0),
            Tag = danger ? "danger" : "ghost",
        };
        b.FlatAppearance.BorderColor = Line;
        RoundCtl(b, 10);
        return b;
    }

    public static Panel RoundCard(string title)
    {
        var p = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Color.Transparent,
            Padding = new Padding(16, 38, 16, 14),
            Margin = new Padding(6),
        };
        p.Paint += (_, e) =>
        {
            var g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            var r = new Rectangle(2, 2, p.Width - 5, p.Height - 5);
            RoundFill(g, r, 14, Panel, Line);
            TextRenderer.DrawText(g, title, new Font("Segoe UI", 9.5f, FontStyle.Bold),
                new Point(16, 12), BrandDark);
        };
        return p;
    }

    public static void SoftInput(Control c)
    {
        c.Font = Body;
        if (c is TextBox tb)
        {
            tb.BorderStyle = BorderStyle.FixedSingle;
            tb.Height = 28;
        }
    }

    static void RoundCtl(Control c, int radius)
    {
        void apply()
        {
            if (c.Width < 8 || c.Height < 8) return;
            using var path = Rounded(new Rectangle(0, 0, c.Width, c.Height), radius);
            c.Region?.Dispose();
            c.Region = new Region(path);
        }
        c.Resize += (_, _) => apply();
        c.HandleCreated += (_, _) => apply();
    }

    public static TextBox Box()
    {
        return new TextBox
        {
            BorderStyle = BorderStyle.FixedSingle,
            Font = Body,
            BackColor = Panel,
            ForeColor = Ink,
        };
    }

    public static AutoCompleteStringCollection SuggestSource(System.Data.DataTable table, string codeCol, string? nameCol = null)
    {
        var src = new AutoCompleteStringCollection();
        foreach (System.Data.DataRow row in table.Rows)
        {
            var code = Convert.ToString(row[codeCol])?.Trim() ?? "";
            if (code.Length == 0) continue;
            src.Add(code);
            if (nameCol != null)
            {
                var name = Convert.ToString(row[nameCol])?.Trim() ?? "";
                if (name.Length > 0) src.Add(code + " - " + name);
            }
        }
        return src;
    }

    public static void Suggest(TextBox box, AutoCompleteStringCollection source)
    {
        box.AutoCompleteMode = AutoCompleteMode.SuggestAppend;
        box.AutoCompleteSource = AutoCompleteSource.CustomSource;
        box.AutoCompleteCustomSource = source;
    }

    public static string SuggestCode(object? value)
    {
        var t = Convert.ToString(value)?.Trim() ?? "";
        var i = t.IndexOf(" - ", StringComparison.Ordinal);
        return (i > 0 ? t[..i] : t).Trim();
    }

    public static Label FieldLabel(string text) => new()
    {
        Text = text,
        AutoSize = true,
        ForeColor = Muted,
        Padding = new Padding(0, 8, 8, 0),
    };

    public static void RoundFill(Graphics g, Rectangle r, int radius, Color fill, Color? border = null)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using var path = Rounded(r, radius);
        using var br = new SolidBrush(fill);
        g.FillPath(br, path);
        if (border is Color c)
        {
            using var pen = new Pen(c);
            g.DrawPath(pen, path);
        }
    }

    public static GraphicsPath Rounded(Rectangle r, int radius)
    {
        var path = new GraphicsPath();
        int d = radius * 2;
        path.AddArc(r.X, r.Y, d, d, 180, 90);
        path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }
}

public sealed class SuggestField : TextBox
{
    readonly ListBox popup = new()
    {
        Visible = false,
        Height = 168,
        IntegralHeight = false,
        BorderStyle = BorderStyle.FixedSingle,
        Font = new Font("Segoe UI", 9f),
    };
    AutoCompleteStringCollection items = [];
    bool picking;

    public event EventHandler? Picked;

    public SuggestField()
    {
        BorderStyle = BorderStyle.FixedSingle;
        Font = Ui.Body;
    }

    public void Bind(AutoCompleteStringCollection source) => items = source;

    protected override void OnParentChanged(EventArgs e)
    {
        base.OnParentChanged(e);
        Host();
    }

    void Host()
    {
        var form = FindForm();
        if (form == null) return;
        if (popup.Parent == form) return;
        popup.Parent?.Controls.Remove(popup);
        form.Controls.Add(popup);
        popup.Click -= PopupClick;
        popup.Click += PopupClick;
    }

    void PopupClick(object? sender, EventArgs e)
    {
        if (popup.SelectedItem is string v) Accept(v);
    }

    void Accept(string value)
    {
        picking = true;
        Text = Ui.SuggestCode(value);
        picking = false;
        HideList();
        Picked?.Invoke(this, EventArgs.Empty);
    }

    protected override void OnTextChanged(EventArgs e)
    {
        base.OnTextChanged(e);
        if (!picking) ShowMatches();
    }

    protected override void OnKeyDown(KeyEventArgs e)
    {
        if (popup.Visible && popup.Items.Count > 0)
        {
            if (e.KeyCode == Keys.Down)
            {
                popup.SelectedIndex = Math.Min(popup.Items.Count - 1, Math.Max(0, popup.SelectedIndex) + 1);
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Up)
            {
                popup.SelectedIndex = Math.Max(0, popup.SelectedIndex - 1);
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Enter && popup.SelectedItem is string v)
            {
                Accept(v);
                e.Handled = true;
                e.SuppressKeyPress = true;
            }
            else if (e.KeyCode == Keys.Escape)
            {
                HideList();
                e.Handled = true;
            }
        }
        else if (e.KeyCode == Keys.Enter)
        {
            Picked?.Invoke(this, EventArgs.Empty);
            e.Handled = true;
            e.SuppressKeyPress = true;
        }
        base.OnKeyDown(e);
    }

    protected override void OnLeave(EventArgs e)
    {
        base.OnLeave(e);
        BeginInvoke(() =>
        {
            if (!popup.Focused) HideList();
        });
    }

    void ShowMatches()
    {
        Host();
        var q = Text.Trim();
        if (q.Length == 0)
        {
            HideList();
            return;
        }
        popup.BeginUpdate();
        popup.Items.Clear();
        foreach (string s in items)
        {
            if (s.Contains(q, StringComparison.OrdinalIgnoreCase))
                popup.Items.Add(s);
            if (popup.Items.Count >= 24) break;
        }
        popup.EndUpdate();
        if (popup.Items.Count == 0 || FindForm() is not Form form)
        {
            HideList();
            return;
        }
        var loc = form.PointToClient(PointToScreen(new Point(0, Height + 1)));
        popup.Location = loc;
        popup.Width = Math.Max(Width, 320);
        popup.Height = Math.Min(168, 8 + popup.Items.Count * 18);
        popup.Visible = true;
        popup.BringToFront();
    }

    void HideList() => popup.Visible = false;
}

sealed class AvatarView : Control
{
    Image? img;
    string initials = "U";

    public AvatarView()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.ResizeRedraw, true);
        Size = new Size(88, 88);
        Cursor = Cursors.Hand;
    }

    public void SetFrom(string? path, string name)
    {
        initials = string.IsNullOrWhiteSpace(name) ? "U" : char.ToUpperInvariant(name.Trim()[0]).ToString();
        img?.Dispose();
        img = Data.AvatarStore.Load(path);
        Invalidate();
    }

    public void SetFile(string file, string name)
    {
        initials = string.IsNullOrWhiteSpace(name) ? "U" : char.ToUpperInvariant(name.Trim()[0]).ToString();
        img?.Dispose();
        img = Data.AvatarStore.Load(file);
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.Clear(Parent?.BackColor ?? Ui.Panel);
        var r = new Rectangle(0, 0, Width - 1, Height - 1);
        using var fill = new SolidBrush(Ui.BrandSoft);
        g.FillEllipse(fill, r);
        if (img != null)
        {
            using var path = new GraphicsPath();
            path.AddEllipse(r);
            g.SetClip(path);
            g.DrawImage(img, Square(img, r));
            g.ResetClip();
        }
        else
        {
            using var font = new Font("Segoe UI", Math.Max(10, Height * 0.34f), FontStyle.Bold);
            using var ink = new SolidBrush(Ui.BrandDark);
            var sz = g.MeasureString(initials, font);
            g.DrawString(initials, font, ink, (Width - sz.Width) / 2f, (Height - sz.Height) / 2f);
        }
        using var pen = new Pen(Ui.Line);
        g.DrawEllipse(pen, r);
    }

    static Rectangle Square(Image src, Rectangle dest)
    {
        var side = Math.Min(src.Width, src.Height);
        var sx = (src.Width - side) / 2f;
        var scale = dest.Width / (float)side;
        return new Rectangle(
            dest.X - (int)(sx * scale),
            dest.Y - (int)((src.Height - side) / 2f * scale),
            (int)(src.Width * scale),
            (int)(src.Height * scale));
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing) img?.Dispose();
        base.Dispose(disposing);
    }
}

sealed class DashTile : Control
{
    readonly Color tone;
    readonly Action<Graphics, Rectangle> icon;

    public DashTile(string label, Color tone, Action<Graphics, Rectangle> icon, Action onClick)
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.ResizeRedraw, true);
        Text = label;
        this.tone = tone;
        this.icon = icon;
        Size = new Size(148, 148);
        Margin = new Padding(0, 0, 16, 16);
        Cursor = Cursors.Hand;
        TabStop = false;
        Click += (_, _) => onClick();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.Clear(Ui.Bg);
        var card = new Rectangle(0, 0, Width - 1, Height - 1);
        Ui.RoundFill(g, card, 16, Ui.Panel, Ui.Line);
        var ico = new Rectangle((Width - 72) / 2, 16, 72, 72);
        Ui.RoundFill(g, ico, 16, tone);
        icon(g, new Rectangle(ico.X + 18, ico.Y + 18, 36, 36));
        using var font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
        using var br = new SolidBrush(Ui.Ink);
        var text = new Rectangle(8, 96, Width - 16, 44);
        g.DrawString(Text, font, br, text, new StringFormat
        {
            Alignment = StringAlignment.Center,
            LineAlignment = StringAlignment.Near,
        });
    }
}

static class Icons
{
    public static void Home(Graphics g, Rectangle r, Color? color = null) => Draw(g, r, color, [
        [4, 11, 12, 4, 20, 11, 20, 20, 14, 20, 14, 14, 10, 14, 10, 20, 4, 20],
    ]);

    public static void User(Graphics g, Rectangle r, Color? color = null)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using var pen = new Pen(color ?? Color.White, 1.8f);
        g.DrawEllipse(pen, r.X + 7, r.Y + 2, 10, 10);
        g.DrawArc(pen, r.X + 2, r.Y + 14, 20, 16, 200, 140);
    }

    public static void Shield(Graphics g, Rectangle r, Color? color = null) => Draw(g, r, color, [
        [12, 3, 5, 6, 5, 12, 12, 21, 19, 12, 19, 6],
    ]);

    public static void Box(Graphics g, Rectangle r, Color? color = null) => Draw(g, r, color, [
        [3, 8, 12, 3, 21, 8, 12, 13],
        [3, 8, 3, 16, 12, 21, 12, 13],
        [21, 8, 21, 16, 12, 21],
    ]);

    public static void Coin(Graphics g, Rectangle r, Color? color = null)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using var pen = new Pen(color ?? Color.White, 1.8f);
        g.DrawEllipse(pen, r);
        g.DrawLine(pen, r.X + r.Width / 2, r.Y + 6, r.X + r.Width / 2, r.Bottom - 6);
    }

    public static void Doc(Graphics g, Rectangle r, Color? color = null) => Draw(g, r, color, [
        [6, 3, 14, 3, 18, 8, 18, 21, 6, 21],
        [14, 3, 14, 8, 18, 8],
    ]);

    public static void Serial(Graphics g, Rectangle r, Color? color = null)
    {
        using var pen = new Pen(color ?? Color.White, 2f);
        for (var i = 0; i < 5; i++)
        {
            var x = r.X + 2 + i * 4;
            g.DrawLine(pen, x, r.Y + 3, x, r.Bottom - 3);
        }
    }

    public static void Bell(Graphics g, Rectangle r, Color? color = null)
    {
        using var pen = new Pen(color ?? Ui.Ink, 1.6f);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.DrawLine(pen, r.X + 4, r.Y + 16, r.Right - 4, r.Y + 16);
        g.DrawArc(pen, r.X + 4, r.Y + 2, r.Width - 8, 16, 180, 180);
    }

    static void Draw(Graphics g, Rectangle r, Color? color, int[][] shapes)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using var pen = new Pen(color ?? Color.White, 1.8f) { LineJoin = LineJoin.Round };
        foreach (var pts in shapes)
        {
            var p = new PointF[pts.Length / 2];
            for (var i = 0; i < p.Length; i++)
            {
                p[i] = new PointF(
                    r.X + pts[i * 2] / 24f * r.Width,
                    r.Y + pts[i * 2 + 1] / 24f * r.Height);
            }
            if (p.Length > 2) g.DrawPolygon(pen, p);
            else if (p.Length == 2) g.DrawLine(pen, p[0], p[1]);
        }
    }
}
