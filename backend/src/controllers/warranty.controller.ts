import { Response } from "express";
import { AppDataSource } from "../config/database";
import { AuthRequest } from "../middlewares/auth.middleware";

type LineIn = {
  loai?: string;
  ma?: string;
  ten?: string;
  dvt?: string;
  so_luong?: number;
  gia?: number;
  tl_ck?: number;
  thue_suat?: number;
  ghi_chu?: string;
  so_serial?: string;
  ma_km?: string;
  ten_km?: string;
  tk?: string;
  ma_kho?: string;
  tk_no?: string;
};

const POSTED_TICKET = ["ghi_so", "hoan_tat", "dang_sua", "da_giao", "xac_nhan"];

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function text(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function dateOnly(value: unknown) {
  const raw = text(value, 30);
  if (!raw) return null;
  return raw.slice(0, 10);
}

function dateTime(value: unknown) {
  const raw = text(value, 40);
  if (!raw) return null;
  return raw.length === 16 ? `${raw.replace("T", " ")}:00` : raw.replace("T", " ").slice(0, 19);
}

function moneyLine(line: LineIn) {
  const loai = line.loai === "tc" ? "tc" : "pt";
  const soLuong = Math.max(0, num(line.so_luong, 1));
  const gia = Math.max(0, num(line.gia));
  const thanh = Math.round(soLuong * gia * 100) / 100;
  const tlCk = Math.min(100, Math.max(0, num(line.tl_ck)));
  const tienCk = Math.round(thanh * tlCk) / 100;
  const sauCk = thanh - tienCk;
  const thueSuat = Math.max(0, num(line.thue_suat));
  const tienThue = Math.round(sauCk * thueSuat) / 100;
  return {
    loai,
    ma: text(line.ma, 50),
    ten: text(line.ten, 200),
    dvt: text(line.dvt, 20),
    soLuong,
    gia,
    thanh,
    tlCk,
    tienCk,
    thueSuat,
    tienThue,
    ghiChu: text(line.ghi_chu, 200),
    soSerial: text(line.so_serial, 50),
    maKm: text(line.ma_km, 30),
    tenKm: text(line.ten_km, 200),
    tk: text(line.tk, 20),
    maKho: text(line.ma_kho, 20),
    tkNo: text(line.tk_no, 20),
  };
}

function totals(lines: ReturnType<typeof moneyLine>[]) {
  const sum = (loai: string, pick: (line: ReturnType<typeof moneyLine>) => number) =>
    lines.filter((line) => line.loai === loai).reduce((acc, line) => acc + pick(line), 0);
  const tTcong = sum("tc", (line) => line.thanh);
  const tCkTc = sum("tc", (line) => line.tienCk);
  const tPhutung = sum("pt", (line) => line.thanh);
  const tCkPt = sum("pt", (line) => line.tienCk);
  const tThue = lines.reduce((acc, line) => acc + line.tienThue, 0);
  const tTt = tTcong - tCkTc + tPhutung - tCkPt + tThue;
  return { tTcong, tCkTc, tPhutung, tCkPt, tThue, tTt };
}

async function nextSo(prefix: string) {
  const rows = await AppDataSource.query(`EXEC dbo.usp_BhSoCt @0`, [prefix]);
  const so = rows?.[0]?.so_ct;
  if (so) return String(so);
  const ym = new Date().toISOString().slice(2, 7).replace("-", "");
  return `${prefix}${ym}0001`;
}

async function actor(req: AuthRequest) {
  const id = req.user?.id;
  if (!id) return "";
  const rows = await AppDataSource.query(`SELECT TOP 1 username FROM dbo.users WHERE id = @0`, [id]);
  return String(rows?.[0]?.username || "");
}

function fail(res: Response, status: number, message: string) {
  return res.status(status).json({ message });
}

async function linesOf(table: "bh_phieu_ct" | "bh_baogia_ct", key: "phieuId" | "bgId", id: string) {
  return AppDataSource.query(
    `SELECT id, stt, loai, ma, ten, dvt, so_luong, gia, tien, tl_ck, tien_ck, thue_suat, tien_thue, ghi_chu, ma_km, ten_km, tk
     FROM dbo.${table} WHERE ${key} = @0 ORDER BY stt`,
    [id]
  );
}

function mapDocLine(row: Record<string, unknown>) {
  return {
    id: row.id,
    stt: row.stt,
    loai: row.loai,
    ma: row.ma || "",
    ten: row.ten || "",
    dvt: row.dvt || "",
    so_luong: Number(row.so_luong || 0),
    gia: Number(row.gia || 0),
    tien: Number(row.tien || 0),
    tl_ck: Number(row.tl_ck || 0),
    tien_ck: Number(row.tien_ck || 0),
    thue_suat: Number(row.thue_suat || 0),
    tien_thue: Number(row.tien_thue || 0),
    ghi_chu: row.ghi_chu || "",
    ma_km: row.ma_km || "",
    ten_km: row.ten_km || "",
    tk: row.tk || "",
  };
}

async function insertLines(
  manager: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  table: string,
  key: string,
  id: string,
  lines: ReturnType<typeof moneyLine>[]
) {
  await manager.query(`DELETE FROM dbo.${table} WHERE ${key} = @0`, [id]);
  let stt = 1;
  for (const line of lines) {
    if (!line.ma && !line.ten) continue;
    await manager.query(
      `INSERT INTO dbo.${table} (id, ${key}, stt, loai, ma, ten, dvt, so_luong, gia, tien, tl_ck, tien_ck, thue_suat, tien_thue, ghi_chu, ma_km, ten_km, tk)
       VALUES (NEWID(), @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16)`,
      [id, stt, line.loai, line.ma, line.ten, line.dvt, line.soLuong, line.gia, line.thanh, line.tlCk, line.tienCk, line.thueSuat, line.tienThue, line.ghiChu, line.maKm, line.tenKm, line.tk]
    );
    stt += 1;
  }
}

export async function listQuotes(_req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT id, so_ct, ngay_ct, status, ma_kh, ten_kh, so_serial, ten_sp, t_tien, t_tt = t_tien
     FROM dbo.bh_baogia ORDER BY ngay_ct DESC, so_ct DESC`
  );
  res.json(rows);
}

export async function getQuote(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(`SELECT * FROM dbo.bh_baogia WHERE id = @0`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "Không thấy báo giá");
  const lines = (await linesOf("bh_baogia_ct", "bgId", String(req.params.id))).map((line: Record<string, unknown>) => mapDocLine(line));
  res.json({ ...rows[0], lines });
}

export async function saveQuote(req: AuthRequest, res: Response) {
  const body = req.body || {};
  const id = text(body.id, 40) || text(req.params.id, 40) || null;
  if (id) {
    const cur = await AppDataSource.query(`SELECT status FROM dbo.bh_baogia WHERE id = @0`, [id]);
    if (cur[0]?.status === "da_duyet") return fail(res, 400, "Báo giá đã ghi sổ — không sửa.");
  }
  const lines = (Array.isArray(body.lines) ? (body.lines as LineIn[]) : []).map(moneyLine).filter((line) => line.ma || line.ten);
  const sum = totals(lines);
  const docId = id || (await AppDataSource.query(`SELECT NEWID() AS id`))[0].id;
  const soCt = text(body.so_ct, 30) || (await nextSo("BG"));
  const ngay = dateOnly(body.ngay_ct) || new Date().toISOString().slice(0, 10);
  await AppDataSource.transaction(async (manager) => {
    const exists = await manager.query(`SELECT 1 AS n FROM dbo.bh_baogia WHERE id = @0`, [docId]);
    const params = [
      docId, soCt, ngay, text(body.ma_kh, 50), text(body.ten_kh, 200), text(body.so_serial, 50),
      text(body.dien_giai, 300) || "Báo giá bảo hành", sum.tTt, text(body.dia_chi, 300), text(body.dien_thoai, 30),
      text(body.email, 100), text(body.mst, 20), text(body.cccd, 20), text(body.ma_sp, 50), text(body.ten_sp, 200),
      text(body.hang_xe, 80), text(body.ten_xe, 80), text(body.bien_so, 30), text(body.yeu_cau, 500), text(body.tt_sp, 200),
      sum.tTcong, sum.tCkTc, sum.tPhutung, sum.tCkPt, sum.tThue,
      text(body.nam_sx, 10), text(body.odo, 20), text(body.loai_sp, 80), text(body.lo_sx, 50),
      text(body.tg_sd, 64), text(body.nguon_goc, 64), body.lay_pt_cu ? 1 : 0,
      dateTime(body.tg_tiep_nhan), dateTime(body.tg_hoan_tra_dk), body.xuat_hd ? 1 : 0, text(body.tu_van, 500),
    ];
    if (exists.length) {
      await manager.query(
        `UPDATE dbo.bh_baogia SET ngay_ct=@2, ma_kh=@3, ten_kh=@4, so_serial=@5, dien_giai=@6, t_tien=@7,
          dia_chi=@8, dien_thoai=@9, email=@10, mst=@11, cccd=@12, ma_sp=@13, ten_sp=@14, hang_xe=@15, ten_xe=@16,
          bien_so=@17, yeu_cau=@18, tt_sp=@19, t_tcong=@20, t_ck_tc=@21, t_phutung=@22, t_ck_pt=@23, t_thue=@24,
          nam_sx=@25, odo=@26, loai_sp=@27, lo_sx=@28, tg_sd=@29, nguon_goc=@30, lay_pt_cu=@31,
          tg_tiep_nhan=@32, tg_hoan_tra_dk=@33, xuat_hd=@34, tu_van=@35
         WHERE id=@0`,
        params
      );
    } else {
      await manager.query(
        `INSERT INTO dbo.bh_baogia (id, so_ct, ngay_ct, status, ma_kh, ten_kh, so_serial, dien_giai, t_tien,
          dia_chi, dien_thoai, email, mst, cccd, ma_sp, ten_sp, hang_xe, ten_xe, bien_so, yeu_cau, tt_sp,
          t_tcong, t_ck_tc, t_phutung, t_ck_pt, t_thue,
          nam_sx, odo, loai_sp, lo_sx, tg_sd, nguon_goc, lay_pt_cu, tg_tiep_nhan, tg_hoan_tra_dk, xuat_hd, tu_van)
         VALUES (@0,@1,@2,N'nhap',@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19,@20,@21,@22,@23,@24,
          @25,@26,@27,@28,@29,@30,@31,@32,@33,@34,@35)`,
        params
      );
    }
    await insertLines(manager, "bh_baogia_ct", "bgId", docId, lines);
  });
  req.params.id = docId;
  return getQuote(req, res);
}

export async function postQuote(req: AuthRequest, res: Response) {
  const cur = await AppDataSource.query(`SELECT status FROM dbo.bh_baogia WHERE id = @0`, [req.params.id]);
  if (!cur[0]) return fail(res, 404, "Không thấy báo giá");
  if (cur[0].status === "da_duyet") return res.json({ message: "Báo giá đã ghi sổ." });
  const lines = await linesOf("bh_baogia_ct", "bgId", String(req.params.id));
  if (!lines.length) return fail(res, 400, "Báo giá chưa có dòng tiền công hoặc phụ tùng.");
  await AppDataSource.query(`UPDATE dbo.bh_baogia SET status = N'da_duyet' WHERE id = @0`, [req.params.id]);
  return getQuote(req, res);
}

export async function listTickets(_req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT id, so_ct, ngay_ct, status, loai_bh, ma_kh, ten_kh, so_serial, ten_sp, so_bg, hoan_tat, xuat_hd, t_tt
     FROM dbo.bh_phieu ORDER BY ngay_ct DESC, so_ct DESC`
  );
  res.json(rows);
}

export async function getTicket(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(`SELECT * FROM dbo.bh_phieu WHERE id = @0`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "Không thấy phiếu bảo hành");
  const lines = (await linesOf("bh_phieu_ct", "phieuId", String(req.params.id))).map((line: Record<string, unknown>) => mapDocLine(line));
  const marks = await AppDataSource.query(
    `SELECT
       SUM(CASE WHEN ma_gd = 10 AND loai_nx = N'nhap' AND status = N'xac_nhan' THEN 1 ELSE 0 END) AS da_nhap,
       SUM(CASE WHEN ma_gd = 10 AND loai_nx = N'xuat' AND status = N'xac_nhan' THEN 1 ELSE 0 END) AS da_giao
     FROM dbo.bh_kho WHERE phieuId = @0`,
    [req.params.id]
  );
  res.json({
    ...rows[0],
    lines,
    da_nhap: Number(marks[0]?.da_nhap || 0) > 0 ? 1 : 0,
    da_giao: Number(marks[0]?.da_giao || 0) > 0 ? 1 : 0,
  });
}

async function serialInfo(soSerial: string) {
  if (!soSerial) return null;
  const rows = await AppDataSource.query(
    `SELECT TOP 1 so_serial, ma_kh, ten_kh, ma_sp, ten_sp, dvt, so_batch, so_px, so_don_hang, ngay_xuat,
            trang_thai, tinh_trang, ngay_bh_tu, ngay_bh_den, ngay_kh_bh, kh_kich_hoat, email_kh_bh, dt_kh_bh,
            dai_ly_mua, dia_chi_dl, ngay_mua_dl, ghi_chu_kh_bh
     FROM dbo.dm_serial WHERE so_serial = @0`,
    [soSerial]
  );
  return rows[0] || null;
}

export async function lookupSerialForTicket(req: AuthRequest, res: Response) {
  const serial = text(req.query.serial, 50);
  const info = await serialInfo(serial);
  if (!info) return fail(res, 404, "Không thấy serial.");
  if (String(info.trang_thai) === "3" || String(info.tinh_trang).includes("Hủy")) {
    return fail(res, 400, "Serial đã hủy — không dùng cho phiếu dịch vụ.");
  }
  res.json(info);
}

export async function saveTicket(req: AuthRequest, res: Response) {
  const body = req.body || {};
  const id = text(body.id, 40) || text(req.params.id, 40) || null;
  if (id) {
    const cur = await AppDataSource.query(`SELECT status, hoan_tat FROM dbo.bh_phieu WHERE id = @0`, [id]);
    if (!cur[0]) return fail(res, 404, "Không thấy phiếu");
    if (Number(cur[0].hoan_tat) === 1) return fail(res, 400, "Phiếu đã hoàn tất sửa chữa — không sửa được.");
    if (cur[0].status === "huy") return fail(res, 400, "Phiếu đã hủy.");
    if (cur[0].status !== "nhap") return fail(res, 400, "Phiếu đã ghi sổ — chỉ xem.");
  }
  const soSerial = text(body.so_serial, 50);
  const info = await serialInfo(soSerial);
  if (soSerial && info && (String(info.trang_thai) === "3" || String(info.tinh_trang).includes("Hủy"))) {
    return fail(res, 400, "Serial đã hủy — không dùng cho phiếu dịch vụ.");
  }
  const lines = (Array.isArray(body.lines) ? (body.lines as LineIn[]) : []).map(moneyLine).filter((line) => line.ma || line.ten);
  const sum = totals(lines);
  const docId = id || (await AppDataSource.query(`SELECT NEWID() AS id`))[0].id;
  const soCt = text(body.so_ct, 30) || (await nextSo("BH"));
  const ngay = dateOnly(body.ngay_ct) || new Date().toISOString().slice(0, 10);
  const loai = [1, 2, 3].includes(Number(body.loai_bh)) ? Number(body.loai_bh) : 1;
  const user = await actor(req);
  await AppDataSource.transaction(async (manager) => {
    const exists = await manager.query(`SELECT 1 AS n FROM dbo.bh_phieu WHERE id = @0`, [docId]);
    const params = [
      docId, soCt, ngay, text(body.ma_kh, 50), text(body.ten_kh, 200), text(body.dien_thoai, 30), text(body.dia_chi, 300),
      text(body.email, 100), soSerial, text(body.ma_sp, 50), text(body.ten_sp, 200), text(body.hang_xe, 80), text(body.ten_xe, 80),
      text(body.nam_sx, 10), text(body.odo, 20), text(body.bien_so, 30), text(body.yeu_cau, 500), text(body.tu_van, 500),
      text(body.tt_sp, 200), dateOnly(body.ngay_hen), text(body.ghi_chu, 300), user, loai, text(body.mst, 20), text(body.cccd, 20),
      text(body.lo_sx, 50), text(body.tg_sd, 64), text(body.nguon_goc, 64), body.lay_pt_cu ? 1 : 0,
      dateTime(body.tg_tiep_nhan), dateTime(body.tg_hoan_tra_dk), body.xuat_hd ? 1 : 0,
      text(body.hd_ten, 200), text(body.hd_dia_chi, 300), text(body.hd_mst, 20), text(body.hd_cccd, 20), text(body.hd_dt, 30),
      text(body.hd_email, 100), text(body.bg_id, 40) || null, text(body.so_bg, 30),
      sum.tTcong, sum.tCkTc, sum.tPhutung, sum.tCkPt, sum.tThue, sum.tTt,
    ];
    if (exists.length) {
      await manager.query(
        `UPDATE dbo.bh_phieu SET ngay_ct=@2, ma_kh=@3, ten_kh=@4, dien_thoai=@5, dia_chi=@6, email=@7, so_serial=@8,
          ma_sp=@9, ten_sp=@10, hang_xe=@11, ten_xe=@12, nam_sx=@13, odo=@14, bien_so=@15, yeu_cau=@16, tu_van=@17,
          tt_sp=@18, ngay_hen=@19, ghi_chu=@20, loai_bh=@22, mst=@23, cccd=@24, lo_sx=@25, tg_sd=@26, nguon_goc=@27,
          lay_pt_cu=@28, tg_tiep_nhan=@29, tg_hoan_tra_dk=@30, xuat_hd=@31, hd_ten=@32, hd_dia_chi=@33, hd_mst=@34,
          hd_cccd=@35, hd_dt=@36, hd_email=@37, bg_id=@38, so_bg=@39, t_tcong=@40, t_ck_tc=@41, t_phutung=@42,
          t_ck_pt=@43, t_thue=@44, t_tt=@45, updatedAt=GETDATE()
         WHERE id=@0`,
        params
      );
    } else {
      await manager.query(
        `INSERT INTO dbo.bh_phieu (id, so_ct, ngay_ct, status, ma_kh, ten_kh, dien_thoai, dia_chi, email, so_serial,
          ma_sp, ten_sp, hang_xe, ten_xe, nam_sx, odo, bien_so, yeu_cau, tu_van, tt_sp, ngay_hen, ghi_chu, createdBy,
          loai_bh, mst, cccd, lo_sx, tg_sd, nguon_goc, lay_pt_cu, tg_tiep_nhan, tg_hoan_tra_dk, xuat_hd,
          hd_ten, hd_dia_chi, hd_mst, hd_cccd, hd_dt, hd_email, bg_id, so_bg,
          t_tcong, t_ck_tc, t_phutung, t_ck_pt, t_thue, t_tt)
         VALUES (@0,@1,@2,N'nhap',@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15,@16,@17,@18,@19,@20,@21,
          @22,@23,@24,@25,@26,@27,@28,@29,@30,@31,@32,@33,@34,@35,@36,@37,@38,@39,@40,@41,@42,@43,@44,@45)`,
        params
      );
    }
    await insertLines(manager, "bh_phieu_ct", "phieuId", docId, lines);
  });
  req.params.id = docId;
  return getTicket(req, res);
}

export async function postTicket(req: AuthRequest, res: Response) {
  const cur = await AppDataSource.query(`SELECT status, hoan_tat FROM dbo.bh_phieu WHERE id = @0`, [req.params.id]);
  if (!cur[0]) return fail(res, 404, "Không thấy phiếu");
  if (cur[0].status === "huy") return fail(res, 400, "Phiếu đã hủy.");
  if (POSTED_TICKET.includes(String(cur[0].status))) return getTicket(req, res);
  const lines = await linesOf("bh_phieu_ct", "phieuId", String(req.params.id));
  if (!lines.length) return fail(res, 400, "Phiếu chưa có dòng dịch vụ hoặc phụ tùng.");
  await AppDataSource.query(`UPDATE dbo.bh_phieu SET status = N'ghi_so', updatedAt = GETDATE() WHERE id = @0`, [req.params.id]);
  return getTicket(req, res);
}

export async function completeTicket(req: AuthRequest, res: Response) {
  const cur = await AppDataSource.query(`SELECT status FROM dbo.bh_phieu WHERE id = @0`, [req.params.id]);
  if (!cur[0]) return fail(res, 404, "Không thấy phiếu");
  if (!POSTED_TICKET.includes(String(cur[0].status)) && cur[0].status !== "hoan_tat") {
    return fail(res, 400, "Ghi sổ phiếu trước khi hoàn tất sửa chữa.");
  }
  await AppDataSource.query(
    `UPDATE dbo.bh_phieu SET hoan_tat = 1, status = N'hoan_tat', updatedAt = GETDATE() WHERE id = @0`,
    [req.params.id]
  );
  return getTicket(req, res);
}

export async function cancelTicket(req: AuthRequest, res: Response) {
  if (req.user?.role !== "admin") return fail(res, 403, "Chỉ quản trị hủy phiếu.");
  const cur = await AppDataSource.query(`SELECT hoan_tat FROM dbo.bh_phieu WHERE id = @0`, [req.params.id]);
  if (!cur[0]) return fail(res, 404, "Không thấy phiếu");
  if (Number(cur[0].hoan_tat) === 1) return fail(res, 400, "Phiếu đã hoàn tất — không hủy.");
  await AppDataSource.query(`UPDATE dbo.bh_phieu SET status = N'huy', updatedAt = GETDATE() WHERE id = @0`, [req.params.id]);
  return getTicket(req, res);
}

export async function listWarehouse(_req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT k.id, k.so_ct, k.ngay_ct, k.ma_gd, k.loai_nx, k.status, k.so_serial, k.serial_moi, k.dien_giai,
            k.phieuId, p.so_ct AS so_phieu
     FROM dbo.bh_kho k LEFT JOIN dbo.bh_phieu p ON p.id = k.phieuId
     ORDER BY k.ngay_ct DESC, k.so_ct DESC`
  );
  res.json(rows);
}

export async function getWarehouse(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT k.*, p.so_ct AS so_phieu FROM dbo.bh_kho k LEFT JOIN dbo.bh_phieu p ON p.id = k.phieuId WHERE k.id = @0`,
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 404, "Không thấy phiếu kho");
  const lines = await AppDataSource.query(
    `SELECT id, stt, ma_sp AS ma, ten_sp AS ten, dvt, so_luong, gia, tien, so_serial, ma_kho, tk_no FROM dbo.bh_kho_ct WHERE khoId = @0 ORDER BY stt`,
    [req.params.id]
  );
  const stock = await AppDataSource.query(
    `SELECT c.ma_sp,
        SUM(CASE WHEN (k.ma_gd IN (10, 11) AND ISNULL(k.loai_nx, N'nhap') = N'nhap') THEN c.so_luong
                 WHEN k.ma_gd IN (7, 8) OR (k.ma_gd = 10 AND k.loai_nx = N'xuat') THEN -c.so_luong ELSE 0 END) AS ton
     FROM dbo.bh_kho_ct c INNER JOIN dbo.bh_kho k ON k.id = c.khoId
     WHERE k.status = N'xac_nhan'
     GROUP BY c.ma_sp`
  );
  const tonOf = new Map(stock.map((row: { ma_sp: string; ton: number }) => [row.ma_sp, Number(row.ton || 0)]));
  res.json({
    ...rows[0],
    lines: lines.map((line: { ma: string }) => ({ ...line, ton: tonOf.get(line.ma) || 0 })),
  });
}

export async function saveWarehouse(req: AuthRequest, res: Response) {
  const body = req.body || {};
  const phieuId = text(body.phieuId, 40);
  const ticket = await AppDataSource.query(`SELECT * FROM dbo.bh_phieu WHERE id = @0`, [phieuId]);
  if (!ticket[0]) return fail(res, 400, "Chọn phiếu bảo hành đã lập.");
  if (!POSTED_TICKET.includes(String(ticket[0].status))) return fail(res, 400, "Phiếu DV phải ghi sổ trước khi lập phiếu kho.");
  if (Number(ticket[0].hoan_tat) === 1 || ticket[0].status === "hoan_tat") return fail(res, 400, "Phiếu đã hoàn tất — không thao tác kho.");
  const maGd = Number(body.ma_gd);
  if (![7, 8, 10, 11].includes(maGd)) return fail(res, 400, "Mã giao dịch kho BH: 7, 8, 10 hoặc 11.");
  const loai = Number(ticket[0].loai_bh || 1);
  const loai11 = loai === 2 || loai === 3;
  if (maGd === 8 && !loai11) return fail(res, 400, "MGD 8 chỉ dùng cho Sale 1 đổi 1 hoặc DV 1 đổi 1.");
  if (maGd === 11 && !loai11) return fail(res, 400, "Nhập serial cũ chỉ dùng cho phiếu 1 đổi 1.");
  const loaiNx = maGd === 10 ? (text(body.loai_nx, 10) === "nhap" ? "nhap" : "xuat") : maGd === 11 ? "nhap" : "xuat";
  if (maGd === 10 && loaiNx === "xuat" && loai11) return fail(res, 400, "Phiếu 1 đổi 1 không xuất giao khách.");
  if (maGd === 10 && loaiNx === "xuat") {
    const nhap = await AppDataSource.query(
      `SELECT 1 AS n FROM dbo.bh_kho WHERE phieuId = @0 AND ma_gd = 10 AND loai_nx = N'nhap' AND status = N'xac_nhan'`,
      [phieuId]
    );
    if (!nhap.length) return fail(res, 400, "Nhập kho sau bảo hành trước khi xuất giao khách.");
  }
  const serialMoi = text(body.serial_moi, 50);
  if (maGd === 8 && !serialMoi) return fail(res, 400, "1 đổi 1 cần số serial mới.");
  const id = text(body.id, 40);
  if (id) {
    const cur = await AppDataSource.query(`SELECT status FROM dbo.bh_kho WHERE id = @0`, [id]);
    if (cur[0]?.status === "xac_nhan") return fail(res, 400, "Phiếu kho đã ghi sổ.");
  }
  const docId = id || (await AppDataSource.query(`SELECT NEWID() AS id`))[0].id;
  const soCt = text(body.so_ct, 30) || (await nextSo("KB"));
  const names: Record<number, string> = {
    7: "Xuất kho phụ tùng BH",
    8: "Xuất SP 1 đổi 1",
    10: loaiNx === "nhap" ? "Nhập kho SP sau BH" : "Xuất kho giao KH",
    11: "Nhập SP serial cũ",
  };
  const headerLines = Array.isArray(body.lines) && body.lines.length
    ? body.lines
    : maGd === 7
      ? await AppDataSource.query(
          `SELECT ma, ten, dvt, so_luong, gia, tien, '' AS so_serial FROM dbo.bh_phieu_ct WHERE phieuId = @0 AND loai = N'pt'`,
          [phieuId]
        )
      : [{ ma: ticket[0].ma_sp, ten: ticket[0].ten_sp, dvt: "", so_luong: 1, gia: 0, so_serial: maGd === 8 ? serialMoi : ticket[0].so_serial }];
  await AppDataSource.transaction(async (manager) => {
    const exists = await manager.query(`SELECT 1 AS n FROM dbo.bh_kho WHERE id = @0`, [docId]);
    const params = [
      docId, phieuId, soCt, maGd, loaiNx, ticket[0].so_serial || "", serialMoi,
      text(body.dien_giai, 300) || names[maGd], text(body.ma_kh, 50) || ticket[0].ma_kh || "", text(body.ten_kh, 200) || ticket[0].ten_kh || "", text(body.dia_chi, 300) || ticket[0].dia_chi || "",
      text(body.nguoi_nhan, 200) || ticket[0].ten_kh || "", text(body.nv_ban, 80), text(body.quyen_so, 20) || "KB001",
    ];
    if (exists.length) {
      await manager.query(
        `UPDATE dbo.bh_kho SET phieuId=@1, ma_gd=@3, loai_nx=@4, so_serial=@5, serial_moi=@6, dien_giai=@7,
          ma_kh=@8, ten_kh=@9, dia_chi=@10, nguoi_nhan=@11, nv_ban=@12, quyen_so=@13 WHERE id=@0`,
        params
      );
    } else {
      await manager.query(
        `INSERT INTO dbo.bh_kho (id, phieuId, so_ct, ngay_ct, ma_gd, loai_nx, status, so_serial, serial_moi, dien_giai,
          ma_kh, ten_kh, dia_chi, nguoi_nhan, nv_ban, quyen_so)
         VALUES (@0,@1,@2,CONVERT(date,GETDATE()),@3,@4,N'nhap',@5,@6,@7,@8,@9,@10,@11,@12,@13)`,
        params
      );
    }
    await manager.query(`DELETE FROM dbo.bh_kho_ct WHERE khoId = @0`, [docId]);
    let stt = 1;
    for (const raw of headerLines) {
      const ma = text(raw.ma || raw.ma_sp, 50);
      const ten = text(raw.ten || raw.ten_sp, 200);
      if (!ma && !ten) continue;
      const sl = num(raw.so_luong, 1);
      const gia = num(raw.gia);
      await manager.query(
        `INSERT INTO dbo.bh_kho_ct (id, khoId, stt, ma_sp, ten_sp, so_luong, so_serial, dvt, gia, tien, ma_kho, tk_no)
         VALUES (NEWID(), @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10)`,
        [docId, stt, ma, ten, sl, text(raw.so_serial, 50), text(raw.dvt, 20), gia, sl * gia, text(raw.ma_kho, 20), text(raw.tk_no, 20)]
      );
      stt += 1;
    }
  });
  req.params.id = docId;
  return getWarehouse(req, res);
}

export async function postWarehouse(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(`SELECT * FROM dbo.bh_kho WHERE id = @0`, [req.params.id]);
  const doc = rows[0];
  if (!doc) return fail(res, 404, "Không thấy phiếu kho");
  if (doc.status === "xac_nhan") return getWarehouse(req, res);
  const ticket = doc.phieuId ? await AppDataSource.query(`SELECT hoan_tat, status, loai_bh, so_serial FROM dbo.bh_phieu WHERE id = @0`, [doc.phieuId]) : [];
  if (ticket[0] && (Number(ticket[0].hoan_tat) === 1 || ticket[0].status === "hoan_tat")) {
    return fail(res, 400, "Phiếu đã hoàn tất — không thao tác kho.");
  }
  const lines = await AppDataSource.query(`SELECT ma_kho, so_serial FROM dbo.bh_kho_ct WHERE khoId = @0`, [req.params.id]);
  if (!lines.length) return fail(res, 400, "Phiếu kho chưa có dòng hàng.");
  const user = await actor(req);
  const maGd = Number(doc.ma_gd);
  const maKho = text(lines.find((line: { ma_kho?: string }) => line.ma_kho)?.ma_kho, 20);
  await AppDataSource.transaction(async (manager) => {
    await manager.query(`UPDATE dbo.bh_kho SET status = N'xac_nhan' WHERE id = @0`, [req.params.id]);
    const mark = async (so: string, tinh: string, note: string) => {
      if (!so) return;
      await manager.query(
        `UPDATE dbo.dm_serial SET tinh_trang = @1, changedAt = GETDATE(), changedBy = @2 WHERE so_serial = @0 AND tinh_trang <> N'Hủy số serial'`,
        [so, tinh, user]
      );
      await manager.query(
        `INSERT INTO dbo.dm_serial_log (id, serialId, so_serial, tinh_trang, ghi_chu, changedAt, changedBy)
         SELECT NEWID(), id, so_serial, @1, @2, GETDATE(), @3 FROM dbo.dm_serial WHERE so_serial = @0`,
        [so, tinh, note, user]
      );
    };
    if (doc.phieuId && (maGd === 7 || maGd === 8)) {
      await manager.query(`UPDATE dbo.bh_phieu SET status = N'dang_sua', updatedAt = GETDATE() WHERE id = @0 AND status <> N'huy' AND hoan_tat = 0`, [doc.phieuId]);
    }
    if (maGd === 7) await mark(String(doc.so_serial || ""), "Đang sửa chữa", "Xuất kho phụ tùng BH");
    if (maGd === 8) {
      await mark(String(doc.so_serial || ""), "Đổi bảo hành 1-1", "Xuất SP 1 đổi 1");
      if (doc.serial_moi) await mark(String(doc.serial_moi), "Mới đổi BH", "Serial mới 1 đổi 1");
    }
    if (maGd === 11) await mark(String(doc.so_serial || ""), maKho ? `Trong kho - ${maKho}` : "Trong kho", "Nhập serial cũ");
    if (maGd === 10 && doc.loai_nx === "nhap") await mark(String(doc.so_serial || ""), maKho ? `Trong kho - ${maKho}` : "Trong kho", "Nhập kho sau BH");
    if (doc.phieuId && maGd === 10 && doc.loai_nx === "xuat") {
      await manager.query(`UPDATE dbo.bh_phieu SET status = N'da_giao', updatedAt = GETDATE() WHERE id = @0 AND status <> N'huy'`, [doc.phieuId]);
      await mark(String(doc.so_serial || ""), "Đã giao khách", "Xuất kho giao khách");
    }
    if (doc.phieuId && maGd === 8 && doc.serial_moi) {
      await manager.query(`UPDATE dbo.bh_phieu SET so_serial = @1, updatedAt = GETDATE() WHERE id = @0`, [doc.phieuId, doc.serial_moi]);
    }
  });
  return getWarehouse(req, res);
}

export async function listReceipts(_req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT t.id, t.so_ct, t.ngay_ct, t.so_tien, t.hinh_thuc, t.status, t.ten_kh, t.phieuId, p.so_ct AS so_phieu
     FROM dbo.bh_thu t LEFT JOIN dbo.bh_phieu p ON p.id = t.phieuId
     ORDER BY t.ngay_ct DESC, t.so_ct DESC`
  );
  res.json(rows);
}

export async function getReceipt(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT t.*, p.so_ct AS so_phieu, p.t_tt FROM dbo.bh_thu t LEFT JOIN dbo.bh_phieu p ON p.id = t.phieuId WHERE t.id = @0`,
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 404, "Không thấy phiếu thu");
  const lines = await AppDataSource.query(`SELECT stt, so_serial, tk_no, ten_tk, so_tien, ghi_chu, so_ct_dv, ngay_ct_dv FROM dbo.bh_thu_ct WHERE thuId = @0 ORDER BY stt`, [req.params.id]);
  res.json({ ...rows[0], lines });
}

export async function saveReceipt(req: AuthRequest, res: Response) {
  const body = req.body || {};
  const phieuId = text(body.phieuId, 40);
  const ticket = await AppDataSource.query(`SELECT * FROM dbo.bh_phieu WHERE id = @0`, [phieuId]);
  if (!ticket[0]) return fail(res, 400, "Chọn phiếu bảo hành.");
  if (!POSTED_TICKET.includes(String(ticket[0].status))) return fail(res, 400, "Chỉ thu trên phiếu đã ghi sổ.");
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const lines = rawLines
    .map((line: Record<string, unknown>) => ({
      so_serial: text(line.so_serial, 50),
      tk_no: text(line.tk_no, 20),
      ten_tk: text(line.ten_tk, 200),
      so_tien: num(line.so_tien),
      ghi_chu: text(line.ghi_chu, 200),
      so_ct_dv: text(line.so_ct_dv, 30) || ticket[0].so_ct || "",
      ngay_ct_dv: dateOnly(line.ngay_ct_dv) || dateOnly(ticket[0].ngay_ct),
    }))
    .filter((line: { so_tien: number }) => line.so_tien > 0);
  const soTien = lines.length ? lines.reduce((sum: number, line: { so_tien: number }) => sum + line.so_tien, 0) : num(body.so_tien, Number(ticket[0].t_tt || 0));
  if (soTien <= 0) return fail(res, 400, "Số tiền thu phải lớn hơn 0.");
  const docId = text(body.id, 40) || (await AppDataSource.query(`SELECT NEWID() AS id`))[0].id;
  const soCt = text(body.so_ct, 30) || (await nextSo("TH"));
  const hinhThuc = text(body.hinh_thuc, 30) === "ck" ? "Chuyển khoản" : "Tiền mặt";
  await AppDataSource.transaction(async (manager) => {
    const exists = await manager.query(`SELECT 1 AS n FROM dbo.bh_thu WHERE id = @0`, [docId]);
    if (!exists.length) {
      await manager.query(
        `INSERT INTO dbo.bh_thu (id, phieuId, so_ct, ngay_ct, so_tien, hinh_thuc, dien_giai, ma_kh, ten_kh, dia_chi, nguoi_nop, ly_do, status, quyen_so)
         VALUES (@0,@1,@2,CONVERT(date,GETDATE()),@3,@4,@5,@6,@7,@8,@9,@10,N'da_thu',@11)`,
        [
          docId, phieuId, soCt, soTien, hinhThuc, text(body.dien_giai, 300) || "Thu bảo hành",
          text(body.ma_kh, 50) || ticket[0].ma_kh || "", text(body.ten_kh, 200) || ticket[0].ten_kh || "", text(body.dia_chi, 300) || ticket[0].dia_chi || "",
          text(body.nguoi_nop, 200) || ticket[0].ten_kh || "", text(body.ly_do, 300) || "Thu tiền sửa chữa / phụ tùng BH",
          text(body.quyen_so, 20) || "PT001",
        ]
      );
    }
    await manager.query(`DELETE FROM dbo.bh_thu_ct WHERE thuId = @0`, [docId]);
    let stt = 1;
    for (const line of lines) {
      await manager.query(
        `INSERT INTO dbo.bh_thu_ct (id, thuId, stt, so_serial, tk_no, ten_tk, so_tien, ghi_chu, so_ct_dv, ngay_ct_dv)
         VALUES (NEWID(), @0, @1, @2, @3, @4, @5, @6, @7, @8)`,
        [docId, stt, line.so_serial, line.tk_no, line.ten_tk, line.so_tien, line.ghi_chu, line.so_ct_dv, line.ngay_ct_dv]
      );
      stt += 1;
    }
    await manager.query(
      `UPDATE dbo.bh_phieu SET tg_hoan_tra_tt = ISNULL(tg_hoan_tra_tt, GETDATE()), updatedAt = GETDATE() WHERE id = @0`,
      [phieuId]
    );
    if (ticket[0].so_serial) {
      await manager.query(
        `UPDATE dbo.dm_serial SET tinh_trang = N'Đã thu BH', changedAt = GETDATE() WHERE so_serial = @0 AND tinh_trang <> N'Hủy số serial'`,
        [ticket[0].so_serial]
      );
    }
  });
  req.params.id = docId;
  return getReceipt(req, res);
}

export async function listInvoices(_req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT h.id, h.so_ct, h.ngay_ct, h.status, h.ten_kh, h.t_tien, h.so_phieu, h.phieuId
     FROM dbo.bh_hoadon h ORDER BY h.ngay_ct DESC, h.so_ct DESC`
  );
  res.json(rows);
}

export async function getInvoice(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(`SELECT * FROM dbo.bh_hoadon WHERE id = @0`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "Không thấy hóa đơn");
  const lines = rows[0].phieuId ? (await linesOf("bh_phieu_ct", "phieuId", String(rows[0].phieuId))).map((line: Record<string, unknown>) => mapDocLine(line)) : [];
  res.json({ ...rows[0], lines });
}

export async function saveInvoice(req: AuthRequest, res: Response) {
  const body = req.body || {};
  const phieuId = text(body.phieuId, 40);
  const ticket = await AppDataSource.query(`SELECT * FROM dbo.bh_phieu WHERE id = @0`, [phieuId]);
  if (!ticket[0]) return fail(res, 400, "Chọn phiếu bảo hành.");
  if (Number(ticket[0].xuat_hd) !== 1) return fail(res, 400, "Phiếu chưa chọn Xuất hóa đơn.");
  if (!POSTED_TICKET.includes(String(ticket[0].status))) return fail(res, 400, "Ghi sổ phiếu DV trước khi lập hóa đơn.");
  const dup = await AppDataSource.query(`SELECT id FROM dbo.bh_hoadon WHERE phieuId = @0`, [phieuId]);
  if (dup[0]) {
    req.params.id = dup[0].id;
    return getInvoice(req, res);
  }
  const docId = (await AppDataSource.query(`SELECT NEWID() AS id`))[0].id;
  const soCt = await nextSo("HD");
  await AppDataSource.query(
    `INSERT INTO dbo.bh_hoadon (id, phieuId, so_ct, ngay_ct, ma_kh, ten_kh, t_tien, dien_giai, status, dia_chi, mst, dien_thoai, email, cccd, so_phieu)
     VALUES (@0,@1,@2,CONVERT(date,GETDATE()),@3,@4,@5,@6,N'nhap',@7,@8,@9,@10,@11,@12)`,
    [
      docId, phieuId, soCt, text(body.ma_kh, 50) || ticket[0].ma_kh || "", text(body.ten_kh, 200) || ticket[0].hd_ten || ticket[0].ten_kh || "",
      Number(ticket[0].t_tt || 0), "Hóa đơn từ phiếu BH", text(body.dia_chi, 300) || ticket[0].hd_dia_chi || ticket[0].dia_chi || "",
      ticket[0].hd_mst || ticket[0].mst || "", ticket[0].hd_dt || ticket[0].dien_thoai || "",
      ticket[0].hd_email || ticket[0].email || "", ticket[0].hd_cccd || ticket[0].cccd || "", ticket[0].so_ct,
    ]
  );
  req.params.id = docId;
  return getInvoice(req, res);
}

export async function postInvoice(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(`SELECT status FROM dbo.bh_hoadon WHERE id = @0`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "Không thấy hóa đơn");
  if (rows[0].status === "ghi_so") return getInvoice(req, res);
  await AppDataSource.query(`UPDATE dbo.bh_hoadon SET status = N'ghi_so' WHERE id = @0`, [req.params.id]);
  return getInvoice(req, res);
}

export async function changeSerialSituation(req: AuthRequest, res: Response) {
  const so = text(req.body?.so_serial, 20);
  const tinh = text(req.body?.tinh_trang, 100);
  const note = text(req.body?.ghi_chu, 500);
  if (!so || !tinh) return fail(res, 400, "Nhập serial và tình trạng.");
  const rows = await AppDataSource.query(`SELECT id FROM dbo.dm_serial WHERE so_serial = @0`, [so]);
  if (!rows[0]) return fail(res, 404, "Không thấy serial.");
  const user = await actor(req);
  await AppDataSource.transaction(async (manager) => {
    await manager.query(
      `UPDATE dbo.dm_serial SET tinh_trang = @1, changedAt = GETDATE(), changedBy = @2 WHERE so_serial = @0`,
      [so, tinh, user]
    );
    await manager.query(
      `INSERT INTO dbo.dm_serial_log (id, serialId, so_serial, tinh_trang, ghi_chu, changedAt, changedBy)
       VALUES (NEWID(), @0, @1, @2, @3, GETDATE(), @4)`,
      [rows[0].id, so, tinh, note || "Đổi tình trạng từ tra cứu BH", user]
    );
  });
  res.json({ ok: true, so_serial: so, tinh_trang: tinh });
}

export async function createReplacementSerial(req: AuthRequest, res: Response) {
  const oldNo = text(req.body?.so_serial, 20);
  if (!oldNo) return fail(res, 400, "Chọn serial cũ.");
  const rows = await AppDataSource.query(`SELECT TOP 1 * FROM dbo.dm_serial WHERE so_serial = @0`, [oldNo]);
  if (!rows[0]) return fail(res, 404, "Không thấy serial cũ.");
  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const so = `M${String(stamp.getFullYear()).slice(2)}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`.slice(0, 20);
  const user = await actor(req);
  const src = rows[0];
  await AppDataSource.transaction(async (manager) => {
    const idRow = await manager.query(`SELECT NEWID() AS id`);
    const id = idRow[0].id;
    await manager.query(
      `INSERT INTO dbo.dm_serial (id, so_serial, ma_kh, ten_kh, ma_sp, ten_sp, dvt, so_batch, trang_thai, tinh_trang, ghi_chu, createdAt, createdBy)
       VALUES (@0,@1,@2,@3,@4,@5,@6,@7,N'Mới đổi BH',N'Mới đổi BH',@8,GETDATE(),@9)`,
      [id, so, src.ma_kh || "", src.ten_kh || "", src.ma_sp || "", src.ten_sp || "", src.dvt || "", src.so_batch || "", `Đổi từ serial ${oldNo}`, user]
    );
    await manager.query(
      `INSERT INTO dbo.dm_serial_log (id, serialId, so_serial, tinh_trang, ghi_chu, changedAt, changedBy)
       VALUES (NEWID(), @0, @1, N'Mới đổi BH', @2, GETDATE(), @3)`,
      [id, so, `Tạo serial mới 1 đổi 1 từ ${oldNo}`, user]
    );
  });
  res.json({ so_serial: so, ma_sp: src.ma_sp, ten_sp: src.ten_sp });
}

export async function traceSerial(req: AuthRequest, res: Response) {
  const q = text(req.query.q, 80);
  if (!q) return res.json({ serial: null, steps: [] });
  const serialRows = await AppDataSource.query(`SELECT TOP 1 * FROM dbo.dm_serial WHERE so_serial = @0`, [q]);
  const like = `%${q}%`;
  const quotes = await AppDataSource.query(
    `SELECT id, so_ct, ngay_ct, status, ten_kh, t_tien FROM dbo.bh_baogia WHERE so_serial = @0 OR so_serial LIKE @1 ORDER BY ngay_ct`,
    [q, like]
  );
  const tickets = await AppDataSource.query(
    `SELECT id, so_ct, ngay_ct, status, loai_bh, ten_kh, ten_sp, hoan_tat, xuat_hd, t_tt, yeu_cau, tu_van, dien_thoai, email, createdBy
     FROM dbo.bh_phieu WHERE so_serial = @0 ORDER BY ngay_ct`,
    [q]
  );
  const ids = tickets.map((row: { id: string }) => row.id);
  let kho: unknown[] = [];
  let thu: unknown[] = [];
  let hd: unknown[] = [];
  if (ids.length) {
    const khoMarks = ids.map((_: string, i: number) => `@${i + 1}`).join(",");
    const idMarks = ids.map((_: string, i: number) => `@${i}`).join(",");
    kho = await AppDataSource.query(
      `SELECT id, so_ct, ngay_ct, ma_gd, loai_nx, status, so_serial, serial_moi, phieuId FROM dbo.bh_kho WHERE so_serial = @0 OR serial_moi = @0 OR phieuId IN (${khoMarks})`,
      [q, ...ids]
    );
    thu = await AppDataSource.query(
      `SELECT id, so_ct, ngay_ct, so_tien, hinh_thuc, status, phieuId FROM dbo.bh_thu WHERE phieuId IN (${idMarks})`,
      ids
    );
    hd = await AppDataSource.query(
      `SELECT id, so_ct, ngay_ct, status, t_tien, so_phieu, phieuId FROM dbo.bh_hoadon WHERE phieuId IN (${idMarks})`,
      ids
    );
  } else {
    kho = await AppDataSource.query(
      `SELECT id, so_ct, ngay_ct, ma_gd, loai_nx, status, so_serial, serial_moi, phieuId FROM dbo.bh_kho WHERE so_serial = @0 OR serial_moi = @0`,
      [q]
    );
  }
  const logs = await AppDataSource.query(
    `SELECT tinh_trang, ghi_chu, changedAt, changedBy FROM dbo.dm_serial_log WHERE so_serial = @0 ORDER BY changedAt DESC`,
    [q]
  );
  res.json({ serial: serialRows[0] || null, quotes, tickets, kho, thu, hd, logs });
}

export async function suggestWarranty(_req: AuthRequest, res: Response) {
  const customers = await AppDataSource.query(
    `SELECT ma_kh, MAX(ten_kh) AS ten_kh, MAX(dia_chi) AS dia_chi, MAX(dien_thoai) AS dien_thoai, MAX(email) AS email,
            MAX(mst) AS mst, MAX(cccd) AS cccd, MAX(nhom) AS nhom
     FROM (
       SELECT code AS ma_kh, name AS ten_kh, address AS dia_chi, phone AS dien_thoai, email, taxCode AS mst, idCard AS cccd, customerGroup AS nhom
       FROM dbo.customers
       UNION ALL
       SELECT customerCode, customerName, customerAddress, customerPhone, customerEmail,
              CAST(NULL AS NVARCHAR(30)), CAST(NULL AS NVARCHAR(20)), customerGroup
       FROM dbo.stock_outs
       WHERE customerCode IS NOT NULL AND LTRIM(RTRIM(customerCode)) <> ''
         AND NOT EXISTS (SELECT 1 FROM dbo.customers c WHERE c.code = customerCode)
       UNION ALL
       SELECT ma_kh, ten_kh, CAST(NULL AS NVARCHAR(300)), CAST(NULL AS NVARCHAR(50)), CAST(NULL AS NVARCHAR(100)),
              CAST(NULL AS NVARCHAR(30)), CAST(NULL AS NVARCHAR(20)), CAST(NULL AS NVARCHAR(20))
       FROM dbo.dm_serial
       WHERE ma_kh IS NOT NULL AND LTRIM(RTRIM(ma_kh)) <> ''
         AND NOT EXISTS (SELECT 1 FROM dbo.customers c WHERE c.code = ma_kh)
     ) s
     GROUP BY ma_kh
     ORDER BY ma_kh`
  );
  const serials = await AppDataSource.query(
    `SELECT TOP 400 so_serial, ma_kh, ten_kh, ma_sp, ten_sp, so_batch
     FROM dbo.dm_serial ORDER BY createdAt DESC`
  );
  res.json({ customers, serials });
}

export async function listKm(_req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(
    `SELECT id, ma_km, ten_km, ngay_hl1, ngay_hl2, trang_thai, ghi_chu, ghi_chu_duyet, user_id0, datetime0, user_id_duyet, datetime_duyet
     FROM dbo.dm_bh_km ORDER BY datetime0 DESC`
  );
  res.json(rows);
}

export async function getKm(req: AuthRequest, res: Response) {
  const rows = await AppDataSource.query(`SELECT * FROM dbo.dm_bh_km WHERE id = @0`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "Không thấy chương trình KM");
  const lines = await AppDataSource.query(`SELECT loai, ma, tl_km, tien_km FROM dbo.dm_bh_km_ct WHERE kmId = @0`, [req.params.id]);
  res.json({ ...rows[0], lines });
}

export async function saveKm(req: AuthRequest, res: Response) {
  const body = req.body || {};
  const ma = text(body.ma_km, 30).toUpperCase();
  const ten = text(body.ten_km, 200);
  if (!ma || !ten) return fail(res, 400, "Nhập mã và tên chương trình KM.");
  const id = text(body.id, 40) || text(req.params.id, 40);
  const user = await actor(req);
  const docId = id || (await AppDataSource.query(`SELECT NEWID() AS id`))[0].id;
  const dup = await AppDataSource.query(`SELECT id FROM dbo.dm_bh_km WHERE ma_km = @0 AND id <> @1`, [ma, docId]);
  if (dup[0]) return fail(res, 400, "Mã KM đã tồn tại.");
  const lines = (Array.isArray(body.lines) ? body.lines : []) as Record<string, unknown>[];
  try {
    await AppDataSource.transaction(async (manager) => {
    const exists = await manager.query(`SELECT trang_thai FROM dbo.dm_bh_km WHERE id = @0`, [docId]);
    if (exists[0] && Number(exists[0].trang_thai) === 1) {
      throw new Error("KM đã duyệt — không sửa.");
    }
    if (exists.length) {
      await manager.query(
        `UPDATE dbo.dm_bh_km SET ma_km=@1, ten_km=@2, ngay_hl1=@3, ngay_hl2=@4, ghi_chu=@5 WHERE id=@0`,
        [docId, ma, ten, dateOnly(body.ngay_hl1), dateOnly(body.ngay_hl2), text(body.ghi_chu, 300)]
      );
    } else {
      await manager.query(
        `INSERT INTO dbo.dm_bh_km (id, ma_km, ten_km, ngay_hl1, ngay_hl2, trang_thai, ghi_chu, user_id0)
         VALUES (@0,@1,@2,@3,@4,0,@5,@6)`,
        [docId, ma, ten, dateOnly(body.ngay_hl1), dateOnly(body.ngay_hl2), text(body.ghi_chu, 300), user]
      );
    }
    await manager.query(`DELETE FROM dbo.dm_bh_km_ct WHERE kmId = @0`, [docId]);
    for (const line of lines) {
      const code = text(line.ma, 50);
      if (!code) continue;
      await manager.query(
        `INSERT INTO dbo.dm_bh_km_ct (id, kmId, loai, ma, tl_km, tien_km) VALUES (NEWID(), @0, @1, @2, @3, @4)`,
        [docId, line.loai === "pt" ? "pt" : "tc", code, num(line.tl_km), num(line.tien_km)]
      );
    }
    });
  } catch (error) {
    return fail(res, 400, error instanceof Error ? error.message : "Không lưu được KM");
  }
  req.params.id = docId;
  return getKm(req, res);
}

export async function setKmStatus(req: AuthRequest, res: Response) {
  const status = Number(req.body?.trang_thai);
  if (![1, 2, 3].includes(status)) return fail(res, 400, "Trạng thái duyệt không hợp lệ.");
  const user = await actor(req);
  const rows = await AppDataSource.query(`SELECT id FROM dbo.dm_bh_km WHERE id = @0`, [req.params.id]);
  if (!rows[0]) return fail(res, 404, "Không thấy chương trình KM");
  await AppDataSource.query(
    `UPDATE dbo.dm_bh_km SET trang_thai=@1, ghi_chu_duyet=@2, user_id_duyet=@3, datetime_duyet=GETDATE() WHERE id=@0`,
    [req.params.id, status, text(req.body?.ghi_chu_duyet, 300), user]
  );
  return getKm(req, res);
}

export async function matchKm(req: AuthRequest, res: Response) {
  const ma = text(req.query.ma, 50);
  const loai = text(req.query.loai, 10) === "pt" ? "pt" : "tc";
  const ngay = dateOnly(req.query.ngay) || new Date().toISOString().slice(0, 10);
  if (!ma) return res.json([]);
  const rows = await AppDataSource.query(
    `SELECT k.ma_km, k.ten_km, d.tl_km, d.tien_km
     FROM dbo.dm_bh_km k
     INNER JOIN dbo.dm_bh_km_ct d ON d.kmId = k.id
     WHERE k.trang_thai = 1 AND k.ngay_hl1 <= @0 AND k.ngay_hl2 >= @0 AND d.loai = @1 AND d.ma = @2
     ORDER BY k.ma_km`,
    [ngay, loai, ma]
  );
  res.json(rows);
}
