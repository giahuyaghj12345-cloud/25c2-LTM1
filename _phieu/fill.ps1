# Fill thesis registration form (tick + content)
$ErrorActionPreference = 'Stop'
$wNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
$xmlPath = 'D:\đồ án tốt nghiệp\_phieu\xml\unz\word\document.xml'

$xml = New-Object System.Xml.XmlDocument
$xml.PreserveWhitespace = $true
$xml.Load($xmlPath)
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w', $wNs)

function NewRun([string]$text) {
  $r = $xml.CreateElement('w', 'r', $wNs)
  $rPr = $xml.CreateElement('w', 'rPr', $wNs)
  $sz = $xml.CreateElement('w', 'sz', $wNs)
  $sz.SetAttribute('val', $wNs, '26') | Out-Null
  $szCs = $xml.CreateElement('w', 'szCs', $wNs)
  $szCs.SetAttribute('val', $wNs, '26') | Out-Null
  [void]$rPr.AppendChild($sz)
  [void]$rPr.AppendChild($szCs)
  [void]$r.AppendChild($rPr)
  $t = $xml.CreateElement('w', 't', $wNs)
  if ($text.StartsWith(' ') -or $text.EndsWith(' ')) {
    $t.SetAttribute('space', 'http://www.w3.org/XML/1998/namespace', 'preserve') | Out-Null
  }
  $t.InnerText = $text
  [void]$r.AppendChild($t)
  return $r
}

function SetCell([System.Xml.XmlNode]$tc, [string]$text) {
  $p = $tc.SelectSingleNode('./w:p[1]', $ns)
  if (-not $p) { return }
  $runs = @($p.SelectNodes('./w:r', $ns))
  foreach ($r in $runs) { [void]$p.RemoveChild($r) }
  [void]$p.AppendChild((NewRun $text))
}

function Table($i) { @($xml.SelectNodes('//w:tbl', $ns))[$i] }
function Rows($tbl) { @($tbl.SelectNodes('./w:tr', $ns)) }
function Cells($tr) { @($tr.SelectNodes('./w:tc', $ns)) }

# ---- tick boxes by following label ----
$tick = [System.Collections.Generic.HashSet[string]]::new()
@(
  'Desktop Application',
  'Management Information System',
  'Quản trị viên',
  'Nhân viên',
  'Doanh nghiệp',
  'Máy tính cá nhân',
  'Source Code',
  'Database',
  'File cài đặt/Deploy',
  'Tài khoản Demo',
  'Tài liệu hướng dẫn sử dụng',
  'Báo cáo đồ án',
  'Slide thuyết trình',
  'Video Demo',
  'ChatGPT',
  'Claude',
  'Công cụ AI khác',
  'Phân tích yêu cầu',
  'Thiết kế hệ thống',
  'Sinh mã nguồn',
  'Debug',
  'Viết tài liệu'
) | ForEach-Object { [void]$tick.Add($_) }

$box = [char]0x2610
$checked = [char]0x2611
$nodes = @($xml.SelectNodes('//w:t', $ns))
$ticked = 0
for ($i = 0; $i -lt $nodes.Count; $i++) {
  if ($nodes[$i].InnerText -ne $box) { continue }
  $label = ''
  for ($j = $i + 1; $j -lt [Math]::Min($i + 8, $nodes.Count); $j++) {
    $label += $nodes[$j].InnerText
    if ($label.Trim().Length -ge 3) { break }
  }
  $label = $label.Trim().TrimEnd(':').Trim()
  $hit = $false
  foreach ($k in $tick) {
    if ($label.StartsWith($k) -or $k.StartsWith($label)) { $hit = $true; break }
  }
  if ($hit) {
    $nodes[$i].InnerText = $checked
    $ticked++
  }
}
Write-Output "Ticked $ticked checkboxes"

# ---- Tên đề tài ----
for ($i = 0; $i -lt $nodes.Count; $i++) {
  if ($nodes[$i].InnerText -eq 'Tên đề tài ') {
    $p = $nodes[$i].SelectSingleNode('ancestor::w:p', $ns)
    [void]$p.AppendChild((NewRun 'Xây dựng phần mềm quản lý xuất kho và vòng đời bảo hành sản phẩm theo số serial'))
    break
  }
}

# ---- Công cụ AI khác: Cursor ----
for ($i = 0; $i -lt $nodes.Count; $i++) {
  if ($nodes[$i].InnerText -like '*Công cụ AI khác*') {
    $p = $nodes[$i].SelectSingleNode('ancestor::w:p', $ns)
    [void]$p.AppendChild((NewRun ' Cursor'))
    break
  }
}

# ---- empty paragraph filler after a heading snippet ----
function FillAfter([string]$contains, [string]$text, [int]$skipEmpty = 0) {
  $paras = @($xml.SelectNodes('//w:p', $ns))
  for ($i = 0; $i -lt $paras.Count; $i++) {
    $pt = ($paras[$i].SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
    if ($pt -notlike "*$contains*") { continue }
    $filled = 0
    for ($j = $i + 1; $j -lt $paras.Count; $j++) {
      $qt = ($paras[$j].SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
      $hasTab = $null -ne $paras[$j].SelectSingleNode('.//w:tab', $ns)
      $plain = $qt.Trim()
      if ($plain -eq '' -or ($hasTab -and $plain.Length -lt 2)) {
        if ($skipEmpty -gt 0) { $skipEmpty--; continue }
        [void]$paras[$j].AppendChild((NewRun $text))
        return
      }
      # stop if next real heading
      if ($plain.Length -gt 8 -and $filled -eq 0) { return }
    }
    return
  }
}

FillAfter 'Trình bày ngắn gọn vấn đề thực tế' 'Doanh nghiệp bán hàng / bảo hành cần xuất kho theo phiếu, gán mã serial từng sản phẩm và tính hạn bảo hành theo loại khách (đại lý / khách lẻ). Làm tay trên Excel dễ trùng serial, sửa phiếu đã xuất và không khóa được khi đã tạo số. Đề tài giải quyết bài toán này bằng phần mềm desktop kết nối SQL Server.'
FillAfter 'Vấn đề cần giải quyết' 'Lập và quản lý phiếu xuất kho (bán / phụ tùng bảo hành); sinh số serial theo quy tắc, không trùng, reset theo tháng; chỉ một người dùng được vào chức năng tạo serial tại một thời điểm; khóa phiếu sau khi hoàn tất; phân quyền admin, kho, bảo hành, bán hàng.'
FillAfter 'Mục tiêu tổng quát' 'Xây dựng ứng dụng Windows quản lý xuất kho, danh mục sản phẩm/tiền công và vòng đời bảo hành theo serial, có phân quyền, dữ liệu lưu trên SQL Server.'
FillAfter 'Các mục tiêu cụ thể' '1. Xây dựng phân hệ danh mục (sản phẩm, tiền công) và phiếu xuất kho.'
# second/third objective lines may already have "1. 2. 3." in one paragraph — append 2 and 3 there
for ($i = 0; $i -lt $nodes.Count; $i++) {
  if ($nodes[$i].InnerText -eq '1. ') {
    $p = $nodes[$i].SelectSingleNode('ancestor::w:p', $ns)
    # the paragraph might be just "1. " then later paras "2. " "3. "
  }
}
$paras = @($xml.SelectNodes('//w:p', $ns))
foreach ($p in $paras) {
  $pt = ($p.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
  if ($pt.Trim() -eq '1.') { [void]$p.AppendChild((NewRun ' Xây dựng phân hệ danh mục (sản phẩm, tiền công) và phiếu xuất kho.')) }
  if ($pt.Trim() -eq '2.') { [void]$p.AppendChild((NewRun ' Xây dựng quy trình tạo serial, khóa độc quyền và hoàn tất phiếu.')) }
  if ($pt.Trim() -eq '3.') { [void]$p.AppendChild((NewRun ' Xây dựng đăng nhập, hồ sơ, phân quyền và kiểm thử trên dữ liệu thật.')) }
}

FillAfter 'Đề tài dự kiến quản lý các loại dữ liệu' '+ Người dùng, vai trò, quyền tạo serial'
# fill remaining + lines
$plusLeft = @(
  '+ Danh mục sản phẩm (dmsp), tiền công',
  '+ Phiếu xuất kho, dòng hàng, số serial, khóa tính năng và bộ đếm tháng'
)
$pi = 0
foreach ($p in $paras) {
  $pt = ($p.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
  if ($pt.Trim() -eq '+' -or $pt.Trim() -eq '+') {
    if ($pi -lt $plusLeft.Count) {
      [void]$p.AppendChild((NewRun (' ' + $plusLeft[$pi].TrimStart('+').Trim())))
      $pi++
    }
  }
}

FillAfter 'Những nội dung không thuộc phạm vi đề tài' 'Nhập kho mua hàng, kế toán tổng hợp, ứng dụng mobile, cổng khách hàng kích hoạt bảo hành trên web, tích hợp hạch toán ERP đầy đủ.'
FillAfter 'Mô tả sản phẩm đầu ra' 'Một ứng dụng Windows (QuanLyKhoBaoHanh.exe) đăng nhập được, lập phiếu xuất, tạo serial theo quy tắc, khóa phiếu sau hoàn tất; kèm source Visual Studio, database SQL Server, báo cáo và slide.'

# ---- tables ----
$chucnang = @(
  @('Đăng nhập / phân quyền', 'Tài khoản, vai trò, cấp quyền tạo serial', 'Cao'),
  @('Danh mục sản phẩm', 'Mã, tên, ĐVT, nhóm serial, tồn kho', 'Cao'),
  @('Danh mục tiền công', 'Mã, tên, số tiền', 'Trung bình'),
  @('Phiếu xuất kho', 'Lập, sửa, lưu, hủy, xóa (khi chưa khóa)', 'Cao'),
  @('Tạo số serial', 'Sinh serial theo phiếu, hạn BH đại lý/lẻ', 'Cao'),
  @('Hồ sơ / tồn kho', 'Cập nhật thông tin user, xem tồn danh mục', 'Trung bình')
)
$tbl = Table 0
$rs = Rows $tbl
for ($r = 0; $r -lt 6; $r++) {
  $cs = Cells $rs[$r + 1]
  SetCell $cs[1] $chucnang[$r][0]
  SetCell $cs[2] $chucnang[$r][1]
  SetCell $cs[3] $chucnang[$r][2]
}

$tech = @(
  'Windows Forms (.NET 9)',
  'C# kết nối trực tiếp CSDL',
  'Microsoft SQL Server',
  'Không tách API (ADO.NET / Microsoft.Data.SqlClient)',
  '.NET 9 WinForms',
  'C#',
  'Visual Studio',
  'WinForms Designer',
  'Kiểm thử thủ công trên app và SQL',
  'Cursor, ChatGPT, Claude',
  'BCrypt (mã hóa mật khẩu)'
)
$tbl = Table 1
$rs = Rows $tbl
for ($r = 0; $r -lt $tech.Count; $r++) {
  $cs = Cells $rs[$r + 1]
  SetCell $cs[2] $tech[$r]
}

$plan = @(
  @('Tuần 1–2', 'Mô tả nghiệp vụ xuất kho / serial'),
  @('Tuần 2–3', 'Use case, phân quyền'),
  @('Tuần 3–4', 'Sơ đồ chức năng, luồng phiếu'),
  @('Tuần 4–5', 'Bảng users, dmsp, phiếu, serial'),
  @('Tuần 5–6', 'Form đăng nhập, menu, phiếu xuất'),
  @('Tuần 6–11', 'Các phân hệ chính'),
  @('Tuần 11–12', 'Nối form với SQL, khóa serial'),
  @('Tuần 12–13', 'Test trùng serial, khóa phiếu, quyền'),
  @('Tuần 13–14', 'Sửa lỗi, đóng gói file .exe'),
  @('Tuần 14–15', 'Báo cáo và slide'),
  @('Tuần 15', 'Demo trên máy')
)
$tbl = Table 2
$rs = Rows $tbl
for ($r = 0; $r -lt $plan.Count; $r++) {
  $cs = Cells $rs[$r + 1]
  SetCell $cs[2] $plan[$r][0]
  SetCell $cs[3] $plan[$r][1]
}

$tbl = Table 3
$rs = Rows $tbl
SetCell (Cells $rs[1])[1] 'Nguyễn Phi Gia Huy'
SetCell (Cells $rs[1])[3] '60%'
SetCell (Cells $rs[2])[1] 'Lưu Phú Nguyễn'
SetCell (Cells $rs[2])[3] '40%'
SetCell (Cells $rs[3])[1] '—'
SetCell (Cells $rs[3])[3] '—'
SetCell (Cells $rs[4])[1] '—'
SetCell (Cells $rs[4])[3] '—'

# date
foreach ($n in @($xml.SelectNodes('//w:t', $ns))) {
  if ($n.InnerText -match 'ngày') {
    $n.InnerText = $n.InnerText -replace 'ngày\s*[.…]*\s*tháng\s*[.…]*\s*năm\s*2026', 'ngày 24 tháng 08 năm 2026'
  }
}

$xml.Save($xmlPath)
Write-Output 'Saved document.xml'
