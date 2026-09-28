import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Serial } from "../entities/Serial";
import { SerialLog } from "../entities/SerialLog";
import { StockOut } from "../entities/StockOut";
import { User } from "../entities/User";
import { AuthRequest } from "../middlewares/auth.middleware";
import { addNotification } from "../services/notification.service";
import { ensureSerialSchema } from "../config/ensureSerialSchema";
import {
  addWarrantyEnd,
  monthKey,
  serialTimePrefix,
  threeCode,
  toYmd,
  vietnamNow,
  warrantyNote,
} from "../utils/serialCode";

const LOCK_KEY = "create-serial";
const STALE_SECONDS = 60;
const SERIAL_KINDS = ["sale", "warranty_parts"];

type LockRow = { userId?: string; username?: string; heartbeatAt?: Date };

async function loadActor(req: AuthRequest) {
  if (!req.user?.id) return null;
  return AppDataSource.getRepository(User).findOneBy({ id: req.user.id });
}

export function canUseSerial(user?: User | null) {
  return Boolean(user && (user.canCreateSerial || user.role === "admin"));
}

async function requireActor(req: AuthRequest, res: Response) {
  await ensureSerialSchema();
  const user = await loadActor(req);
  if (!user) {
    res.status(401).json({ message: "Chưa đăng nhập" });
    return null;
  }
  if (!canUseSerial(user)) {
    res.status(403).json({ message: "Bạn không được phân quyền tạo số Serial" });
    return null;
  }
  return user;
}

async function readLock(): Promise<LockRow | undefined> {
  const rows = (await AppDataSource.query(
    `SELECT userId, username, heartbeatAt FROM dbo.serial_feature_lock WHERE lockKey = @0`,
    [LOCK_KEY]
  )) as LockRow[];
  return rows[0];
}

function sameUser(lock: LockRow | undefined, userId: string) {
  return String(lock?.userId || "").toLowerCase() === userId.toLowerCase();
}

async function acquireLock(user: User) {
  await AppDataSource.query(
    `
    UPDATE dbo.serial_feature_lock
    SET userId = @0, username = @1, heartbeatAt = GETDATE()
    WHERE lockKey = @2
      AND (
        userId IS NULL
        OR userId = @0
        OR heartbeatAt IS NULL
        OR DATEDIFF(SECOND, heartbeatAt, GETDATE()) > @3
      )
    `,
    [user.id, user.username, LOCK_KEY, STALE_SECONDS]
  );
  return readLock();
}

async function assertLock(req: AuthRequest, res: Response, user: User) {
  const lock = await readLock();
  if (!sameUser(lock, user.id)) {
    res.status(409).json({
      message: lock?.username
        ? `Người dùng ${lock.username} đang sử dụng tính năng tạo số Serial. Vui lòng thử lại sau.`
        : "Tính năng tạo số Serial đang bị khóa. Vui lòng thử lại sau.",
      lock,
    });
    return null;
  }
  await AppDataSource.query(
    `UPDATE dbo.serial_feature_lock SET heartbeatAt = GETDATE() WHERE lockKey = @0 AND userId = @1`,
    [LOCK_KEY, user.id]
  );
  return lock;
}

function mapVoucher(item: StockOut) {
  return {
    ...item,
    kindLabel: item.kind === "warranty_parts" ? "Bán phụ tùng bảo hành" : "Xuất bán",
    customerGroupLabel: item.customerGroup === "retail" ? "Khách lẻ" : "Đại lý",
    serialState: item.serialLocked ? "locked" : item.serialCreated ? "created" : "pending",
  };
}

export const serialHandlers = {
  lockStatus: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await readLock();
      res.json({
        locked: Boolean(lock?.userId) && !sameUser(lock, user.id),
        mine: sameUser(lock, user.id),
        username: lock?.username || "",
        heartbeatAt: lock?.heartbeatAt || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không kiểm tra được trạng thái khóa Serial" });
    }
  },

  acquire: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await acquireLock(user);
      if (!sameUser(lock, user.id)) {
        return res.status(409).json({
          message: `Người dùng ${lock?.username || ""} đang sử dụng tính năng tạo số Serial. Vui lòng thử lại sau.`,
          username: lock?.username || "",
        });
      }
      res.json({ ok: true, username: user.username });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không chiếm được tính năng tạo số Serial" });
    }
  },

  heartbeat: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await assertLock(req, res, user);
      if (!lock) return;
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không giữ được khóa Serial" });
    }
  },

  release: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.id) return res.json({ ok: true });
      await AppDataSource.query(
        `UPDATE dbo.serial_feature_lock SET userId = NULL, username = NULL, heartbeatAt = NULL WHERE lockKey = @0 AND userId = @1`,
        [LOCK_KEY, req.user.id]
      );
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không nhả được khóa Serial" });
    }
  },

  eligibleVouchers: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await assertLock(req, res, user);
      if (!lock) return;
      const items = await AppDataSource.getRepository(StockOut).find({
        order: { date: "DESC", createdAt: "DESC" },
      });
      res.json(
        items
          .filter((item) => SERIAL_KINDS.includes(item.kind || "sale") && !item.serialLocked)
          .map(mapVoucher)
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không tải được phiếu xuất chưa tạo Serial" });
    }
  },

  voucherDetail: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await assertLock(req, res, user);
      if (!lock) return;
      const voucher = await AppDataSource.getRepository(StockOut).findOne({
        where: { id: String(req.params.id) },
        relations: { lines: { product: true } },
      });
      if (!voucher) return res.status(404).json({ message: "Không tìm thấy phiếu xuất kho" });
      const serials = await AppDataSource.getRepository(Serial).find({
        where: { stockOutId: voucher.id },
        order: { serialNo: "ASC" },
      });
      res.json({ voucher: mapVoucher(voucher), serials });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không tải được phiếu xuất kho" });
    }
  },

  create: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await assertLock(req, res, user);
      if (!lock) return;

      const stockOutId = String(req.body.stockOutId || req.params.id || "");
      const voucherRepo = AppDataSource.getRepository(StockOut);
      const voucher = await voucherRepo.findOne({
        where: { id: stockOutId },
        relations: { lines: { product: true } },
      });
      if (!voucher) return res.status(404).json({ message: "Không tìm thấy phiếu xuất kho" });
      if (voucher.serialLocked) return res.status(400).json({ message: "Phiếu đã hoàn tất, không tạo thêm Serial" });
      if (voucher.serialCreated) return res.status(400).json({ message: "Phiếu này đã tạo Serial" });
      if (!SERIAL_KINDS.includes(voucher.kind || "sale")) {
        return res.status(400).json({ message: "Chỉ tạo Serial cho phiếu xuất bán hoặc bán phụ tùng bảo hành" });
      }
      if (!voucher.customerCode?.trim()) {
        return res.status(400).json({ message: "Phiếu xuất chưa có mã khách hàng (3 ký tự dùng cho Serial)" });
      }
      const lines = (voucher.lines || []).filter((line) => Number(line.quantity) > 0);
      if (!lines.length) return res.status(400).json({ message: "Phiếu xuất không có dòng sản phẩm" });

      const totalQty = lines.reduce((sum, line) => sum + Math.floor(Number(line.quantity) || 0), 0);
      if (totalQty < 1) return res.status(400).json({ message: "Số lượng sản phẩm phải là số nguyên >= 1" });

      for (const line of lines) {
        if (!String(line.product?.groupCode || "").trim()) {
          return res.status(400).json({
            message: `Sản phẩm ${line.product?.code || line.materialName} chưa có mã nhóm sản phẩm (3 ký tự đầu dùng cho Serial)`,
          });
        }
      }

      const now = vietnamNow();
      const prefix = serialTimePrefix(now);
      const ym = monthKey(now);
      const customerPart = threeCode(voucher.customerCode);
      const warrantyFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const warrantyTo = addWarrantyEnd(warrantyFrom, voucher.customerGroup || "dealer");
      const noteBh = warrantyNote(voucher.customerGroup || "dealer");
      const createdAt = now;
      const username = user.username;

      const saved = await AppDataSource.transaction(async (manager) => {
        const seqRows = (await manager.query(
          `SELECT lastNo FROM dbo.serial_month_seq WITH (UPDLOCK, HOLDLOCK) WHERE ym = @0`,
          [ym]
        )) as { lastNo: number }[];
        let lastNo = Number(seqRows[0]?.lastNo || 0);
        if (!seqRows.length) {
          await manager.query(`INSERT INTO dbo.serial_month_seq (ym, lastNo) VALUES (@0, 0)`, [ym]);
        }

        const serialRepo = manager.getRepository(Serial);
        const logRepo = manager.getRepository(SerialLog);
        const created: Serial[] = [];

        for (const line of lines) {
          const qty = Math.floor(Number(line.quantity) || 0);
          const groupPart = threeCode(line.product?.groupCode || "");
          for (let i = 0; i < qty; i += 1) {
            lastNo += 1;
            const serialNo = `${prefix}-${customerPart}-${groupPart}${String(lastNo).padStart(4, "0")}`;
            const row = await serialRepo.save(
              serialRepo.create({
                serialNo,
                customerCode: voucher.customerCode,
                customerName: voucher.customerName,
                orderNumber: voucher.orderNumber,
                stockOutDate: String(voucher.date).slice(0, 10),
                stockOutNumber: voucher.number,
                stockOutId: voucher.id,
                stockOutLineId: line.id,
                productCode: line.product?.code || "",
                productName: line.product?.name || line.materialName || "",
                unit: line.unit || line.product?.unit || "",
                productGroup: line.product?.groupCode || groupPart,
                warehouseCode: line.warehouseCode,
                lotCode: line.lotCode,
                batchNo: line.batchNo,
                status: "Mới tạo",
                situation: "Mới tạo",
                note: noteBh,
                warrantyFrom: toYmd(warrantyFrom),
                warrantyTo: toYmd(warrantyTo),
                warrantyNote: noteBh,
                createdBy: username,
              })
            );
            await logRepo.save(
              logRepo.create({
                serial: row,
                serialNo,
                situation: "Mới tạo",
                note: "Tạo số Serial từ phiếu xuất kho",
                changedAt: createdAt,
                changedBy: username,
              })
            );
            created.push(row);
          }
        }

        await manager.query(`UPDATE dbo.serial_month_seq SET lastNo = @0 WHERE ym = @1`, [lastNo, ym]);
        voucher.serialCreated = true;
        await manager.getRepository(StockOut).save(voucher);
        return created;
      });

      await addNotification("serial", `${username} tạo ${saved.length} số Serial cho phiếu ${voucher.number}`, username);
      res.status(201).json({
        voucher: mapVoucher(await voucherRepo.findOneBy({ id: voucher.id }) as StockOut),
        serials: saved,
      });
    } catch (error) {
      console.error(error);
      const message = (error as Error).message || "";
      if (/UNIQUE|duplicate|so_serial/i.test(message)) {
        return res.status(400).json({ message: "Số Serial bị trùng. Thử tạo lại." });
      }
      res.status(500).json({ message: "Không tạo được số Serial" });
    }
  },

  complete: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const lock = await assertLock(req, res, user);
      if (!lock) return;

      const stockOutId = String(req.body.stockOutId || req.params.id || "");
      const voucherRepo = AppDataSource.getRepository(StockOut);
      const voucher = await voucherRepo.findOne({ where: { id: stockOutId } });
      if (!voucher) return res.status(404).json({ message: "Không tìm thấy phiếu xuất kho" });
      if (!voucher.serialCreated) return res.status(400).json({ message: "Chưa tạo số Serial cho phiếu này" });
      if (voucher.serialLocked) return res.status(400).json({ message: "Phiếu đã hoàn tất" });

      const now = vietnamNow();
      await AppDataSource.transaction(async (manager) => {
        voucher.serialLocked = true;
        voucher.status = "locked";
        await manager.getRepository(StockOut).save(voucher);
        const serials = await manager.getRepository(Serial).find({ where: { stockOutId: voucher.id } });
        for (const row of serials) {
          row.status = "Đã hoàn tất";
          row.situation = "Đã hoàn tất";
          row.changedAt = now;
          row.changedBy = user.username;
          await manager.getRepository(Serial).save(row);
          await manager.getRepository(SerialLog).save(
            manager.getRepository(SerialLog).create({
              serial: row,
              serialNo: row.serialNo,
              situation: "Đã hoàn tất",
              note: "Hoàn tất phiếu tạo Serial, khóa phiếu xuất kho",
              changedAt: now,
              changedBy: user.username,
            })
          );
        }
      });

      await addNotification("serial", `${user.username} hoàn tất Serial phiếu ${voucher.number}`, user.username);
      const serials = await AppDataSource.getRepository(Serial).find({
        where: { stockOutId: voucher.id },
        order: { serialNo: "ASC" },
      });
      res.json({
        voucher: mapVoucher(await voucherRepo.findOneBy({ id: voucher.id }) as StockOut),
        serials,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không hoàn tất được phiếu Serial" });
    }
  },

  list: async (req: AuthRequest, res: Response) => {
    try {
      const user = await requireActor(req, res);
      if (!user) return;
      const q = String(req.query.q || "").trim().toLowerCase();
      const items = await AppDataSource.getRepository(Serial).find({
        order: { createdAt: "DESC" },
        take: 200,
      });
      res.json(
        q
          ? items.filter((row) =>
              [row.serialNo, row.customerCode, row.customerName, row.stockOutNumber, row.productCode]
                .join(" ")
                .toLowerCase()
                .includes(q)
            )
          : items
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Không tải được danh mục Serial" });
    }
  },
};
