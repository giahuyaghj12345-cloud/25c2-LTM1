# -*- coding: utf-8 -*-
import zipfile, shutil, os, re
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
XML_NS = "{http://www.w3.org/XML/1998/namespace}"
ET.register_namespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
ET.register_namespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
ET.register_namespace("wp", "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing")
ET.register_namespace("w14", "http://schemas.microsoft.com/office/word/2010/wordml")
ET.register_namespace("w15", "http://schemas.microsoft.com/office/word/2012/wordml")
ET.register_namespace("mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")
ET.register_namespace("o", "urn:schemas-microsoft-com:office:office")
ET.register_namespace("v", "urn:schemas-microsoft-com:vml")
ET.register_namespace("w10", "urn:schemas-microsoft-com:office:word")
ET.register_namespace("wps", "http://schemas.microsoft.com/office/word/2010/wordprocessingShape")
ET.register_namespace("wpg", "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup")
ET.register_namespace("wp14", "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing")
ET.register_namespace("pic", "http://schemas.openxmlformats.org/drawingml/2006/picture")

SRC = r"D:\đồ án tốt nghiệp\_phieu\xml\unz\word\document.xml"
BOX, CHECK = "\u2610", "\u2611"

TICK = {
    "Desktop Application",
    "Management Information System",
    "Quản trị viên",
    "Nhân viên",
    "Doanh nghiệp",
    "Máy tính cá nhân",
    "Source Code",
    "Database",
    "File cài đặt/Deploy",
    "Tài khoản Demo",
    "Tài liệu hướng dẫn sử dụng",
    "Báo cáo đồ án",
    "Slide thuyết trình",
    "Video Demo",
    "ChatGPT",
    "Claude",
    "Công cụ AI khác",
    "Phân tích yêu cầu",
    "Thiết kế hệ thống",
    "Sinh mã nguồn",
    "Debug",
    "Viết tài liệu",
}

def new_run(text):
    r = ET.Element(f"{W}r")
    rPr = ET.SubElement(r, f"{W}rPr")
    sz = ET.SubElement(rPr, f"{W}sz")
    sz.set(f"{W}val", "26")
    szcs = ET.SubElement(rPr, f"{W}szCs")
    szcs.set(f"{W}val", "26")
    t = ET.SubElement(r, f"{W}t")
    if text[:1].isspace() or text[-1:].isspace():
        t.set(f"{XML_NS}space", "preserve")
    t.text = text
    return r

def para_text(p):
    return "".join((t.text or "") for t in p.iter(f"{W}t"))

def set_cell(tc, text):
    p = tc.find(f"{W}p")
    if p is None:
        p = ET.SubElement(tc, f"{W}p")
    for r in list(p.findall(f"{W}r")):
        p.remove(r)
    p.append(new_run(text))

def fill_after(root, needle, text):
    paras = list(root.iter(f"{W}p"))
    for i, p in enumerate(paras):
        if needle not in para_text(p):
            continue
        for q in paras[i + 1 : i + 8]:
            pt = para_text(q).strip()
            has_tab = q.find(f".//{W}tab") is not None
            if pt == "" or (has_tab and len(pt) < 2):
                q.append(new_run(text))
                return

tree = ET.parse(SRC)
root = tree.getroot()
nodes = list(root.iter(f"{W}t"))

ticked = 0
for i, node in enumerate(nodes):
    if node.text != BOX:
        continue
    label = ""
    for j in range(i + 1, min(i + 8, len(nodes))):
        label += nodes[j].text or ""
        if len(label.strip()) >= 3:
            break
    label = label.strip().rstrip(":").strip()
    hit = any(label.startswith(k) or k.startswith(label) for k in TICK)
    if hit:
        node.text = CHECK
        ticked += 1
print("ticked", ticked)

for node in nodes:
    if node.text == "Tên đề tài ":
        p = node
        while p is not None and p.tag != f"{W}p":
            p = p.getparent() if hasattr(p, "getparent") else None
        break
# ElementTree has no getparent by default — walk paras
for p in root.iter(f"{W}p"):
    if para_text(p).startswith("Tên đề tài"):
        p.append(new_run("Xây dựng phần mềm quản lý xuất kho và vòng đời bảo hành sản phẩm theo số serial"))
        break

for p in root.iter(f"{W}p"):
    if "Công cụ AI khác" in para_text(p):
        p.append(new_run(" Cursor"))
        break

fill_after(
    root,
    "Trình bày ngắn gọn vấn đề thực tế",
    "Doanh nghiệp bán hàng / bảo hành cần xuất kho theo phiếu, gán mã serial từng sản phẩm và tính hạn bảo hành theo loại khách (đại lý / khách lẻ). Làm tay trên Excel dễ trùng serial, sửa phiếu đã xuất và không khóa được khi đã tạo số. Đề tài giải quyết bài toán này bằng phần mềm desktop kết nối SQL Server.",
)
fill_after(
    root,
    "Vấn đề cần giải quyết",
    "Lập và quản lý phiếu xuất kho (bán / phụ tùng bảo hành); sinh số serial theo quy tắc, không trùng, reset theo tháng; chỉ một người dùng được vào chức năng tạo serial tại một thời điểm; khóa phiếu sau khi hoàn tất; phân quyền admin, kho, bảo hành, bán hàng.",
)
fill_after(
    root,
    "Mục tiêu tổng quát",
    "Xây dựng ứng dụng Windows quản lý xuất kho, danh mục sản phẩm/tiền công và vòng đời bảo hành theo serial, có phân quyền, dữ liệu lưu trên SQL Server.",
)

for p in root.iter(f"{W}p"):
    pt = para_text(p).strip()
    if pt in ("1.", "1. "):
        p.append(new_run(" Xây dựng phân hệ danh mục (sản phẩm, tiền công) và phiếu xuất kho."))
    elif pt in ("2.", "2. "):
        p.append(new_run(" Xây dựng quy trình tạo serial, khóa độc quyền và hoàn tất phiếu."))
    elif pt in ("3.", "3. "):
        p.append(new_run(" Xây dựng đăng nhập, hồ sơ, phân quyền và kiểm thử trên dữ liệu thật."))

plus = [
    " Người dùng, vai trò, quyền tạo serial",
    " Danh mục sản phẩm (dmsp), tiền công",
    " Phiếu xuất kho, dòng hàng, số serial, khóa tính năng và bộ đếm tháng",
]
pi = 0
for p in root.iter(f"{W}p"):
    if para_text(p).strip() in ("+", "+ "):
        if pi < len(plus):
            p.append(new_run(plus[pi]))
            pi += 1

fill_after(
    root,
    "Những nội dung không thuộc phạm vi đề tài",
    "Nhập kho mua hàng, kế toán tổng hợp, ứng dụng mobile, cổng khách hàng kích hoạt bảo hành trên web, tích hợp hạch toán ERP đầy đủ.",
)
fill_after(
    root,
    "Mô tả sản phẩm đầu ra",
    "Một ứng dụng Windows (QuanLyKhoBaoHanh.exe) đăng nhập được, lập phiếu xuất, tạo serial theo quy tắc, khóa phiếu sau hoàn tất; kèm source Visual Studio, database SQL Server, báo cáo và slide.",
)

tables = list(root.iter(f"{W}tbl"))
chucnang = [
    ("Đăng nhập / phân quyền", "Tài khoản, vai trò, cấp quyền tạo serial", "Cao"),
    ("Danh mục sản phẩm", "Mã, tên, ĐVT, nhóm serial, tồn kho", "Cao"),
    ("Danh mục tiền công", "Mã, tên, số tiền", "Trung bình"),
    ("Phiếu xuất kho", "Lập, sửa, lưu, hủy, xóa (khi chưa khóa)", "Cao"),
    ("Tạo số serial", "Sinh serial theo phiếu, hạn BH đại lý/lẻ", "Cao"),
    ("Hồ sơ / tồn kho", "Cập nhật thông tin user, xem tồn danh mục", "Trung bình"),
]
rows = list(tables[0].findall(f"{W}tr"))
for i, row in enumerate(chucnang):
    cells = list(rows[i + 1].findall(f"{W}tc"))
    set_cell(cells[1], row[0])
    set_cell(cells[2], row[1])
    set_cell(cells[3], row[2])

tech = [
    "Windows Forms (.NET 9)",
    "C# kết nối trực tiếp CSDL",
    "Microsoft SQL Server",
    "Không tách API (ADO.NET / Microsoft.Data.SqlClient)",
    ".NET 9 WinForms",
    "C#",
    "Visual Studio",
    "WinForms Designer",
    "Kiểm thử thủ công trên app và SQL",
    "Cursor, ChatGPT, Claude",
    "BCrypt (mã hóa mật khẩu)",
]
rows = list(tables[1].findall(f"{W}tr"))
for i, val in enumerate(tech):
    cells = list(rows[i + 1].findall(f"{W}tc"))
    set_cell(cells[2], val)

plan = [
    ("Tuần 1–2", "Mô tả nghiệp vụ xuất kho / serial"),
    ("Tuần 2–3", "Use case, phân quyền"),
    ("Tuần 3–4", "Sơ đồ chức năng, luồng phiếu"),
    ("Tuần 4–5", "Bảng users, dmsp, phiếu, serial"),
    ("Tuần 5–6", "Form đăng nhập, menu, phiếu xuất"),
    ("Tuần 6–11", "Các phân hệ chính"),
    ("Tuần 11–12", "Nối form với SQL, khóa serial"),
    ("Tuần 12–13", "Test trùng serial, khóa phiếu, quyền"),
    ("Tuần 13–14", "Sửa lỗi, đóng gói file .exe"),
    ("Tuần 14–15", "Báo cáo và slide"),
    ("Tuần 15", "Demo trên máy"),
]
rows = list(tables[2].findall(f"{W}tr"))
for i, row in enumerate(plan):
    cells = list(rows[i + 1].findall(f"{W}tc"))
    set_cell(cells[2], row[0])
    set_cell(cells[3], row[1])

rows = list(tables[3].findall(f"{W}tr"))
set_cell(list(rows[1].findall(f"{W}tc"))[1], "Nguyễn Phi Gia Huy")
set_cell(list(rows[1].findall(f"{W}tc"))[3], "60%")
set_cell(list(rows[2].findall(f"{W}tc"))[1], "Lưu Phú Nguyễn")
set_cell(list(rows[2].findall(f"{W}tc"))[3], "40%")
set_cell(list(rows[3].findall(f"{W}tc"))[1], "—")
set_cell(list(rows[3].findall(f"{W}tc"))[3], "—")
set_cell(list(rows[4].findall(f"{W}tc"))[1], "—")
set_cell(list(rows[4].findall(f"{W}tc"))[3], "—")

for t in root.iter(f"{W}t"):
    if t.text and "năm 2026" in t.text and "ngày" in t.text:
        t.text = re.sub(r"ngày\s*[.…]*\s*tháng\s*[.…]*\s*năm\s*2026", "ngày 24 tháng 08 năm 2026", t.text)

tree.write(SRC, encoding="UTF-8", xml_declaration=True)
print("saved", SRC)
