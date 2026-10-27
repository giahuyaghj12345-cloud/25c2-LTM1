import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import productIcon from "../assets/icons/dm-product.png";
import laborIcon from "../assets/icons/dm-labor.png";
import customerIcon from "../assets/icons/dm-customer.png";
import warehouseIcon from "../assets/icons/warehouse.png";
import inventoryIcon from "../assets/icons/dm-inventory.png";
import serialIcon from "../assets/icons/dm-serial.png";
import quoteIcon from "../assets/icons/bh-quote.png";
import ticketIcon from "../assets/icons/bh-ticket.png";
import warrantyWhIcon from "../assets/icons/bh-warehouse.png";
import receiptIcon from "../assets/icons/bh-receipt.png";
import invoiceIcon from "../assets/icons/bh-invoice.png";
import lookupIcon from "../assets/icons/bh-lookup.png";
import promoIcon from "../assets/icons/bh-promo.png";
import { canAccessCatalog, canAccessWarehouse, canAccessWarranty, canUseSerial, canWriteWarranty } from "../api";
import BhBoard from "../components/BhBoard";

type Tile = {
  to: string;
  label: string;
  image: string;
};

function TileGrid({ items }: { items: Tile[] }) {
  return (
    <div className="dash-grid">
      {items.map((tile) => (
        <Link key={tile.to} className="dash-tile" to={tile.to}>
          <img src={tile.image} alt="" />
          <strong>{tile.label}</strong>
        </Link>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const showCatalog = canAccessCatalog(user);
  const showWarehouse = canAccessWarehouse(user);
  const showWarranty = canAccessWarranty(user);
  const showWarrantyWrite = canWriteWarranty(user);
  return (
    <section>
      <div className="page-head">
        <h1>Tổng quan</h1>
        <p className="muted">Chào {user?.username || "bạn"} — chọn nhóm chức năng bên dưới để bắt đầu làm việc</p>
      </div>

      {showWarrantyWrite && <BhBoard />}

      {showCatalog && (
      <div className="dash-section">
        <h2>
          <em>1</em> Danh mục
        </h2>
        <TileGrid
          items={[
            { to: "/products", label: "DM sản phẩm", image: productIcon },
            { to: "/labors", label: "DM tiền công", image: laborIcon },
            { to: "/customers", label: "DM khách hàng", image: customerIcon },
          ]}
        />
      </div>
      )}

      {showWarehouse && (
      <div className="dash-section">
        <h2>
          <em>2</em> Kho
        </h2>
        <TileGrid
          items={[
            { to: "/stock-outs", label: "Phiếu xuất kho", image: warehouseIcon },
            { to: "/inventory", label: "Tồn kho sản phẩm", image: inventoryIcon },
          ]}
        />
      </div>
      )}

      {canUseSerial(user) && (
        <div className="dash-section">
          <h2>
            <em>3</em> Tạo số Serial
          </h2>
          <TileGrid items={[{ to: "/serials", label: "Tạo số Serial", image: serialIcon }]} />
        </div>
      )}

      {showWarranty && (
      <div className="dash-section">
        <h2>
          <em>4</em> Bảo hành
        </h2>
        <TileGrid
          items={[
            ...(showWarrantyWrite
              ? [
                  { to: "/warranty/quotes", label: "Báo giá BH", image: quoteIcon },
                  { to: "/warranty/tickets", label: "Phiếu bảo hành", image: ticketIcon },
                  { to: "/warranty/warehouse", label: "Kho bảo hành", image: warrantyWhIcon },
                  { to: "/warranty/receipts", label: "Thu tiền BH", image: receiptIcon },
                  { to: "/warranty/invoices", label: "Hóa đơn BH", image: invoiceIcon },
                  { to: "/warranty/promotions", label: "Khuyến mãi BH", image: promoIcon },
                ]
              : []),
            { to: "/warranty/lookup", label: "Tra cứu serial", image: lookupIcon },
            { to: "/warranty/serial-report", label: "Báo cáo serial", image: serialIcon },
          ]}
        />
      </div>
      )}
    </section>
  );
}
