import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../auth";
import {
  ROLE_LABELS,
  authApi,
  canAccessCatalog,
  canAccessWarehouse,
  canAccessWarranty,
  canUseSerial,
  canWriteWarranty,
  type AppNotification,
  type Role,
} from "../api";
import ThemeToggle from "./ThemeToggle";
import catalogIcon from "../assets/icons/catalog.png";
import productIcon from "../assets/icons/dm-product.png";
import laborIcon from "../assets/icons/dm-labor.png";
import customerIcon from "../assets/icons/dm-customer.png";
import warehouseIcon from "../assets/icons/warehouse.png";
import inventoryIcon from "../assets/icons/dm-inventory.png";
import serialIcon from "../assets/icons/dm-serial.png";
import overviewIcon from "../assets/icons/overview.png";
import profileIcon from "../assets/icons/profile.png";
import permissionsIcon from "../assets/icons/permissions.png";
import bhMenuIcon from "../assets/icons/bh-menu.png";
import quoteIcon from "../assets/icons/bh-quote.png";
import ticketIcon from "../assets/icons/bh-ticket.png";
import warrantyWhIcon from "../assets/icons/bh-warehouse.png";
import receiptIcon from "../assets/icons/bh-receipt.png";
import invoiceIcon from "../assets/icons/bh-invoice.png";
import lookupIcon from "../assets/icons/bh-lookup.png";
import promoIcon from "../assets/icons/bh-promo.png";

function formatTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function NavPng({ src, alt = "" }: { src: string; alt?: string }) {
  return <img className="nav-png" src={src} alt={alt} />;
}

function IconBell() {
  return (
    <svg className="nav-line" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2.2 2.2 0 0 0 2.2-2H9.8A2.2 2.2 0 0 0 12 22zm7-6V11a7 7 0 1 0-14 0v5L3 18v1h18v-1z" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="nav-line" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function NavItem({
  active,
  title,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      className={`nav-item${active ? " active" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const catalogActive = path.startsWith("/products") || path.startsWith("/labors") || path.startsWith("/customers");
  const warehouseActive = path.startsWith("/stock-outs") || path.startsWith("/inventory");
  const warrantyActive = path.startsWith("/warranty");
  const serialActive = path.startsWith("/serials");

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 960 : false));
  const [catalogOpen, setCatalogOpen] = useState(() => catalogActive);
  const [warehouseOpen, setWarehouseOpen] = useState(() => warehouseActive);
  const [warrantyOpen, setWarrantyOpen] = useState(() => warrantyActive);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotices, setShowNotices] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (catalogActive) setCatalogOpen(true);
    if (warehouseActive) setWarehouseOpen(true);
    if (warrantyActive) setWarrantyOpen(true);
  }, [catalogActive, warehouseActive, warrantyActive]);

  useEffect(() => {
    if (!showNotices) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!noticeRef.current?.contains(event.target as Node)) setShowNotices(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showNotices]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authApi.notifications();
        const items = data.items || [];
        setNotifications(items);
        const lastRead = Number(localStorage.getItem("notif-last-read") || 0);
        setUnreadCount(items.filter((item) => new Date(item.createdAt).getTime() > lastRead).length);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    void load();
  }, []);

  const go = (to: string) => {
    navigate(to);
    if (isMobile) setMenuOpen(false);
  };

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMenuOpen((value) => !value);
      return;
    }
    setCollapsed((value) => {
      const next = !value;
      if (next) {
        setCatalogOpen(false);
        setWarehouseOpen(false);
        setWarrantyOpen(false);
      } else {
        setCatalogOpen(true);
        setWarehouseOpen(true);
        setWarrantyOpen(true);
      }
      return next;
    });
  };

  const toggleNotices = async () => {
    const next = !showNotices;
    setShowNotices(next);
    if (next) {
      try {
        const data = await authApi.notifications();
        const items = data.items || [];
        setNotifications(items);
        localStorage.setItem("notif-last-read", String(Date.now()));
        setUnreadCount(0);
      } catch {
        setUnreadCount(0);
      }
    }
  };

  const initial = (user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <div className={`app-shell ${!isMobile && collapsed ? "collapsed" : ""} ${menuOpen ? "menu-open" : ""}`}>
      {menuOpen && <button type="button" className="menu-backdrop" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}

      <aside className="sidebar">
        <button type="button" className="sidebar-avatar" title={user?.username} onClick={() => go("/profile")}>
          <span className="avatar-mini sidebar-avt" style={user?.avatar ? { backgroundImage: `url(${user.avatar})` } : undefined}>
            {!user?.avatar && initial}
          </span>
          <div className="brand-text">
            <strong>{user?.username}</strong>
            <small>{user ? ROLE_LABELS[user.role as Role] || user.role : ""}</small>
          </div>
        </button>

        <nav>
          <NavItem active={path === "/"} title="Tổng quan" onClick={() => go("/")}>
            <NavPng src={overviewIcon} />
            <span>Tổng quan</span>
          </NavItem>
          <NavItem active={path === "/profile"} title="Hồ sơ" onClick={() => go("/profile")}>
            <NavPng src={profileIcon} />
            <span>Hồ sơ</span>
          </NavItem>
          {user?.role === "admin" && (
            <NavItem active={path === "/permissions"} title="Phân quyền" onClick={() => go("/permissions")}>
              <NavPng src={permissionsIcon} />
              <span>Phân quyền</span>
            </NavItem>
          )}

          {canAccessCatalog(user) && (
            <div className={`nav-group ${catalogOpen ? "open" : ""} ${catalogActive ? "current" : ""}`}>
              <button
                type="button"
                className="nav-group-btn"
                title="Danh mục"
                aria-expanded={catalogOpen}
                onClick={() => setCatalogOpen((value) => !value)}
              >
                <NavPng src={catalogIcon} />
                <span>1. Danh mục</span>
                <i className="chevron" aria-hidden="true" />
              </button>
              {catalogOpen && (
                <div className="nav-sub">
                  <NavItem active={path === "/products"} title="Danh mục sản phẩm" onClick={() => go("/products")}>
                    <NavPng src={productIcon} />
                    <span>Danh mục sản phẩm</span>
                  </NavItem>
                  <NavItem active={path === "/labors"} title="Danh mục tiền công" onClick={() => go("/labors")}>
                    <NavPng src={laborIcon} />
                    <span>Danh mục tiền công</span>
                  </NavItem>
                  <NavItem active={path === "/customers"} title="Danh mục khách hàng" onClick={() => go("/customers")}>
                    <NavPng src={customerIcon} />
                    <span>Danh mục khách hàng</span>
                  </NavItem>
                </div>
              )}
            </div>
          )}

          {canAccessWarehouse(user) && (
            <div className={`nav-group ${warehouseOpen ? "open" : ""} ${warehouseActive ? "current" : ""}`}>
              <button
                type="button"
                className="nav-group-btn"
                title="Kho"
                aria-expanded={warehouseOpen}
                onClick={() => setWarehouseOpen((value) => !value)}
              >
                <NavPng src={warehouseIcon} />
                <span>2. Kho</span>
                <i className="chevron" aria-hidden="true" />
              </button>
              {warehouseOpen && (
                <div className="nav-sub">
                  <NavItem active={path === "/stock-outs"} title="Phiếu xuất kho" onClick={() => go("/stock-outs")}>
                    <NavPng src={warehouseIcon} />
                    <span>Phiếu xuất kho</span>
                  </NavItem>
                  <NavItem active={path === "/inventory"} title="Tồn kho sản phẩm" onClick={() => go("/inventory")}>
                    <NavPng src={inventoryIcon} />
                    <span>Tồn kho sản phẩm</span>
                  </NavItem>
                </div>
              )}
            </div>
          )}

          {canUseSerial(user) && (
            <NavItem active={serialActive} title="Tạo số Serial" className="nav-leaf" onClick={() => go("/serials")}>
              <NavPng src={serialIcon} />
              <span>3. Tạo số Serial</span>
            </NavItem>
          )}

          {canAccessWarranty(user) && (
            <div className={`nav-group ${warrantyOpen ? "open" : ""} ${warrantyActive ? "current" : ""}`}>
              <button
                type="button"
                className="nav-group-btn"
                title="Bảo hành"
                aria-expanded={warrantyOpen}
                onClick={() => setWarrantyOpen((value) => !value)}
              >
                <NavPng src={bhMenuIcon} />
                <span>4. Bảo hành</span>
                <i className="chevron" aria-hidden="true" />
              </button>
              {warrantyOpen && (
                <div className="nav-sub">
                  {canWriteWarranty(user) && (
                    <>
                      <NavItem active={path === "/warranty/quotes"} title="Báo giá BH" onClick={() => go("/warranty/quotes")}>
                        <NavPng src={quoteIcon} />
                        <span>Báo giá BH</span>
                      </NavItem>
                      <NavItem active={path === "/warranty/tickets"} title="Phiếu bảo hành" onClick={() => go("/warranty/tickets")}>
                        <NavPng src={ticketIcon} />
                        <span>Phiếu bảo hành</span>
                      </NavItem>
                      <NavItem active={path === "/warranty/warehouse"} title="Kho bảo hành" onClick={() => go("/warranty/warehouse")}>
                        <NavPng src={warrantyWhIcon} />
                        <span>Kho bảo hành</span>
                      </NavItem>
                      <NavItem active={path === "/warranty/receipts"} title="Thu tiền BH" onClick={() => go("/warranty/receipts")}>
                        <NavPng src={receiptIcon} />
                        <span>Thu tiền BH</span>
                      </NavItem>
                      <NavItem active={path === "/warranty/invoices"} title="Hóa đơn BH" onClick={() => go("/warranty/invoices")}>
                        <NavPng src={invoiceIcon} />
                        <span>Hóa đơn BH</span>
                      </NavItem>
                      <NavItem active={path === "/warranty/promotions"} title="Khuyến mãi BH" onClick={() => go("/warranty/promotions")}>
                        <NavPng src={promoIcon} />
                        <span>Khuyến mãi BH</span>
                      </NavItem>
                    </>
                  )}
                  <NavItem active={path === "/warranty/lookup"} title="Tra cứu serial" onClick={() => go("/warranty/lookup")}>
                    <NavPng src={lookupIcon} />
                    <span>Tra cứu serial</span>
                  </NavItem>
                  <NavItem active={path === "/warranty/serial-report"} title="Báo cáo serial" onClick={() => go("/warranty/serial-report")}>
                    <NavPng src={serialIcon} />
                    <span>Báo cáo serial</span>
                  </NavItem>
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="ghost menu-toggle" onClick={toggleSidebar} title={collapsed ? "Mở menu" : "Thu menu"}>
              <IconMenu />
              <span>{isMobile ? "Menu" : collapsed ? "Mở" : "Thu"}</span>
            </button>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
            <div className="notify-wrap" ref={noticeRef}>
              <button
                type="button"
                className={`notify-btn ${showNotices ? "active" : ""}`}
                title="Thông báo"
                onClick={() => void toggleNotices()}
              >
                <IconBell />
                {unreadCount > 0 && <em>{unreadCount}</em>}
              </button>
              {showNotices && (
                <div className="notify-box">
                  <div className="notify-head">
                    <strong>Thông báo</strong>
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  </div>
                  <div className="notify-list">
                    {notifications.length === 0 && <p className="muted">Chưa có hoạt động</p>}
                    {notifications.slice(0, 12).map((item) => (
                      <article key={item.id} className="notify-item">
                        <p>{item.message}</p>
                        <small>{formatTime(item.createdAt)}</small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="ghost" onClick={onLogout}>
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="content">
          <div key={path} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
