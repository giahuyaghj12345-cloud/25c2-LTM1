using QuanLyKhoBaoHanh.Forms;

namespace QuanLyKhoBaoHanh;

static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        if (args.Any(a => a.Equals("--baocao", StringComparison.OrdinalIgnoreCase)))
        {
            BaoCaoShot.Run();
            return;
        }
        ApplicationConfiguration.Initialize();
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Ui.LoadSaved();
        AppAssets.Load();
        Application.Run(new FrmLogin());
    }
}
