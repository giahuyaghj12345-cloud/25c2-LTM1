const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = process.env.DESKTOP_PORT || "5055";
const backendDir = path.resolve(__dirname, "../backend");
let backend;
let ownBackend = false;

function waitForServer() {
  const url = `http://127.0.0.1:${PORT}/api/health`;
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on("error", retry);
      req.setTimeout(1500, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - started > 45000) reject(new Error("Backend không lên kịp."));
      else setTimeout(tick, 400);
    };
    tick();
  });
}

function startBackend() {
  const env = { ...process.env, SERVE_WEB: "1", PORT };
  for (const key of Object.keys(env)) {
    if (key.startsWith("ELECTRON_") || key === "NODE_OPTIONS") delete env[key];
  }
  backend = spawn("node", ["-r", "ts-node/register", "src/index.ts"], {
    cwd: backendDir,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  backend.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  backend.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  backend.on("exit", (code) => {
    process.stdout.write(`Backend da thoat, ma ${code}\n`);
  });
}

function serverIsUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function stopBackend() {
  if (!ownBackend || !backend || backend.killed) return;
  if (process.platform === "win32" && backend.pid) {
    spawn("taskkill", ["/pid", String(backend.pid), "/T", "/F"], { windowsHide: true });
  } else {
    backend.kill();
  }
  backend = undefined;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: "Quản lý kho & bảo hành",
    autoHideMenuBar: true,
    backgroundColor: "#0f1720",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(`http://127.0.0.1:${PORT}/`);
}

app.whenReady().then(async () => {
  if (!(await serverIsUp())) {
    ownBackend = true;
    startBackend();
  }
  try {
    await waitForServer();
    createWindow();
  } catch (error) {
    dialog.showErrorBox("Không mở được ứng dụng", error instanceof Error ? error.message : String(error));
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopBackend();
  app.quit();
});

app.on("before-quit", stopBackend);
