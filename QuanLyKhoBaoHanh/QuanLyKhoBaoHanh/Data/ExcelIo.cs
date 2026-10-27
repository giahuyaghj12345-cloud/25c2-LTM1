using System.Data;
using System.Xml.Linq;
using ClosedXML.Excel;

namespace QuanLyKhoBaoHanh.Data;

/// <summary>Đọc/ghi Excel kiểu AA_ImportExcel STHINK (HDR=YES, sheet list, normalize header).</summary>
static class ExcelIo
{
    static readonly XNamespace Ss = "urn:schemas-microsoft-com:office:spreadsheet";

    public static bool IsSpreadsheetMl(string path)
    {
        if (!path.EndsWith(".xls", StringComparison.OrdinalIgnoreCase)
            && !path.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
            return false;
        try
        {
            var head = File.ReadAllText(path);
            return head.Contains("urn:schemas-microsoft-com:office:spreadsheet", StringComparison.Ordinal);
        }
        catch { return false; }
    }

    public static DataTable ReadCsv(string path)
    {
        var lines = File.ReadAllLines(path);
        var dt = new DataTable("Data");
        if (lines.Length == 0) return dt;
        var headers = SplitCsvLine(lines[0]);
        foreach (var h in headers)
        {
            var name = h.Trim().Trim('"');
            if (string.IsNullOrEmpty(name)) name = "Col" + (dt.Columns.Count + 1);
            if (dt.Columns.Contains(name)) name += "_" + dt.Columns.Count;
            dt.Columns.Add(name);
        }
        for (var i = 1; i < lines.Length; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i])) continue;
            var cells = SplitCsvLine(lines[i]);
            var dr = dt.NewRow();
            for (var c = 0; c < dt.Columns.Count; c++)
                dr[c] = c < cells.Length ? cells[c].Trim().Trim('"') : "";
            dt.Rows.Add(dr);
        }
        return dt;
    }

    static string[] SplitCsvLine(string line)
    {
        var list = new List<string>();
        var cur = new System.Text.StringBuilder();
        var q = false;
        foreach (var ch in line)
        {
            if (ch == '"') { q = !q; continue; }
            if (ch == ',' && !q) { list.Add(cur.ToString()); cur.Clear(); continue; }
            cur.Append(ch);
        }
        list.Add(cur.ToString());
        return list.ToArray();
    }

    public static bool IsCsv(string path) =>
        path.EndsWith(".csv", StringComparison.OrdinalIgnoreCase);

    public static List<string> ListSheetNames(string path)
    {
        if (IsCsv(path)) return ["Data"];
        if (IsSpreadsheetMl(path))
        {
            var doc = XDocument.Load(path);
            return doc.Root!.Elements(Ss + "Worksheet")
                .Select(w => (string?)w.Attribute(Ss + "Name") ?? "Sheet1")
                .ToList();
        }
        using var wb = new XLWorkbook(path);
        return wb.Worksheets.Select(ws => ws.Name).ToList();
    }

    public static DataTable ReadSheet(string path, string sheetName)
    {
        if (IsCsv(path)) return ReadCsv(path);
        if (IsSpreadsheetMl(path)) return ReadSpreadsheetMl(path, sheetName);

        using var wb = new XLWorkbook(path);
        var ws = wb.Worksheets.FirstOrDefault(w =>
            string.Equals(w.Name, sheetName, StringComparison.OrdinalIgnoreCase)
            || string.Equals(w.Name + "$", sheetName, StringComparison.OrdinalIgnoreCase)
            || string.Equals(w.Name, sheetName.TrimEnd('$'), StringComparison.OrdinalIgnoreCase));
        if (ws == null)
            throw new InvalidOperationException("Không tìm thấy sheet: " + sheetName);

        var range = ws.RangeUsed();
        var dt = new DataTable(ws.Name);
        if (range == null) return dt;

        var firstRow = range.FirstRow();
        foreach (var cell in firstRow.Cells())
        {
            var name = cell.GetString().Trim();
            if (string.IsNullOrEmpty(name)) name = "Col" + cell.Address.ColumnNumber;
            if (dt.Columns.Contains(name)) name += "_" + cell.Address.ColumnNumber;
            dt.Columns.Add(name);
        }

        foreach (var row in range.RowsUsed().Skip(1))
        {
            var dr = dt.NewRow();
            var empty = true;
            for (var i = 0; i < dt.Columns.Count; i++)
            {
                var cell = row.Cell(i + 1);
                var v = CellText(cell);
                if (v.Length > 0) empty = false;
                dr[i] = v;
            }
            if (!empty) dt.Rows.Add(dr);
        }
        return dt;
    }

    public static void WriteTable(string path, DataTable table, string sheetName = "Sheet1")
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(sheetName);
        if (table.Columns.Count == 0)
        {
            wb.SaveAs(path);
            return;
        }
        for (var c = 0; c < table.Columns.Count; c++)
            ws.Cell(1, c + 1).Value = table.Columns[c].ColumnName;
        for (var r = 0; r < table.Rows.Count; r++)
        {
            for (var c = 0; c < table.Columns.Count; c++)
            {
                var v = table.Rows[r][c];
                ws.Cell(r + 2, c + 1).Value = v == null || v == DBNull.Value ? "" : Convert.ToString(v);
            }
        }
        ws.Columns().AdjustToContents();
        wb.SaveAs(path);
    }

    public static void WriteTemplate(string path, params (string Header, string Sample)[] cols)
    {
        var dt = new DataTable();
        foreach (var (h, _) in cols) dt.Columns.Add(h);
        var row = dt.NewRow();
        for (var i = 0; i < cols.Length; i++) row[i] = cols[i].Sample;
        dt.Rows.Add(row);
        WriteTable(path, dt, "Data");
    }

    public static DataColumn? FindColumn(DataTable table, params string[] names)
    {
        foreach (var n in names)
        {
            foreach (DataColumn c in table.Columns)
            {
                if (NormalizeHeader(c.ColumnName) == NormalizeHeader(n))
                    return c;
            }
        }
        return null;
    }

    public static string GetCell(DataRow row, params string[] names)
    {
        var c = FindColumn(row.Table, names);
        if (c == null || row[c] == DBNull.Value) return "";
        return Convert.ToString(row[c])?.Trim() ?? "";
    }

    public static string NormalizeHeader(string? s)
    {
        if (s == null) return "";
        return s.Trim().ToLowerInvariant().Replace("_", " ");
    }

    static string CellText(IXLCell cell)
    {
        if (cell.IsEmpty()) return "";
        try { return cell.GetString().Trim(); }
        catch
        {
            try { return cell.GetFormattedString().Trim(); }
            catch { return Convert.ToString(cell.Value)?.Trim() ?? ""; }
        }
    }

    static DataTable ReadSpreadsheetMl(string path, string sheetName)
    {
        var doc = XDocument.Load(path);
        var ws = doc.Root!.Elements(Ss + "Worksheet")
            .FirstOrDefault(w => string.Equals((string?)w.Attribute(Ss + "Name"), sheetName, StringComparison.OrdinalIgnoreCase))
            ?? doc.Root.Elements(Ss + "Worksheet").FirstOrDefault();
        var dt = new DataTable(sheetName);
        if (ws == null) return dt;
        var rows = ws.Element(Ss + "Table")?.Elements(Ss + "Row").ToList() ?? [];
        if (rows.Count == 0) return dt;
        var headerCells = rows[0].Elements(Ss + "Cell").Select(MlCellText).ToList();
        foreach (var h in headerCells)
        {
            var name = string.IsNullOrWhiteSpace(h) ? "Col" + (dt.Columns.Count + 1) : h;
            if (dt.Columns.Contains(name)) name += "_" + dt.Columns.Count;
            dt.Columns.Add(name);
        }
        for (var i = 1; i < rows.Count; i++)
        {
            var cells = rows[i].Elements(Ss + "Cell").Select(MlCellText).ToList();
            var dr = dt.NewRow();
            var empty = true;
            for (var c = 0; c < dt.Columns.Count; c++)
            {
                var v = c < cells.Count ? cells[c] : "";
                if (v.Length > 0) empty = false;
                dr[c] = v;
            }
            if (!empty) dt.Rows.Add(dr);
        }
        return dt;
    }

    static string MlCellText(XElement cell)
    {
        var data = cell.Element(Ss + "Data");
        return data?.Value?.Trim() ?? "";
    }
}
