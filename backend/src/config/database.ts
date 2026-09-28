import dotenv from "dotenv";
import path from "path";
import { execSync } from "child_process";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { LaborCost } from "../entities/LaborCost";
import { Customer } from "../entities/Customer";
import { StockOut } from "../entities/StockOut";
import { StockOutLine } from "../entities/StockOutLine";
import { Product } from "../entities/Product";
import { ProductPrice } from "../entities/ProductPrice";
import { Serial } from "../entities/Serial";
import { SerialLog } from "../entities/SerialLog";

function readInstancePort(instanceName: string): number | undefined {
  try {
    const names = execSync(
      `reg query "HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL" /v ${instanceName}`,
      { encoding: "utf8" }
    );
    const instanceId = names.split(/\s+/).find((part) => /^MSSQL\d+\./i.test(part));
    if (!instanceId) return;
    const ipAll = execSync(
      `reg query "HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\${instanceId}\\MSSQLServer\\SuperSocketNetLib\\Tcp\\IPAll"`,
      { encoding: "utf8" }
    );
    const staticPort = ipAll.match(/TcpPort\s+REG_SZ\s+(\d+)/);
    if (staticPort?.[1]) return Number(staticPort[1]);
    const dynamicPort = ipAll.match(/TcpDynamicPorts\s+REG_SZ\s+(\d+)/);
    if (dynamicPort?.[1]) return Number(dynamicPort[1]);
  } catch (error) {
    console.error("Khong doc duoc cong SQL:", (error as Error).message);
  }
}

const instanceName = process.env.DB_INSTANCE || "SQLEXPRESS03";
const host = "127.0.0.1";
let currentPort = Number(process.env.DB_PORT) || readInstancePort(instanceName);

if (!process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
  console.error("Thieu cau hinh .env. Can DB_USERNAME, DB_PASSWORD, DB_DATABASE.");
}

if (!currentPort) {
  console.error(`Khong tim thay cong TCP cua ${instanceName}. Bat SQL Browser hoac set DB_PORT trong .env`);
}

export function applySqlTarget() {
  const nextPort = Number(process.env.DB_PORT) || readInstancePort(instanceName);
  if (nextPort) {
    currentPort = nextPort;
    AppDataSource.setOptions({ host, port: nextPort });
  }
  console.log("SQL target:", {
    host,
    port: currentPort,
    instance: instanceName,
    database: process.env.DB_DATABASE,
  });
}

export const AppDataSource = new DataSource({
  type: "mssql",
  host,
  port: currentPort || 1433,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionTimeout: 8000,
  requestTimeout: 30000,
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 8000,
    cancelTimeout: 10000,
    enableArithAbort: true,
  },
  synchronize: false,
  logging: false,
  entities: [User, Notification, Product, ProductPrice, LaborCost, Customer, StockOut, StockOutLine, Serial, SerialLog],
  migrations: [],
  subscribers: [],
});
