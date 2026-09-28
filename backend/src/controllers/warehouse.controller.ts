import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Product } from "../entities/Product";
import { ProductPrice } from "../entities/ProductPrice";
import { LaborCost } from "../entities/LaborCost";
import { Customer } from "../entities/Customer";
import { StockOut } from "../entities/StockOut";
import { StockOutLine } from "../entities/StockOutLine";
import { createCatalogHandlers } from "./catalog.controller";
import { addNotification } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ensureSerialSchema } from "../config/ensureSerialSchema";

const PRODUCT_FIELDS = [
  "code",
  "partNo",
  "searchCode",
  "name",
  "name2",
  "unit",
  "multiUnit",
  "trackShelf",
  "keepStock",
  "trackLot",
  "costMethod",
  "editStockAccount",
  "kind",
  "stockAccount",
  "taxRate",
  "revenueAccount",
  "returnAccount",
  "internalRevenueAccount",
  "varianceAccount",
  "cogsAccount",
  "wipAccount",
  "groupCode",
  "groupCode2",
  "groupCode3",
  "minQty",
  "maxQty",
  "industryCode",
  "note",
  "status",
  "vatRate",
  "envTax",
  "discountCode",
  "typeCode",
  "hsCode",
  "manufacturer",
  "brand",
  "family",
  "color",
  "carModel",
  "modelYear",
  "origin",
  "spec",
] as const;

function asBool(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === "1" || value === 1;
}

function pickProduct(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of PRODUCT_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  data.multiUnit = asBool(data.multiUnit);
  data.trackShelf = asBool(data.trackShelf);
  data.keepStock = asBool(data.keepStock, true);
  data.trackLot = asBool(data.trackLot);
  data.minQty = Number(data.minQty) || 0;
  data.maxQty = Number(data.maxQty) || 0;
  data.vatRate = Number(data.vatRate) || 0;
  data.taxRate = Number(data.taxRate) || 0;
  data.envTax = Number(data.envTax) || 0;
  const costMethod = Number(data.costMethod);
  data.costMethod = Number.isFinite(costMethod) ? costMethod : 1;
  data.editStockAccount = Number(data.editStockAccount) || 0;
  data.status = String(data.status ?? "1");
  data.unit = String(data.unit ?? "");
  return data;
}

async function saveProductPrices(product: Product, prices: unknown) {
  const repo = AppDataSource.getRepository(ProductPrice);
  const old = await repo.find({ where: { product: { id: product.id } } });
  if (old.length) await repo.remove(old);
  if (!Array.isArray(prices)) return;
  for (const row of prices) {
    const item = (row || {}) as Record<string, unknown>;
    const effectiveDate = String(item.effectiveDate || item.ngay_hl || "");
    const price = Number(item.price ?? item.gia) || 0;
    const priceVat = Number(item.priceVat ?? item.gia_vat) || 0;
    const customerGroup = String(item.customerGroup ?? item.nh_kh ?? "");
    const customerCode = String(item.customerCode ?? item.ma_kh ?? "");
    if (!effectiveDate && !price && !priceVat && !customerGroup && !customerCode) continue;
    await repo.save(
      repo.create({
        product,
        effectiveDate: effectiveDate || null,
        price,
        priceVat,
        customerGroup,
        customerCode,
      })
    );
  }
}

async function loadProduct(id: string) {
  return AppDataSource.getRepository(Product).findOne({ where: { id }, relations: { prices: true } });
}

let productSchemaReady = false;

async function runSchemaStep(sql: string) {
  try {
    await AppDataSource.query(sql);
  } catch (error) {
    console.error("ensureProductSchema:", (error as Error).message);
  }
}

async function ensureProductSchema() {
  if (productSchemaReady || !AppDataSource.isInitialized) return;

  await runSchemaStep(`
    IF OBJECT_ID('dbo.dmsp_gia', 'U') IS NOT NULL
    AND (
      OBJECT_ID('dbo.dmsp', 'U') IS NULL
      OR (COL_LENGTH('dbo.dmsp', 'ma_sp') IS NULL AND COL_LENGTH('dbo.dmsp', 'code') IS NULL)
      OR EXISTS (
        SELECT 1 FROM sys.columns c
        JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.dmsp') AND c.name = 'id'
          AND t.name IN ('int', 'bigint', 'smallint', 'tinyint')
      )
    )
      DROP TABLE dbo.dmsp_gia
  `);
  await runSchemaStep(`
    IF OBJECT_ID('dbo.dmsp', 'U') IS NOT NULL
    AND COL_LENGTH('dbo.dmsp', 'ma_sp') IS NULL
    AND COL_LENGTH('dbo.dmsp', 'code') IS NULL
      DROP TABLE dbo.dmsp
  `);
  await runSchemaStep(`
    IF OBJECT_ID('dbo.dmsp', 'U') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM sys.columns c
      JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('dbo.dmsp') AND c.name = 'id'
        AND t.name IN ('int', 'bigint', 'smallint', 'tinyint')
    )
      DROP TABLE dbo.dmsp
  `);
  await runSchemaStep(`IF OBJECT_ID('dbo.dmsp_legacy', 'U') IS NOT NULL DROP TABLE dbo.dmsp_legacy`);
  await runSchemaStep(`
    IF OBJECT_ID('dbo.dmsp', 'U') IS NULL
    CREATE TABLE dbo.dmsp (
      id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
      ma_sp NVARCHAR(20) NOT NULL UNIQUE,
      part_no NVARCHAR(20) NULL,
      ten_sp NVARCHAR(255) NOT NULL,
      dvt NVARCHAR(32) NOT NULL DEFAULT N'Cái',
      nh_vt1 NVARCHAR(20) NULL,
      loai_vt NVARCHAR(2) NULL,
      sl_min DECIMAL(15,4) NOT NULL DEFAULT 0,
      sl_max DECIMAL(15,4) NOT NULL DEFAULT 0,
      vt_ton_kho BIT NOT NULL DEFAULT 1,
      thue_gtgt DECIMAL(10,2) NOT NULL DEFAULT 0,
      hang_sx NVARCHAR(255) NULL,
      thuong_hieu NVARCHAR(200) NULL,
      quy_cach_ten NVARCHAR(500) NULL,
      ghi_chu NVARCHAR(1000) NULL,
      status NVARCHAR(1) NOT NULL DEFAULT '1',
      createdAt DATETIME NOT NULL DEFAULT GETDATE(),
      updatedAt DATETIME NOT NULL DEFAULT GETDATE()
    )
  `);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'ma_sp') IS NULL AND COL_LENGTH('dbo.dmsp', 'code') IS NOT NULL EXEC sp_rename 'dbo.dmsp.code', 'ma_sp', 'COLUMN'`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'ten_sp') IS NULL AND COL_LENGTH('dbo.dmsp', 'name') IS NOT NULL EXEC sp_rename 'dbo.dmsp.name', 'ten_sp', 'COLUMN'`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'dvt') IS NULL AND COL_LENGTH('dbo.dmsp', 'unit') IS NOT NULL EXEC sp_rename 'dbo.dmsp.unit', 'dvt', 'COLUMN'`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'ghi_chu') IS NULL AND COL_LENGTH('dbo.dmsp', 'note') IS NOT NULL EXEC sp_rename 'dbo.dmsp.note', 'ghi_chu', 'COLUMN'`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'createdAt') IS NULL ALTER TABLE dbo.dmsp ADD createdAt DATETIME NOT NULL CONSTRAINT DF_dmsp_createdAt DEFAULT GETDATE()`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'updatedAt') IS NULL ALTER TABLE dbo.dmsp ADD updatedAt DATETIME NOT NULL CONSTRAINT DF_dmsp_updatedAt DEFAULT GETDATE()`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'ma_tra_cuu') IS NULL ALTER TABLE dbo.dmsp ADD ma_tra_cuu NVARCHAR(50) NULL`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'ten_sp2') IS NULL ALTER TABLE dbo.dmsp ADD ten_sp2 NVARCHAR(255) NULL`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'nhieu_dvt') IS NULL ALTER TABLE dbo.dmsp ADD nhieu_dvt BIT NOT NULL CONSTRAINT DF_dmsp_nhieu_dvt DEFAULT 0`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'vt_ke') IS NULL ALTER TABLE dbo.dmsp ADD vt_ke BIT NOT NULL CONSTRAINT DF_dmsp_vt_ke DEFAULT 0`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'lot_yn') IS NULL ALTER TABLE dbo.dmsp ADD lot_yn BIT NOT NULL CONSTRAINT DF_dmsp_lot DEFAULT 0`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'gia_ton') IS NULL ALTER TABLE dbo.dmsp ADD gia_ton INT NOT NULL CONSTRAINT DF_dmsp_gia_ton DEFAULT 1`);
  await runSchemaStep(`IF COL_LENGTH('dbo.dmsp', 'sua_tk_vt') IS NULL ALTER TABLE dbo.dmsp ADD sua_tk_vt INT NOT NULL CONSTRAINT DF_dmsp_sua_tk DEFAULT 0`);
  await runSchemaStep(`
    IF OBJECT_ID('dbo.dmsp_gia', 'U') IS NULL
    CREATE TABLE dbo.dmsp_gia (
      id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
      productId UNIQUEIDENTIFIER NOT NULL,
      ngay_hl DATE NULL,
      gia DECIMAL(18,4) NOT NULL DEFAULT 0,
      gia_vat DECIMAL(18,4) NOT NULL DEFAULT 0,
      nh_kh NVARCHAR(20) NULL,
      ma_kh NVARCHAR(50) NULL
    )
  `);

  const check = await AppDataSource.query(`SELECT COL_LENGTH('dbo.dmsp', 'ma_sp') AS n`);
  productSchemaReady = Number(check?.[0]?.n) > 0;
}

async function nextProductCodes() {
  const rows = await AppDataSource.query(`
    SELECT ISNULL(MAX(TRY_CONVERT(int, SUBSTRING(ma_sp, 3, 10))), 0) AS n
    FROM dbo.dmsp
    WHERE ma_sp LIKE 'SP%' AND LEN(ma_sp) >= 3
  `);
  const n = Number(rows[0]?.n || 0) + 1;
  const seq = String(n).padStart(6, "0");
  return { code: `SP${seq}`, searchCode: `TC${seq}` };
}

export const productHandlers = {
  list: async (_req: AuthRequest, res: Response) => {
    try {
      if (!AppDataSource.isInitialized) {
        return res.status(503).json({ message: "Đang kết nối SQL Server, thử lại sau vài giây." });
      }
      await ensureProductSchema();
      const repo = AppDataSource.getRepository(Product);
      try {
        const items = await repo.find({ order: { code: "ASC" } });
        return res.json(items);
      } catch (first) {
        console.error(first);
        productSchemaReady = false;
        await ensureProductSchema();
        const items = await repo.find({ order: { code: "ASC" } });
        return res.json(items);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không tải được danh mục sản phẩm" });
    }
  },
  create: async (req: AuthRequest, res: Response) => {
    try {
      await ensureProductSchema();
      const repo = AppDataSource.getRepository(Product);
      const data = pickProduct(req.body);
      const name = String(data.name || "").trim();
      if (!name) return res.status(400).json({ message: "Nhập tên sản phẩm" });
      const { code, searchCode } = await nextProductCodes();
      const item = await repo.save(repo.create({ ...data, name, code, searchCode }));
      await saveProductPrices(item, req.body.prices);
      await addNotification("catalog", `Thêm danh mục sản phẩm: ${item.name}`, req.user?.id);
      res.status(201).json(await loadProduct(item.id));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không thêm được danh mục sản phẩm" });
    }
  },
  update: async (req: AuthRequest, res: Response) => {
    try {
      await ensureProductSchema();
      const repo = AppDataSource.getRepository(Product);
      const item = await repo.findOneBy({ id: String(req.params.id) });
      if (!item) return res.status(404).json({ message: "Không tìm thấy" });
      const data = pickProduct(req.body);
      delete data.code;
      delete data.searchCode;
      repo.merge(item, data);
      await repo.save(item);
      await saveProductPrices(item, req.body.prices);
      await addNotification("catalog", `Cập nhật danh mục sản phẩm: ${item.name}`, req.user?.id);
      res.json(await loadProduct(item.id));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không cập nhật được danh mục sản phẩm" });
    }
  },
  remove: async (req: AuthRequest, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Product);
      const item = await repo.findOneBy({ id: String(req.params.id) });
      if (!item) return res.status(404).json({ message: "Không tìm thấy" });
      await repo.remove(item);
      await addNotification("catalog", `Xóa danh mục sản phẩm: ${item.name}`, req.user?.id);
      res.json({ message: "Đã xóa" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không xóa được danh mục sản phẩm" });
    }
  },
};

export const laborHandlers = createCatalogHandlers<LaborCost>({
  repo: () => AppDataSource.getRepository(LaborCost),
  label: "danh mục tiền công",
  uniqueField: "code",
});

export const customerHandlers = createCatalogHandlers<Customer>({
  repo: () => AppDataSource.getRepository(Customer),
  label: "danh mục khách hàng",
  uniqueField: "code",
});

async function nextStockOutNumber() {
  const repo = AppDataSource.getRepository(StockOut);
  const count = await repo.count();
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `PX${stamp}-${String(count + 1).padStart(3, "0")}`;
}

export const listInventory = async (_req: AuthRequest, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ message: "Đang kết nối SQL Server, thử lại sau vài giây." });
    }
    await ensureProductSchema();
    const items = await AppDataSource.getRepository(Product).find({
      where: { keepStock: true },
      order: { code: "ASC" },
    });
    res.json(
      items.map((item) => ({
        ...item,
        quantity: 0,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không tải được tồn kho sản phẩm" });
  }
};

export const listStockOuts = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureSerialSchema();
    const items = await AppDataSource.getRepository(StockOut).find({ order: { createdAt: "DESC" } });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không tải được phiếu xuất kho" });
  }
};

export const getStockOut = async (req: AuthRequest, res: Response) => {
  try {
    const item = await AppDataSource.getRepository(StockOut).findOneBy({ id: String(req.params.id) });
    if (!item) return res.status(404).json({ message: "Không tìm thấy phiếu" });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không tải được phiếu xuất kho" });
  }
};

export const saveStockOut = async (req: AuthRequest, res: Response) => {
  try {
    await ensureSerialSchema();
    const repo = AppDataSource.getRepository(StockOut);
    const lineRepo = AppDataSource.getRepository(StockOutLine);
    const productRepo = AppDataSource.getRepository(Product);
    const id = req.params.id ? String(req.params.id) : "";
    let voucher = id ? await repo.findOneBy({ id }) : repo.create({ number: await nextStockOutNumber(), status: "draft", kind: "sale" });
    if (!voucher) return res.status(404).json({ message: "Không tìm thấy phiếu" });
    if (voucher.serialLocked || voucher.serialCreated) {
      return res.status(400).json({ message: "Phiếu đã tạo Serial hoặc đã khóa, không được sửa / xóa" });
    }

    voucher.date = req.body.date || voucher.date || new Date().toISOString().slice(0, 10);
    voucher.receiver = req.body.receiver || "";
    voucher.reason = req.body.reason || "";
    voucher.kind = req.body.kind === "warranty_parts" ? "warranty_parts" : "sale";
    voucher.customerCode = req.body.customerCode || "";
    voucher.customerName = req.body.customerName || "";
    voucher.customerAddress = req.body.customerAddress || "";
    voucher.customerPhone = req.body.customerPhone || "";
    voucher.customerEmail = req.body.customerEmail || "";
    voucher.customerGroup = req.body.customerGroup === "retail" ? "retail" : "dealer";
    voucher.orderNumber = req.body.orderNumber || "";
    voucher.orderDate = req.body.orderDate ? String(req.body.orderDate).slice(0, 10) : undefined;
    voucher.postingDate = req.body.postingDate || voucher.date;
    voucher.bookNumber = req.body.bookNumber || "PX001";
    voucher.currency = req.body.currency || "VND";
    voucher.exchangeRate = Number(req.body.exchangeRate) || 1;
    voucher.salesStaff = req.body.salesStaff || "";
    voucher.deliveryStaff = req.body.deliveryStaff || "";
    voucher.deliveryAddress = req.body.deliveryAddress || req.body.customerAddress || "";
    voucher.remark = req.body.remark || "";
    voucher.status = req.body.status || voucher.status || "draft";
    voucher.createdBy = req.user?.id;
    voucher = await repo.save(voucher);

    if (Array.isArray(req.body.lines)) {
      const oldLines = await lineRepo.find({ where: { stockOut: { id: voucher.id } } });
      if (oldLines.length) await lineRepo.remove(oldLines);
      for (const line of req.body.lines) {
        const product = line.materialId ? await productRepo.findOneBy({ id: line.materialId }) : null;
        const row = lineRepo.create({
          stockOut: voucher,
          product: product || undefined,
          materialName: product?.name || line.materialName || "",
          quantity: Number(line.quantity) || 0,
          unit: line.unit || product?.unit || "",
          warehouseCode: line.warehouseCode || "",
          lotCode: line.lotCode || "",
          batchNo: line.batchNo || "",
          shelfCode: line.shelfCode || "",
          hsCode: line.hsCode || product?.hsCode || "",
          note: line.note || "",
        });
        await lineRepo.save(row);
      }
    }

    const saved = await repo.findOneBy({ id: voucher.id });
    await addNotification("stock-out", `Lưu phiếu xuất kho ${saved?.number}`, req.user?.id);
    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không lưu được phiếu xuất kho" });
  }
};

export const deleteStockOut = async (req: AuthRequest, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(StockOut);
    const item = await repo.findOneBy({ id: String(req.params.id) });
    if (!item) return res.status(404).json({ message: "Không tìm thấy phiếu" });
    if (item.serialLocked || item.serialCreated) {
      return res.status(400).json({ message: "Phiếu đã tạo Serial hoặc đã khóa, không được sửa / xóa" });
    }
    await repo.remove(item);
    await addNotification("stock-out", `Xóa phiếu xuất kho ${item.number}`, req.user?.id);
    res.json({ message: "Đã xóa phiếu" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không xóa được phiếu xuất kho" });
  }
};
