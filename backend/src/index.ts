import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import { AppDataSource, applySqlTarget } from "./config/database";
import { ensureSchema } from "./config/ensureSchema";
import { ensureSerialSchema } from "./config/ensureSerialSchema";
import authRoutes from "./routes/auth.routes";
import catalogRoutes from "./routes/catalog.routes";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: AppDataSource.isInitialized });
});
app.get("/", (_req, res, next) => {
  if (process.env.SERVE_WEB === "1") return next();
  res.json({ ok: true, service: "backend", db: AppDataSource.isInitialized });
});

const webDir = path.resolve(__dirname, "../../frontend/dist");
if (process.env.SERVE_WEB === "1") {
  app.use(express.static(webDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(webDir, "index.html"), (error) => {
      if (error) next();
    });
  });
}

const PORT = Number(process.env.PORT) || 5000;
if (!process.env.JWT_SECRET) {
  console.error("Thieu JWT_SECRET trong backend/.env — dang nhap se khong hoat dong.");
}
let connecting = false;

async function connectDb() {
  if (connecting || AppDataSource.isInitialized) return;
  connecting = true;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      applySqlTarget();
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      try {
        await ensureSchema();
        await ensureSerialSchema();
      } catch (error) {
        console.error("ensureSchema failed:", error);
      }
      const dmsp = await AppDataSource.query(`SELECT OBJECT_ID('dbo.dmsp') AS t, COL_LENGTH('dbo.dmsp', 'ma_sp') AS ma_sp`);
      console.log("dmsp check:", dmsp);
      console.log("Database connected!");
      connecting = false;
      return;
    } catch (error) {
      const message = (error as Error).message;
      console.log(`DB attempt ${attempt}/8 failed:`, message);
      if (/password of the account has expired/i.test(message)) {
        console.log("Mat khau SQL cua user trong file backend/.env da het han. Mo SSMS va doi mat khau login do, hoac tat CHECK_EXPIRATION.");
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  connecting = false;
  console.log("Khong ket noi duoc SQL Server. Xem dong loi phia tren: het han mat khau, sai user, hoac instance chua chay.");
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  void connectDb();
});
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.log("Cong 5000 dang bi dung. Dong cua so backend cu (Ctrl+C) roi chi chay MOT npm run dev.");
    process.exit(1);
  }
  throw error;
});
