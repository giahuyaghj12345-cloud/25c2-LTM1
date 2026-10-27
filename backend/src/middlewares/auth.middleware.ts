import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: "Thiếu JWT_SECRET trong cấu hình máy chủ." });
  }

  let payload: { id?: string; role?: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as { id?: string; role?: string };
  } catch {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }

  if (!payload?.id) {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }

  if (!AppDataSource.isInitialized) {
    req.user = { id: payload.id, role: payload.role || "user" };
    return next();
  }

  try {
    const dbUser = await AppDataSource.getRepository(User).findOneBy({ id: payload.id });
    if (!dbUser) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }
    if (dbUser.status && dbUser.status !== "active") {
      return res.status(403).json({ message: "Tài khoản không thể sử dụng hệ thống" });
    }
    req.user = { id: dbUser.id, role: dbUser.role };
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi xác thực" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
  }
  next();
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role || "";
    if (role === "admin" || roles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: "Bạn không có quyền truy cập chức năng này" });
  };
};
