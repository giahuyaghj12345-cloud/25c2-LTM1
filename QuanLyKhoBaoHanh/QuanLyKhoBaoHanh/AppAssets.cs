namespace QuanLyKhoBaoHanh;

public static class AppAssets
{
    public static Image? Catalog { get; private set; }
    public static Image? Warehouse { get; private set; }

    public static void Load()
    {
        Catalog = LoadPng("catalog.png");
        Warehouse = LoadPng("warehouse.png");
    }

    static Image? LoadPng(string file)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Assets", file);
        if (!File.Exists(path))
            path = Path.Combine(Application.StartupPath, "Assets", file);
        if (!File.Exists(path)) return null;
        using var fs = File.OpenRead(path);
        return Image.FromStream(fs);
    }
}
