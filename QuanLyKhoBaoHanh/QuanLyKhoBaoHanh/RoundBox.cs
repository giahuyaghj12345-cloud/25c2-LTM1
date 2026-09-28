using System.Drawing.Drawing2D;

namespace QuanLyKhoBaoHanh;

public class RoundBox : UserControl
{
    readonly TextBox box = new()
    {
        BorderStyle = BorderStyle.None,
        Font = Ui.Body,
        Dock = DockStyle.Fill,
    };
    bool focused;

    public RoundBox()
    {
        Height = 32;
        MinimumSize = new Size(40, 32);
        Padding = new Padding(10, 6, 10, 6);
        ApplyTheme();
        DoubleBuffered = true;
        Controls.Add(box);
        box.GotFocus += (_, _) => { focused = true; Invalidate(); };
        box.LostFocus += (_, _) => { focused = false; Invalidate(); };
        box.TextChanged += (_, _) => OnTextChanged(EventArgs.Empty);
        Resize += (_, _) => ClipRound();
        HandleCreated += (_, _) => ClipRound();
        Paint += (_, e) =>
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Ui.RoundFill(e.Graphics, new Rectangle(1, 1, Width - 3, Height - 3), 10,
                Ui.Panel, focused ? Ui.Brand : Ui.Line);
        };
    }

    public override string Text
    {
        get => box.Text;
        set => box.Text = value ?? "";
    }

    [System.ComponentModel.DesignerSerializationVisibility(System.ComponentModel.DesignerSerializationVisibility.Hidden)]
    public bool ReadOnly
    {
        get => box.ReadOnly;
        set => box.ReadOnly = value;
    }

    public void Clear() => box.Clear();

    public void ApplyTheme()
    {
        BackColor = Ui.Panel;
        box.BackColor = Ui.Panel;
        box.ForeColor = Ui.Ink;
        Invalidate();
    }

    void ClipRound()
    {
        if (Width < 8 || Height < 8) return;
        using var path = Ui.Rounded(new Rectangle(0, 0, Width, Height), 10);
        Region?.Dispose();
        Region = new Region(path);
    }
}
