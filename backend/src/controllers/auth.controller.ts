import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.middleware";
import { addNotification } from "../services/notification.service";
import { ensureSerialSchema } from "../config/ensureSerialSchema";

const ROLES = ["admin", "warehouse", "warranty", "sales", "user"] as const;
const STATUSES = ["active", "blocked", "suspended"] as const;

export const publicUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status || "active",
  phone: user.phone || "",
  address: user.address || "",
  cccd: user.cccd || "",
  avatar: user.avatar || "",
  canCreateSerial: Boolean(user.canCreateSerial),
  createdAt: user.createdAt,
});

const signToken = (user: User) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "8h" });

const statusMessage: Record<string, string> = {
  blocked: "Tài khoản đã bị chặn. Liên hệ quản trị viên.",
  suspended: "Tài khoản đang tạm ngừng hoạt động.",
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu" });
  }

  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ message: "Đang kết nối SQL Server, thử lại sau vài giây." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ message: "Thiếu JWT_SECRET trên máy chủ." });
    }
    const userRepository = AppDataSource.getRepository(User);
    const existing = await userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existing) {
      return res.status(400).json({ message: "Email hoặc tên đăng nhập đã tồn tại" });
    }

    const userCount = await userRepository.count();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: userCount === 0 ? "admin" : "user",
      status: "active",
      canCreateSerial: userCount === 0,
    });

    await userRepository.save(user);
    await addNotification("register", `${username} đã đăng ký tài khoản mới`, username);
    const token = signToken(user);

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ message: "Đang kết nối SQL Server, thử lại sau vài giây." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ message: "Thiếu JWT_SECRET trên máy chủ." });
    }
    await ensureSerialSchema();
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: [{ email }, { username: email }],
    });

    if (!user) {
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    if (user.status && user.status !== "active") {
      return res.status(403).json({ message: statusMessage[user.status] || "Tài khoản không thể đăng nhập" });
    }

    const token = signToken(user);
    await addNotification("login", `${user.username} đã đăng nhập`, user.username);
    res.json({ message: "Đăng nhập thành công", token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ message: "Đang kết nối SQL Server, thử lại sau vài giây." });
    }
    await ensureSerialSchema();
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: req.user?.id });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.status && user.status !== "active") {
      return res.status(403).json({ message: statusMessage[user.status] || "Tài khoản không hoạt động" });
    }

    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { username, email, phone, address, cccd, currentPassword, newPassword } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: req.user?.id });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (cccd !== undefined) user.cccd = cccd;

    const file = (req as AuthRequest & { file?: { filename: string } }).file;
    if (file) {
      user.avatar = `/uploads/avatars/${file.filename}`;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Nhập mật khẩu hiện tại để đổi mật khẩu" });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await userRepository.save(user);
    await addNotification("profile", `${user.username} đã cập nhật hồ sơ`, user.username);
    res.json({ message: "Cập nhật hồ sơ thành công", user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const listUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await AppDataSource.getRepository(User).find({
      order: { createdAt: "DESC" },
    });
    res.json(users.map(publicUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  const id = String(req.params.id);

  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });
    const actor = await userRepository.findOneBy({ id: req.user?.id });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.id === req.user?.id && role !== "admin") {
      return res.status(400).json({ message: "Không thể tự bỏ quyền admin của chính mình" });
    }

    user.role = role;
    if (role === "admin" || role === "warehouse") user.canCreateSerial = true;
    await userRepository.save(user);
    await addNotification("role", `${actor?.username || "Admin"} đổi quyền của ${user.username} thành ${role}`, actor?.username);
    res.json({ message: "Cập nhật quyền thành công", user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const id = String(req.params.id);

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });
    const actor = await userRepository.findOneBy({ id: req.user?.id });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (user.id === req.user?.id) {
      return res.status(400).json({ message: "Không thể tự khóa tài khoản của mình" });
    }

    user.status = status;
    await userRepository.save(user);

    const label = status === "active" ? "mở lại" : status === "blocked" ? "chặn" : "tạm ngừng";
    await addNotification("status", `${actor?.username || "Admin"} đã ${label} tài khoản ${user.username}`, actor?.username);
    res.json({ message: "Cập nhật trạng thái thành công", user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const updateUserSerialAccess = async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const enabled = req.body.canCreateSerial === true || req.body.canCreateSerial === "true" || req.body.canCreateSerial === 1;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });
    const actor = await userRepository.findOneBy({ id: req.user?.id });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    user.canCreateSerial = enabled;
    await userRepository.save(user);
    await addNotification(
      "role",
      `${actor?.username || "Admin"} ${enabled ? "cấp" : "tắt"} quyền tạo Serial cho ${user.username}`,
      actor?.username
    );
    res.json({ message: enabled ? "Đã cấp quyền tạo số Serial" : "Đã tắt quyền tạo số Serial", user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });
    const actor = await userRepository.findOneBy({ id: req.user?.id });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (user.id === req.user?.id) {
      return res.status(400).json({ message: "Không thể tự xóa tài khoản của mình" });
    }

    const username = user.username;
    await userRepository.remove(user);
    await addNotification("delete", `${actor?.username || "Admin"} đã xóa tài khoản ${username}`, actor?.username);
    res.json({ message: "Đã xóa người dùng" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
