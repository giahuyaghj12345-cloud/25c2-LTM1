import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { customerHandlers, laborHandlers, productHandlers, listStockOuts, getStockOut, saveStockOut, deleteStockOut, listInventory } from "../controllers/warehouse.controller";
import { serialHandlers } from "../controllers/serial.controller";
import {
  cancelTicket, completeTicket, getInvoice, getQuote, getReceipt, getTicket, getWarehouse,
  listInvoices, listQuotes, listReceipts, listTickets, listWarehouse, lookupSerialForTicket,
  changeSerialSituation, createReplacementSerial, postInvoice, postQuote, postTicket, postWarehouse, saveInvoice, saveQuote, saveReceipt, saveTicket, saveWarehouse, suggestWarranty, traceSerial,
  listKm, getKm, saveKm, setKmStatus, matchKm, warrantyBoard,
} from "../controllers/warranty.controller";

const router = Router();
router.use(authenticateToken);

router.get("/products", productHandlers.list);
router.post("/products", productHandlers.create);
router.put("/products/:id", productHandlers.update);
router.delete("/products/:id", productHandlers.remove);

router.get("/customers", customerHandlers.list);
router.post("/customers", customerHandlers.create);
router.put("/customers/:id", customerHandlers.update);
router.delete("/customers/:id", customerHandlers.remove);

router.get("/labors", laborHandlers.list);
router.post("/labors", laborHandlers.create);
router.put("/labors/:id", laborHandlers.update);
router.delete("/labors/:id", laborHandlers.remove);

router.get("/inventory", listInventory);
router.get("/stock-outs", listStockOuts);
router.get("/stock-outs/:id", getStockOut);
router.post("/stock-outs", saveStockOut);
router.put("/stock-outs/:id", saveStockOut);
router.delete("/stock-outs/:id", deleteStockOut);

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
router.post("/warranty/quotes", saveQuote);
router.put("/warranty/quotes/:id", saveQuote);
router.post("/warranty/quotes/:id/post", postQuote);

router.get("/warranty/km/match", matchKm);
router.get("/warranty/km", listKm);
router.get("/warranty/km/:id", getKm);
router.post("/warranty/km", saveKm);
router.put("/warranty/km/:id", saveKm);
router.post("/warranty/km/:id/status", setKmStatus);

router.get("/warranty/suggest", suggestWarranty);
router.get("/warranty/serial", lookupSerialForTicket);
router.post("/warranty/serial/situation", changeSerialSituation);
router.post("/warranty/serial/replace", createReplacementSerial);
router.get("/warranty/board", warrantyBoard);
router.get("/warranty/tickets", listTickets);
router.get("/warranty/tickets/:id", getTicket);
router.post("/warranty/tickets", saveTicket);
router.put("/warranty/tickets/:id", saveTicket);
router.post("/warranty/tickets/:id/post", postTicket);
router.post("/warranty/tickets/:id/complete", completeTicket);
router.post("/warranty/tickets/:id/cancel", cancelTicket);

router.get("/warranty/warehouse", listWarehouse);
router.get("/warranty/warehouse/:id", getWarehouse);
router.post("/warranty/warehouse", saveWarehouse);
router.put("/warranty/warehouse/:id", saveWarehouse);
router.post("/warranty/warehouse/:id/post", postWarehouse);

router.get("/warranty/receipts", listReceipts);
router.get("/warranty/receipts/:id", getReceipt);
router.post("/warranty/receipts", saveReceipt);

router.get("/warranty/invoices", listInvoices);
router.get("/warranty/invoices/:id", getInvoice);
router.post("/warranty/invoices", saveInvoice);
router.post("/warranty/invoices/:id/post", postInvoice);

router.get("/warranty/trace", traceSerial);

export default router;
