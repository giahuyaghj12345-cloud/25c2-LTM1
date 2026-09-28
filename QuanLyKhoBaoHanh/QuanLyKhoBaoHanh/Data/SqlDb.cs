using System.Configuration;
using System.Data;
using Microsoft.Data.SqlClient;

namespace QuanLyKhoBaoHanh.Data;

public static class SqlDb
{
    public static string ConnectionString
    {
        get
        {
            var raw = ConfigurationManager.ConnectionStrings["Quanlysanpham"]?.ConnectionString
                ?? "Data Source=localhost\\SQLEXPRESS03;Initial Catalog=Quanlysanpham;User ID=your_username;Password=your_password;Encrypt=False;TrustServerCertificate=True;";
            if (raw.IndexOf("Connect Timeout", StringComparison.OrdinalIgnoreCase) < 0
                && raw.IndexOf("Connection Timeout", StringComparison.OrdinalIgnoreCase) < 0)
                raw += ";Connect Timeout=8";
            return raw;
        }
    }

    public static SqlConnection Open()
    {
        var conn = new SqlConnection(ConnectionString);
        conn.Open();
        return conn;
    }

    public static DataTable Query(string sql, params SqlParameter[] parameters)
    {
        using var conn = Open();
        using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 20 };
        if (parameters.Length > 0) cmd.Parameters.AddRange(parameters);
        using var adapter = new SqlDataAdapter(cmd);
        var table = new DataTable();
        adapter.Fill(table);
        return table;
    }

    public static int Execute(string sql, params SqlParameter[] parameters)
    {
        using var conn = Open();
        using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 20 };
        if (parameters.Length > 0) cmd.Parameters.AddRange(parameters);
        return cmd.ExecuteNonQuery();
    }

    public static object? Scalar(string sql, params SqlParameter[] parameters)
    {
        using var conn = Open();
        using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 20 };
        if (parameters.Length > 0) cmd.Parameters.AddRange(parameters);
        return cmd.ExecuteScalar();
    }

    public static DataTable ExecProc(string name, params SqlParameter[] parameters)
    {
        using var conn = Open();
        using var cmd = new SqlCommand(name, conn)
        {
            CommandType = CommandType.StoredProcedure,
            CommandTimeout = 20,
        };
        if (parameters.Length > 0) cmd.Parameters.AddRange(parameters);
        using var adapter = new SqlDataAdapter(cmd);
        var table = new DataTable();
        adapter.Fill(table);
        return table;
    }

    public static SqlParameter P(string name, object? value) =>
        new(name, value ?? DBNull.Value);
}
