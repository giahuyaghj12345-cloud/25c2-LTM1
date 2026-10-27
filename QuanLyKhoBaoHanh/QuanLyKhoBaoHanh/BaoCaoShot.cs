using System.Data;
using System.Drawing.Imaging;
using QuanLyKhoBaoHanh.Data;
using QuanLyKhoBaoHanh.Forms;

namespace QuanLyKhoBaoHanh;

static class BaoCaoShot
{
    static string Dir = "";

    public static void Run()
    {
        ApplicationConfiguration.Initialize();
        Application.EnableVisualStyles();
        Ui.LoadSaved();
        AppAssets.Load();

        Dir = @"D:\đồ án tốt nghiệp\QuanLyKhoBaoHanh\bao-cao\anh";
        Directory.CreateDirectory(Dir);
        File.WriteAllText(Path.Combine(Dir, "_log.txt"), "start " + DateTime.Now + Environment.NewLine);

        try
        {
            LoginSession();
        }
        catch (Exception ex)
        {
            File.AppendAllText(Path.Combine(Dir, "_log.txt"), "login: " + ex + Environment.NewLine);
            throw;
        }

        TryShot("01", () => ShotForm(new FrmLogin(), "01_dang_nhap.png", 460, 450, f =>
        {
            foreach (var tb in All<TextBox>(f).Take(1))
                tb.Text = "Huy";
        }));
        TryShot("02", () => ShotForm(new FrmRegister(), "02_dang_ky.png", 420, 320));
        TryShot("03", () => ShotMain("home", "03_tong_quan.png"));
        TryShot("04", () => ShotMain("products", "04_dm_san_pham.png"));
        TryShot("05", () => ShotMain("customers", "05_dm_khach.png"));
        TryShot("06", () => ShotMain("labors", "06_dm_tien_cong.png"));
        TryShot("07", () => ShotMain("pxk", "07_phieu_xuat_kho.png"));
        TryShot("08", () => ShotMain("ton", "08_ton_kho.png"));
        TryShot("09", () => ShotMain("serial", "09_tao_serial.png"));
        TryShot("10", () => ShotMain("bh_phieu", "10_phieu_bh.png"));
        TryShot("11", () => ShotForm(new FrmWarrantyEdit(), "11_phieu_bh_chi_tiet.png", 1080, 760));
        TryShot("12", () => ShotMain("bh_bg", "12_bao_gia.png"));
        TryShot("13", () => ShotMain("bh_kho", "13_kho_bh.png"));
        TryShot("14", () => ShotMain("bh_thu", "14_thu_pt.png"));
        TryShot("15", () => ShotMain("bh_hd", "15_hoa_don.png"));
        TryShot("16", () => ShotMain("bh_seri", "16_tra_cuu.png"));
        TryShot("17", () => ShotMain("users", "17_phan_quyen.png"));
        TryShot("18", () => ShotMain("profile", "18_ho_so.png"));
        TryShot("19", () => ShotForm(new FrmWarrantyPick(), "19_chon_phieu_bh.png", 820, 480));
        TryShot("20", () => ShotForm(new FrmWarrantyWhEdit(7, "xuat"), "20_kho_xuat_pt.png", 860, 560));
    }

    static void TryShot(string tag, Action act)
    {
        try { act(); }
        catch (Exception ex)
        {
            File.AppendAllText(Path.Combine(Dir, "_log.txt"), tag + " ERR " + ex.Message + Environment.NewLine);
        }
    }

    static void LoginSession()
    {
        var dt = SqlDb.Query("SELECT TOP 1 id, username, email, role, ISNULL(canCreateSerial,0) AS canCreateSerial FROM dbo.users WHERE role=N'admin' OR username=N'Huy'");
        if (dt.Rows.Count == 0) throw new InvalidOperationException("Chưa có user admin.");
        var r = dt.Rows[0];
        Session.UserId = (Guid)r["id"];
        Session.Username = Convert.ToString(r["username"]) ?? "Huy";
        Session.Email = Convert.ToString(r["email"]) ?? "";
        Session.Role = Convert.ToString(r["role"]) ?? "admin";
        Session.CanCreateSerial = true;
    }

    static void ShotMain(string key, string file)
    {
        using var main = new FrmMain();
        main.StartPosition = FormStartPosition.Manual;
        main.WindowState = FormWindowState.Normal;
        main.Bounds = new Rectangle(20, 20, 1366, 800);
        main.Show();
        while (!main.IsHandleCreated) Application.DoEvents();
        WaitUi(800);
        if (key != "home")
        {
            main.OpenPage(key);
            WaitUi(900);
        }
        Capture(main, file);
        main.Close();
        WaitUi(80);
    }

    static void ShotForm(Form f, string file, int w, int h, Action<Form>? fill = null)
    {
        using (f)
        {
            f.StartPosition = FormStartPosition.Manual;
            f.Bounds = new Rectangle(40, 40, w, h);
            fill?.Invoke(f);
            f.Show();
            WaitUi(400);
            Capture(f, file);
            f.Close();
        }
        WaitUi(80);
    }

    static void Capture(Form f, string file)
    {
        f.TopMost = true;
        f.Activate();
        Application.DoEvents();
        WaitUi(150);
        using var bmp = new Bitmap(Math.Max(100, f.Width), Math.Max(80, f.Height));
        f.DrawToBitmap(bmp, new Rectangle(Point.Empty, bmp.Size));
        var path = Path.Combine(Dir, file);
        bmp.Save(path, ImageFormat.Png);
        File.AppendAllText(Path.Combine(Dir, "_log.txt"), file + " ok" + Environment.NewLine);
    }

    static void WaitUi(int ms)
    {
        var until = DateTime.UtcNow.AddMilliseconds(ms);
        while (DateTime.UtcNow < until)
        {
            Application.DoEvents();
            Thread.Sleep(15);
        }
    }

    static IEnumerable<T> All<T>(Control root) where T : Control
    {
        foreach (Control c in root.Controls)
        {
            if (c is T t) yield return t;
            foreach (var x in All<T>(c)) yield return x;
        }
    }
}
