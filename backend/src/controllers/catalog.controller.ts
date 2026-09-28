import { Request, Response } from "express";
import { ObjectLiteral, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { addNotification } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth.middleware";

type CatalogConfig<T extends ObjectLiteral> = {
  repo: () => Repository<T>;
  label: string;
  uniqueField: keyof T;
};

function coerceCatalogBody(body: Record<string, unknown>) {
  if (body.price !== undefined) body.price = Number(body.price);
  if (body.amount !== undefined) body.amount = Number(body.amount);
  if (body.minQty !== undefined) body.minQty = Number(body.minQty) || 0;
  if (body.maxQty !== undefined) body.maxQty = Number(body.maxQty) || 0;
  if (body.weightKg !== undefined) body.weightKg = Number(body.weightKg) || 0;
  if (body.vatRate !== undefined) body.vatRate = Number(body.vatRate) || 0;
  if (body.keepStock !== undefined) {
    body.keepStock = body.keepStock === true || body.keepStock === "true" || body.keepStock === "1";
  }
}

export function createCatalogHandlers<T extends ObjectLiteral>(config: CatalogConfig<T>) {
  const list = async (_req: Request, res: Response) => {
    try {
      const items = await config.repo().find({ order: { createdAt: "DESC" } as any });
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Không tải được ${config.label}` });
    }
  };

  const create = async (req: AuthRequest, res: Response) => {
    try {
      const repo = config.repo();
      coerceCatalogBody(req.body);
      const code = String(req.body.code || "").trim();
      if (!code || !req.body.name) {
        return res.status(400).json({ message: "Nhập mã và tên" });
      }
      const existed = await repo.findOne({ where: { [config.uniqueField]: code } as any });
      if (existed) {
        return res.status(400).json({ message: "Mã đã tồn tại" });
      }
      const item = repo.create(req.body as any);
      await repo.save(item);
      await addNotification("catalog", `Thêm ${config.label}: ${req.body.name}`, req.user?.id);
      res.status(201).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Không thêm được ${config.label}` });
    }
  };

  const update = async (req: AuthRequest, res: Response) => {
    try {
      const repo = config.repo();
      coerceCatalogBody(req.body);
      const item = await repo.findOneBy({ id: req.params.id } as any);
      if (!item) return res.status(404).json({ message: "Không tìm thấy" });
      repo.merge(item, req.body);
      await repo.save(item);
      await addNotification("catalog", `Cập nhật ${config.label}: ${(item as any).name}`, req.user?.id);
      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Không cập nhật được ${config.label}` });
    }
  };

  const remove = async (req: AuthRequest, res: Response) => {
    try {
      const repo = config.repo();
      const item = await repo.findOneBy({ id: req.params.id } as any);
      if (!item) return res.status(404).json({ message: "Không tìm thấy" });
      await repo.remove(item);
      await addNotification("catalog", `Xóa ${config.label}: ${(item as any).name}`, req.user?.id);
      res.json({ message: "Đã xóa" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Không xóa được ${config.label}` });
    }
  };

  return { list, create, update, remove };
}
