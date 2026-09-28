using QuanLyKhoBaoHanh.Forms;

namespace QuanLyKhoBaoHanh;

static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Ui.LoadSaved();
        AppAssets.Load();
        Application.Run(new FrmLogin());
    }
}
