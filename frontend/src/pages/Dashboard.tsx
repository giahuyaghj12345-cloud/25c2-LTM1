import { Link } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../auth";
import productIcon from "../assets/icons/dm-product.png";
import laborIcon from "../assets/icons/dm-labor.png";
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
import { canUseSerial } from "../api";
import BhBoard from "../components/BhBoard";

type Tile = {
  to: string;
  label: string;
  image?: string;
  Icon?: () => ReactElement;
  tone?: string;
};

function TileGrid({ items }: { items: Tile[] }) {
  return (
    <div className="dash-grid">
      {items.map((tile) => (
        <Link key={tile.to} className="dash-tile" to={tile.to}>
          {tile.image ? (
            <img src={tile.image} alt="" />
          ) : (
            <span className={`dash-ico ${tile.tone || ""}`}>{tile.Icon ? <tile.Icon /> : null}</span>
          )}
          <strong>{tile.label}</strong>
        </Link>
      ))}
    </div>
  );
}

function IconCustomer() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <section>
      <div className="page-head">
        <h1>Tổng quan</h1>
        <p className="muted">Chọn nhóm chức năng, rồi bấm icon để vào trang</p>
      </div>

      <BhBoard />

      <div className="dash-section">
        <h2>
          <em>1</em> Danh mục
        </h2>
        <TileGrid
          items={[
            { to: "/products", label: "DM sản phẩm", image: productIcon },
            { to: "/labors", label: "DM tiền công", image: laborIcon },
            { to: "/customers", label: "DM khách hàng", Icon: IconCustomer, tone: "kh" },
          ]}
        />
      </div>

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

      {canUseSerial(user) && (
        <div className="dash-section">
          <h2>
            <em>3</em> Tạo số Serial
          </h2>
          <TileGrid items={[{ to: "/serials", label: "Tạo số Serial", image: serialIcon }]} />
        </div>
      )}

      <div className="dash-section">
        <h2>
          <em>4</em> Bảo hành
        </h2>
        <TileGrid
          items={[
            { to: "/warranty/quotes", label: "Báo giá BH", image: quoteIcon },
            { to: "/warranty/tickets", label: "Phiếu bảo hành", image: ticketIcon },
            { to: "/warranty/warehouse", label: "Kho bảo hành", image: warrantyWhIcon },
            { to: "/warranty/receipts", label: "Thu tiền BH", image: receiptIcon },
            { to: "/warranty/invoices", label: "Hóa đơn BH", image: invoiceIcon },
            { to: "/warranty/lookup", label: "Tra cứu serial", image: lookupIcon },
            { to: "/warranty/promotions", label: "Khuyến mãi BH", image: promoIcon },
          ]}
        />
      </div>
    </section>
  );
}
