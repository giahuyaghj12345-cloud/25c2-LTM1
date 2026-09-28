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

    public static bool IsAdmin => Role == "admin";
    public static bool SerialAllowed => CanCreateSerial || IsAdmin;

    public static string RoleLabel => Role switch
    {
        "admin" => "Quản trị viên",
        "warehouse" => "Quản lý kho",
        "warranty" => "Kỹ thuật bảo hành",
        "sales" => "Nhân viên bán hàng",
        _ => "Người dùng",
    };

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
