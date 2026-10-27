import { Router } from "express";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware";
import { customerHandlers, laborHandlers, productHandlers, listStockOuts, getStockOut, saveStockOut, deleteStockOut, listInventory } from "../controllers/warehouse.controller";
import { serialHandlers } from "../controllers/serial.controller";
import { commitImport, downloadTemplate, parseImportFile } from "../controllers/import.controller";
import { uploadImportExcel } from "../middlewares/upload.middleware";
import {
  cancelTicket, completeTicket, getInvoice, getQuote, getReceipt, getTicket, getWarehouse,
  listInvoices, listQuotes, listReceipts, listTickets, listWarehouse, lookupSerialForTicket,
  changeSerialSituation, createReplacementSerial, postInvoice, postQuote, postTicket, postWarehouse, saveInvoice, saveQuote, saveReceipt, saveTicket, saveWarehouse, suggestWarranty, traceSerial,
  listKm, getKm, saveKm, setKmStatus, matchKm, warrantyBoard, serialReport,
} from "../controllers/warranty.controller";

const router = Router();
router.use(authenticateToken);

const catalogWrite = requireRoles("warehouse", "sales");
const warehouseWrite = requireRoles("warehouse", "sales");
const warrantyWrite = requireRoles("warranty", "sales");

router.get("/import/template/:mode", catalogWrite, downloadTemplate);
router.post("/import/parse", catalogWrite, uploadImportExcel.single("file"), parseImportFile);
router.post("/import/:mode", catalogWrite, commitImport);

router.get("/products", productHandlers.list);
router.post("/products", catalogWrite, productHandlers.create);
router.put("/products/:id", catalogWrite, productHandlers.update);
router.delete("/products/:id", catalogWrite, productHandlers.remove);

router.get("/customers", customerHandlers.list);
router.post("/customers", catalogWrite, customerHandlers.create);
router.put("/customers/:id", catalogWrite, customerHandlers.update);
router.delete("/customers/:id", catalogWrite, customerHandlers.remove);

router.get("/labors", laborHandlers.list);
router.post("/labors", catalogWrite, laborHandlers.create);
router.put("/labors/:id", catalogWrite, laborHandlers.update);
router.delete("/labors/:id", catalogWrite, laborHandlers.remove);

router.get("/inventory", listInventory);
router.get("/stock-outs", listStockOuts);
router.get("/stock-outs/:id", getStockOut);
router.post("/stock-outs", warehouseWrite, saveStockOut);
router.put("/stock-outs/:id", warehouseWrite, saveStockOut);
router.delete("/stock-outs/:id", warehouseWrite, deleteStockOut);

router.get("/serials/lock", serialHandlers.lockStatus);
router.post("/serials/lock", serialHandlers.acquire);
router.post("/serials/lock/heartbeat", serialHandlers.heartbeat);
router.delete("/serials/lock", serialHandlers.release);
router.get("/serials/vouchers", serialHandlers.eligibleVouchers);
router.get("/serials/vouchers/:id", serialHandlers.voucherDetail);
router.get("/serials", serialHandlers.list);
router.post("/serials", serialHandlers.create);
router.post("/serials/complete", serialHandlers.complete);

router.get("/warranty/quotes", listQuotes);
router.get("/warranty/quotes/:id", getQuote);
router.post("/warranty/quotes", warrantyWrite, saveQuote);
router.put("/warranty/quotes/:id", warrantyWrite, saveQuote);
router.post("/warranty/quotes/:id/post", warrantyWrite, postQuote);

router.get("/warranty/km/match", matchKm);
router.get("/warranty/km", listKm);
router.get("/warranty/km/:id", getKm);
router.post("/warranty/km", warrantyWrite, saveKm);
router.put("/warranty/km/:id", warrantyWrite, saveKm);
router.post("/warranty/km/:id/status", warrantyWrite, setKmStatus);

router.get("/warranty/suggest", suggestWarranty);
router.get("/warranty/serial-report", serialReport);
router.get("/warranty/serial", lookupSerialForTicket);
router.post("/warranty/serial/situation", warrantyWrite, changeSerialSituation);
router.post("/warranty/serial/replace", warrantyWrite, createReplacementSerial);
router.get("/warranty/board", warrantyBoard);
router.get("/warranty/tickets", listTickets);
router.get("/warranty/tickets/:id", getTicket);
router.post("/warranty/tickets", warrantyWrite, saveTicket);
router.put("/warranty/tickets/:id", warrantyWrite, saveTicket);
router.post("/warranty/tickets/:id/post", warrantyWrite, postTicket);
router.post("/warranty/tickets/:id/complete", warrantyWrite, completeTicket);
router.post("/warranty/tickets/:id/cancel", cancelTicket);

router.get("/warranty/warehouse", listWarehouse);
router.get("/warranty/warehouse/:id", getWarehouse);
router.post("/warranty/warehouse", warrantyWrite, saveWarehouse);
router.put("/warranty/warehouse/:id", warrantyWrite, saveWarehouse);
router.post("/warranty/warehouse/:id/post", warrantyWrite, postWarehouse);

router.get("/warranty/receipts", listReceipts);
router.get("/warranty/receipts/:id", getReceipt);
router.post("/warranty/receipts", warrantyWrite, saveReceipt);

router.get("/warranty/invoices", listInvoices);
router.get("/warranty/invoices/:id", getInvoice);
router.post("/warranty/invoices", warrantyWrite, saveInvoice);
router.post("/warranty/invoices/:id/post", warrantyWrite, postInvoice);

router.get("/warranty/trace", traceSerial);

export default router;
