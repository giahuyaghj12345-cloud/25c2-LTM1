import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve(__dirname, "../../uploads/avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Chỉ cho phép tải lên ảnh"));
      return;
    }
    cb(null, true);
  },
});

const importMemory = multer.memoryStorage();

export const uploadImportExcel = multer({
  storage: importMemory,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok =
      name.endsWith(".xlsx") ||
      name.endsWith(".xlsm") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv") ||
      file.mimetype.includes("sheet") ||
      file.mimetype.includes("excel") ||
      file.mimetype.includes("csv") ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "text/csv" ||
      file.mimetype === "application/octet-stream";
    if (!ok) {
      cb(new Error("Chỉ nhận file Excel/CSV (.xlsx, .xls, .csv)"));
      return;
    }
    cb(null, true);
  },
});
