import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Product } from "../entities/Product";
import { Customer } from "../entities/Customer";
import { LaborCost } from "../entities/LaborCost";
import { AuthRequest } from "../middlewares/auth.middleware";
import { addNotification } from "../services/notification.service";
import {
  cell,
  parseBool,
  parseNumber,
  parseWorkbook,
  templateFileName,
  templateXlsx,
} from "../services/excelImport.service";

type ImportMode = "products" | "labors" | "customers";

function modeFromParam(raw: string): ImportMode | null {
  if (raw === "products" || raw === "labors" || raw === "customers") return raw;
  return null;
}

export async function parseImportFile(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ message: "Chọn file Excel/CSV để import" });
    }
    const sheets = parseWorkbook(file.buffer, file.originalname || "");
    if (!sheets.length) {
      return res.status(400).json({ message: "File không có sheet dữ liệu" });
    }
    res.json({
      fileName: file.originalname,
      sheets: sheets.map((s) => ({
        name: s.name,
        rowCount: s.rows.length,
        headers: s.rows[0] ? Object.keys(s.rows[0]) : [],
        rows: s.rows.slice(0, 200),
        allRows: s.rows,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không đọc được file Excel/CSV" });
  }
}

export async function commitImport(req: AuthRequest, res: Response) {
  try {
    const mode = modeFromParam(String(req.params.mode || ""));
    if (!mode) return res.status(400).json({ message: "Mode import không hợp lệ" });

    const rows = Array.isArray(req.body?.rows) ? (req.body.rows as Record<string, string>[]) : [];
    if (!rows.length) {
      return res.status(400).json({ message: "Không có dòng dữ liệu để import" });
    }

    const result =
      mode === "products"
        ? await importProducts(rows)
        : mode === "labors"
          ? await importLabors(rows)
          : await importCustomers(rows);

    await addNotification(
      "catalog",
      `Import Excel ${mode}: +${result.inserted} / cập nhật ${result.updated} / bỏ ${result.skipped}`,
      req.user?.id
    );

    res.json({
      message: `Import xong: thêm ${result.inserted}, cập nhật ${result.updated}, bỏ qua ${result.skipped}`,
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Import thất bại" });
  }
}

export function downloadTemplate(req: AuthRequest, res: Response) {
  const mode = modeFromParam(String(req.params.mode || ""));
  if (!mode) return res.status(400).json({ message: "Mode không hợp lệ" });
  const name = templateFileName(mode, "xlsx");
  const buffer = templateXlsx(mode);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  res.send(buffer);
}

async function importProducts(rows: Record<string, string>[]) {
  const repo = AppDataSource.getRepository(Product);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    let code = cell(row, "ma_sp", "ma sp", "mã sp", "mã sản phẩm", "code", "ma");
    if (!code) {
      skipped++;
      continue;
    }
    code = code.trim().toUpperCase();
    const name = cell(row, "ten_sp", "ten sp", "tên sp", "tên sản phẩm", "name", "ten") || code;
    const unit = cell(row, "dvt", "đvt", "don vi", "unit") || "Cái";
    const stockQty = parseNumber(cell(row, "sl_ton", "sl ton", "tồn", "ton", "quantity", "stockQty"));
    const keepStock = parseBool(cell(row, "vt_ton_kho", "theo doi ton", "theo dõi tồn", "keepStock"), true);
    const status = cell(row, "status", "trang_thai", "hiệu lực") || "1";

    const found = await repo.findOne({ where: { code } });
    if (found) {
      found.name = name;
      found.unit = unit;
      found.stockQty = stockQty;
      found.keepStock = keepStock;
      found.status = status.slice(0, 1) || "1";
      await repo.save(found);
      updated++;
    } else {
      await repo.save(
        repo.create({
          code,
          searchCode: code,
          name,
          unit,
          stockQty,
          keepStock,
          status: status.slice(0, 1) || "1",
          multiUnit: false,
          trackShelf: false,
          trackLot: false,
          costMethod: 1,
          editStockAccount: 0,
          taxRate: 0,
          minQty: 0,
          maxQty: 0,
          vatRate: 0,
          envTax: 0,
        })
      );
      inserted++;
    }
  }

  return { inserted, updated, skipped };
}

async function importLabors(rows: Record<string, string>[]) {
  const repo = AppDataSource.getRepository(LaborCost);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    let code = cell(row, "ma_tcong", "ma tien cong", "mã tiền công", "code", "ma");
    if (!code) {
      skipped++;
      continue;
    }
    code = code.trim().toUpperCase();
    const name = cell(row, "ten_tcong", "ten tien cong", "tên tiền công", "name", "ten") || code;
    const amount = parseNumber(cell(row, "don_gia", "don gia", "đơn giá", "amount", "so_tien"));
    const note = cell(row, "note", "ghi_chu", "ghi chú");

    const found = await repo.findOne({ where: { code } });
    if (found) {
      found.name = name;
      found.amount = amount;
      if (note) found.note = note;
      await repo.save(found);
      updated++;
    } else {
      await repo.save(repo.create({ code, name, amount, note: note || undefined }));
      inserted++;
    }
  }

  return { inserted, updated, skipped };
}

async function importCustomers(rows: Record<string, string>[]) {
  const repo = AppDataSource.getRepository(Customer);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    let code = cell(row, "ma_kh", "ma kh", "mã kh", "mã khách", "code", "ma");
    if (!code) {
      skipped++;
      continue;
    }
    code = code.trim().toUpperCase();
    const name = cell(row, "ten_kh", "ten kh", "tên khách", "name", "ten") || code;
    const phone = cell(row, "dien_thoai", "sdt", "phone", "điện thoại");
    const address = cell(row, "dia_chi", "dia chi", "địa chỉ", "address");
    const email = cell(row, "email");
    const taxCode = cell(row, "mst", "taxCode", "ma_so_thue");
    const groupRaw = cell(row, "nhom_kh", "customerGroup", "nhom").toLowerCase();
    const customerGroup = groupRaw === "retail" || groupRaw === "le" || groupRaw === "lẻ" ? "retail" : "dealer";

    const found = await repo.findOne({ where: { code } });
    if (found) {
      found.name = name;
      if (phone) found.phone = phone;
      if (address) found.address = address;
      if (email) found.email = email;
      if (taxCode) found.taxCode = taxCode;
      found.customerGroup = customerGroup;
      await repo.save(found);
      updated++;
    } else {
      await repo.save(
        repo.create({
          code,
          name,
          phone: phone || undefined,
          address: address || undefined,
          email: email || undefined,
          taxCode: taxCode || undefined,
          customerGroup,
        })
      );
      inserted++;
    }
  }

  return { inserted, updated, skipped };
}
