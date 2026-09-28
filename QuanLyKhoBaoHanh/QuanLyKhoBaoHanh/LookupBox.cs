using System.Drawing.Drawing2D;

namespace QuanLyKhoBaoHanh;

public sealed class LookupBox : UserControl
{
    readonly TextBox box = new()
    {
        BorderStyle = BorderStyle.None,
        Font = Ui.Body,
        Dock = DockStyle.Fill,
    };
    readonly Button drop = new()
    {
        Text = "▾",
        Dock = DockStyle.Right,
        Width = 30,
        FlatStyle = FlatStyle.Flat,
        Cursor = Cursors.Hand,
        TabStop = false,
    };
    readonly ListBox popup = new()
    {
        Visible = false,
        Height = 180,
        IntegralHeight = false,
        Font = Ui.Body,
        BorderStyle = BorderStyle.FixedSingle,
    };
    AutoCompleteStringCollection items = [];
    bool focused;
    bool picking;
    string placeholder;

    public event EventHandler? Picked;

    public LookupBox(string hint = "Gõ để tìm...")
    {
        placeholder = hint;
        Height = 32;
        MinimumSize = new Size(120, 32);
        Padding = new Padding(10, 6, 4, 6);
        ApplyTheme();
        DoubleBuffered = true;
        Resize += (_, _) => ClipRound();
        HandleCreated += (_, _) => ClipRound();
        drop.FlatAppearance.BorderSize = 0;
        drop.Click += (_, _) => ToggleAll();
        box.GotFocus += (_, _) =>
        {
            if (box.Text == placeholder) { box.Text = ""; box.ForeColor = Ui.Ink; }
            focused = true;
            Invalidate();
        };
        box.LostFocus += (_, _) =>
        {
            if (string.IsNullOrWhiteSpace(box.Text))
            {
                box.Text = placeholder;
                box.ForeColor = Ui.Muted;
            }
            focused = false;
            Invalidate();
            BeginInvoke(() => { if (!popup.Focused) HideList(); });
        };
        box.TextChanged += (_, _) =>
        {
            if (!picking && box.Focused && box.Text != placeholder)
                ShowMatches(box.Text.Trim());
        };
        box.KeyDown += BoxKey;
        popup.Click += (_, _) =>
        {
            if (popup.SelectedItem is string v) Accept(v);
        };
        Controls.Add(box);
        Controls.Add(drop);
        ShowPlaceholder();
        Resize += (_, _) => Invalidate();
        Paint += (_, e) => DrawChrome(e.Graphics);
    }

    public void Bind(AutoCompleteStringCollection source) => items = source;

    public void ApplyTheme()
    {
        BackColor = Ui.Panel;
        box.BackColor = Ui.Panel;
        if (box.Text == placeholder) box.ForeColor = Ui.Muted;
        else box.ForeColor = Ui.Ink;
        drop.BackColor = Ui.Panel;
        drop.ForeColor = Ui.BrandDark;
        drop.FlatAppearance.MouseOverBackColor = Ui.BrandSoft;
        popup.BackColor = Ui.Panel;
        popup.ForeColor = Ui.Ink;
        Invalidate();
    }

    public override string Text
    {
        get => box.Text == placeholder ? "" : box.Text;
        set
        {
            picking = true;
            if (string.IsNullOrWhiteSpace(value)) ShowPlaceholder();
            else
            {
                box.Text = value;
                box.ForeColor = Ui.Ink;
            }
            picking = false;
        }
    }

    public string Code => Ui.SuggestCode(Text);

    public void Clear() => Text = "";

    void ShowPlaceholder()
    {
        box.Text = placeholder;
        box.ForeColor = Ui.Muted;
    }

    void ToggleAll()
    {
        if (popup.Visible) { HideList(); return; }
        box.Focus();
        if (box.Text == placeholder) { box.Text = ""; box.ForeColor = Ui.Ink; }
        ShowMatches("");
    }

    void BoxKey(object? sender, KeyEventArgs e)
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
            }
            else if (e.KeyCode == Keys.Escape) { HideList(); e.Handled = true; }
        }
        else if (e.KeyCode == Keys.Enter)
        {
            Picked?.Invoke(this, EventArgs.Empty);
            e.Handled = true;
        }
    }

    void Accept(string value)
    {
        picking = true;
        box.Text = value;
        box.ForeColor = Ui.Ink;
        picking = false;
        HideList();
        Picked?.Invoke(this, EventArgs.Empty);
    }

    void ShowMatches(string q)
    {
        Host();
        popup.BeginUpdate();
        popup.Items.Clear();
        foreach (string s in items)
        {
            if (q.Length == 0 || s.Contains(q, StringComparison.OrdinalIgnoreCase))
                popup.Items.Add(s);
            if (popup.Items.Count >= 30) break;
        }
        popup.EndUpdate();
        if (popup.Items.Count == 0 || FindForm() is not Form form)
        {
            HideList();
            return;
        }
        var loc = form.PointToClient(PointToScreen(new Point(0, Height + 2)));
        popup.Location = loc;
        popup.Width = Math.Max(Width, 340);
        popup.Height = Math.Min(200, 10 + popup.Items.Count * 22);
        popup.Visible = true;
        popup.BringToFront();
    }

    void Host()
    {
        var form = FindForm();
        if (form == null || popup.Parent == form) return;
        popup.Parent?.Controls.Remove(popup);
        form.Controls.Add(popup);
    }

    void HideList() => popup.Visible = false;

    void ClipRound()
    {
        if (Width < 8 || Height < 8) return;
        using var path = Ui.Rounded(new Rectangle(0, 0, Width, Height), 10);
        Region?.Dispose();
        Region = new Region(path);
    }

    void DrawChrome(Graphics g)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        var r = new Rectangle(1, 1, Width - 3, Height - 3);
        Ui.RoundFill(g, r, 10, Ui.Panel, focused ? Ui.Brand : Ui.Line);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            popup.Parent?.Controls.Remove(popup);
            popup.Dispose();
        }
        base.Dispose(disposing);
    }
}
