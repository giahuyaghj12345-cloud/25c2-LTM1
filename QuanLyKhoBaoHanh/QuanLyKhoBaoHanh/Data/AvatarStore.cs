using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

namespace QuanLyKhoBaoHanh.Data;

static class AvatarStore
{
    public static string Folder =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "QuanLyKhoBaoHanh", "avatars");

    public static void EnsureColumn()
    {
        try
        {
            SqlDb.Execute(@"IF COL_LENGTH('dbo.users', 'avatar') IS NULL
                ALTER TABLE dbo.users ADD avatar NVARCHAR(255) NULL");
        }
        catch
        {
            /* bảng users chưa có hoặc không đủ quyền — bỏ qua */
        }
    }

    public static string Save(Guid userId, string sourcePath)
    {
        Directory.CreateDirectory(Folder);
        using var src = OpenImage(sourcePath);
        using var fitted = Fit(src, 400);
        var name = $"{userId:N}_{DateTime.UtcNow.Ticks}.jpg";
        var dest = Path.Combine(Folder, name);
        fitted.Save(dest, ImageFormat.Jpeg);

        foreach (var extra in ExtraFolders())
        {
            try
            {
                Directory.CreateDirectory(extra);
                File.Copy(dest, Path.Combine(extra, name), true);
            }
            catch
            {
                /* thư mục web uploads không bắt buộc */
            }
        }

        return "/uploads/avatars/" + name;
    }

    public static Image? Load(string? stored)
    {
        var path = Resolve(stored);
        if (path == null) return null;
        try
        {
            using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var img = Image.FromStream(fs);
            return new Bitmap(img);
        }
        catch
        {
            return null;
        }
    }

    public static Image Letter(string name, int size)
    {
        var bmp = new Bitmap(size, size);
        using var g = Graphics.FromImage(bmp);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.Clear(Color.Transparent);
        using var fill = new SolidBrush(Ui.BrandSoft);
        g.FillEllipse(fill, 0, 0, size - 1, size - 1);
        using var font = new Font("Segoe UI", Math.Max(8, size * 0.38f), FontStyle.Bold);
        using var ink = new SolidBrush(Ui.BrandDark);
        var letter = string.IsNullOrWhiteSpace(name) ? "U" : char.ToUpperInvariant(name.Trim()[0]).ToString();
        var sz = g.MeasureString(letter, font);
        g.DrawString(letter, font, ink, (size - sz.Width) / 2f, (size - sz.Height) / 2f);
        return bmp;
    }

    public static string? Resolve(string? stored)
    {
        if (string.IsNullOrWhiteSpace(stored)) return null;
        var raw = stored.Trim().Replace('/', Path.DirectorySeparatorChar);
        if (File.Exists(raw)) return raw;
        var name = Path.GetFileName(raw);
        if (string.IsNullOrEmpty(name)) return null;
        foreach (var dir in new[] { Folder, Path.Combine(AppContext.BaseDirectory, "avatars") }.Concat(ExtraFolders()))
        {
            var cand = Path.Combine(dir, name);
            if (File.Exists(cand)) return cand;
        }
        return null;
    }

    static IEnumerable<string> ExtraFolders()
    {
        var dir = AppContext.BaseDirectory;
        for (var i = 0; i < 8 && !string.IsNullOrEmpty(dir); i++)
        {
            var backend = Path.Combine(dir, "backend");
            if (Directory.Exists(backend))
                yield return Path.Combine(backend, "uploads", "avatars");
            var uploads = Path.Combine(dir, "uploads", "avatars");
            if (Directory.Exists(uploads) || Directory.Exists(Path.Combine(dir, "uploads")))
                yield return uploads;
            dir = Directory.GetParent(dir)?.FullName ?? "";
        }
    }

    static Image OpenImage(string path)
    {
        using var tmp = new MemoryStream(File.ReadAllBytes(path));
        using var img = Image.FromStream(tmp);
        return new Bitmap(img);
    }

    static Image Fit(Image src, int max)
    {
        var scale = Math.Min(1f, max / (float)Math.Max(src.Width, src.Height));
        var w = Math.Max(1, (int)(src.Width * scale));
        var h = Math.Max(1, (int)(src.Height * scale));
        var bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb);
        using var g = Graphics.FromImage(bmp);
        g.Clear(Color.White);
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.DrawImage(src, 0, 0, w, h);
        return bmp;
    }
}
