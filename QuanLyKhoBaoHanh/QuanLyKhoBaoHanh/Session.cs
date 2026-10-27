namespace QuanLyKhoBaoHanh;

public static class Session
{
    public static Guid UserId { get; set; }
    public static string Username { get; set; } = "";
    public static string Email { get; set; } = "";
    public static string Role { get; set; } = "user";
    public static string Phone { get; set; } = "";
    public static string Address { get; set; } = "";
    public static string Cccd { get; set; } = "";
    public static string Avatar { get; set; } = "";
    public static bool CanCreateSerial { get; set; }

    public static string RoleKey => (Role ?? "user").Trim().ToLowerInvariant();
    public static bool IsAdmin => RoleKey == "admin";
    public static bool SerialAllowed => CanCreateSerial || IsAdmin;

    public static string RoleLabel => RoleKey switch
    {
        "admin" => "Quản trị viên",
        "warehouse" => "Quản lý kho",
        "warranty" => "Kỹ thuật bảo hành",
        "sales" => "Nhân viên bán hàng",
        _ => "Người dùng",
    };

    public static readonly string[] KnownRoles = ["admin", "warehouse", "warranty", "sales", "user"];

    /// <summary>Quyền menu theo vai trò (bám ma trận demo GGV / đồ án).</summary>
    public static bool CanAccess(string key)
    {
        var r = RoleKey;
        return key switch
        {
            "home" or "profile" or "bh_seri" => true,
            "users" => r == "admin",
            "products" or "customers" => r is "admin" or "warehouse" or "warranty" or "sales",
            "labors" => r is "admin" or "warehouse" or "warranty",
            "pxk" => r is "admin" or "warehouse" or "sales",
            "ton" => r is "admin" or "warehouse",
            "serial" => SerialAllowed,
            "bh_phieu" or "bh_bg" or "bh_thu" or "bh_hd" => r is "admin" or "warranty",
            "bh_kho" => r is "admin" or "warehouse" or "warranty",
            _ => r == "admin",
        };
    }

    public static void Clear()
    {
        UserId = Guid.Empty;
        Username = "";
        Email = "";
        Role = "user";
        Phone = "";
        Address = "";
        Cccd = "";
        Avatar = "";
        CanCreateSerial = false;
    }
}
