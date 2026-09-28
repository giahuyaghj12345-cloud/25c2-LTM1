import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  listUsers,
  updateUserRole,
  updateUserStatus,
  updateUserSerialAccess,
  deleteUser,
} from "../controllers/auth.controller";
import { listNotifications } from "../controllers/notification.controller";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware";
import { uploadAvatar } from "../middlewares/upload.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, uploadAvatar.single("avatar"), updateProfile);
router.get("/users", authenticateToken, requireAdmin, listUsers);
router.patch("/users/:id/role", authenticateToken, requireAdmin, updateUserRole);
router.patch("/users/:id/status", authenticateToken, requireAdmin, updateUserStatus);
router.patch("/users/:id/serial-access", authenticateToken, requireAdmin, updateUserSerialAccess);
router.delete("/users/:id", authenticateToken, requireAdmin, deleteUser);
router.get("/notifications", authenticateToken, listNotifications);

export default router;
