import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Notification } from "../entities/Notification";
import { AuthRequest } from "../middlewares/auth.middleware";

export const listNotifications = async (_req: AuthRequest, res: Response) => {
  try {
    const items = await AppDataSource.getRepository(Notification).find({
      order: { createdAt: "DESC" },
      take: 40,
    });
    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Không tải được thông báo" });
  }
};
