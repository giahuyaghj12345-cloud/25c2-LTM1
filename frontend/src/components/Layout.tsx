import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { ROLE_LABELS, authApi, canUseSerial, type AppNotification } from "../api";
import ThemeToggle from "./ThemeToggle";
import catalogIcon from "../assets/icons/catalog.png";
import productIcon from "../assets/icons/dm-product.png";
import laborIcon from "../assets/icons/dm-labor.png";
import warehouseIcon from "../assets/icons/warehouse.png";
import inventoryIcon from "../assets/icons/dm-inventory.png";
import serialIcon from "../assets/icons/dm-serial.png";
import warrantyIcon from "../assets/icons/bh-menu.png";
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

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.2 2.8 8 7 9 4.2-1 7-4.8 7-9V6z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2.2 2.2 0 0 0 2.2-2H9.8A2.2 2.2 0 0 0 12 22zm7-6V11a7 7 0 1 0-14 0v5L3 18v1h18v-1z" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const catalogActive = location.pathname.startsWith("/products") || location.pathname.startsWith("/labors") || location.pathname.startsWith("/customers");
  const warehouseActive = location.pathname.startsWith("/stock-outs") || location.pathname.startsWith("/inventory");
  const warrantyActive = location.pathname.startsWith("/warranty");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "1");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 960 : false));
  const [catalogOpen, setCatalogOpen] = useState(() => catalogActive && localStorage.getItem("sidebar-collapsed") !== "1");
  const [warehouseOpen, setWarehouseOpen] = useState(() => warehouseActive && localStorage.getItem("sidebar-collapsed") !== "1");
  const [warrantyOpen, setWarrantyOpen] = useState(() => warrantyActive && localStorage.getItem("sidebar-collapsed") !== "1");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotices, setShowNotices] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const warehouseRef = useRef<HTMLDivElement>(null);
  const warrantyRef = useRef<HTMLDivElement>(null);
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
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (collapsed && !isMobile) {
      setCatalogOpen(false);
      setWarehouseOpen(false);
      setWarrantyOpen(false);
    } else {
      if (catalogActive) setCatalogOpen(true);
      if (warehouseActive) setWarehouseOpen(true);
      if (warrantyActive) setWarrantyOpen(true);
    }
  }, [collapsed, isMobile, location.pathname]);

  useEffect(() => {
    if ((!catalogOpen && !warehouseOpen && !warrantyOpen) || !collapsed) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (catalogOpen && !catalogRef.current?.contains(target)) setCatalogOpen(false);
      if (warehouseOpen && !warehouseRef.current?.contains(target)) setWarehouseOpen(false);
      if (warrantyOpen && !warrantyRef.current?.contains(target)) setWarrantyOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [catalogOpen, warehouseOpen, warrantyOpen, collapsed]);

  useEffect(() => {
    if (!showNotices) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!noticeRef.current?.contains(event.target as Node)) setShowNotices(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showNotices]);

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
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

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
  const railClosed = isMobile ? !menuOpen : collapsed;

  return (
    <div className={`app-shell ${!isMobile && collapsed ? "collapsed" : ""} ${menuOpen ? "menu-open" : ""}`}>
      {menuOpen && <button type="button" className="menu-backdrop" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
      <div className="sidebar-wrap">
      <aside className="sidebar">
        <NavLink to="/profile" className="sidebar-avatar" title={user?.username} onClick={() => isMobile && setMenuOpen(false)}>
          <span className="avatar-mini sidebar-avt" style={user?.avatar ? { backgroundImage: `url(${user.avatar})` } : undefined}>
            {!user?.avatar && initial}
          </span>
          <div className="brand-text">
            <strong>{user?.username}</strong>
            <small>{user ? ROLE_LABELS[user.role] : ""}</small>
          </div>
        </NavLink>
        <nav>
          <NavLink to="/" end title="Tổng quan" onClick={() => isMobile && setMenuOpen(false)}>
            <IconHome />
            <span>Tổng quan</span>
          </NavLink>
          <NavLink to="/profile" title="Hồ sơ" onClick={() => isMobile && setMenuOpen(false)}>
            <IconUser />
            <span>Hồ sơ</span>
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/permissions" title="Phân quyền" onClick={() => isMobile && setMenuOpen(false)}>
              <IconShield />
              <span>Phân quyền</span>
            </NavLink>
          )}
          <div ref={catalogRef} className={`nav-group ${catalogOpen ? "open" : ""} ${catalogActive ? "current" : ""}`}>
            <button
              type="button"
              className="nav-group-btn"
              title="Danh mục"
              onClick={() => setCatalogOpen((value) => !value)}
            >
              <img className="nav-png" src={catalogIcon} alt="" />
              <span>1. Danh mục</span>
              <i className="chevron" aria-hidden="true" />
            </button>
            {catalogOpen && (
              <div className="nav-sub">
                <NavLink to="/products" title="Danh mục sản phẩm" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setCatalogOpen(false))}>
                  <img className="nav-png" src={productIcon} alt="" />
                  <span>Danh mục sản phẩm</span>
                </NavLink>
                <NavLink to="/labors" title="Danh mục tiền công" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setCatalogOpen(false))}>
                  <img className="nav-png" src={laborIcon} alt="" />
                  <span>Danh mục tiền công</span>
                </NavLink>
                <NavLink to="/customers" title="Danh mục khách hàng" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setCatalogOpen(false))}>
                  <IconUser />
                  <span>Danh mục khách hàng</span>
                </NavLink>
              </div>
            )}
          </div>
          <div ref={warehouseRef} className={`nav-group ${warehouseOpen ? "open" : ""} ${warehouseActive ? "current" : ""}`}>
            <button
              type="button"
              className="nav-group-btn"
              title="Kho"
              onClick={() => setWarehouseOpen((value) => !value)}
            >
              <img className="nav-png" src={warehouseIcon} alt="" />
              <span>2. Kho</span>
              <i className="chevron" aria-hidden="true" />
            </button>
            {warehouseOpen && (
              <div className="nav-sub">
                <NavLink to="/stock-outs" title="Phiếu xuất kho" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarehouseOpen(false))}>
                  <img className="nav-png" src={warehouseIcon} alt="" />
                  <span>Phiếu xuất kho</span>
                </NavLink>
                <NavLink to="/inventory" title="Tồn kho sản phẩm" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarehouseOpen(false))}>
                  <img className="nav-png" src={inventoryIcon} alt="" />
                  <span>Tồn kho sản phẩm</span>
                </NavLink>
              </div>
            )}
          </div>
          {canUseSerial(user) && (
            <NavLink to="/serials" title="Tạo số Serial" onClick={() => isMobile && setMenuOpen(false)}>
              <img className="nav-png" src={serialIcon} alt="" />
              <span>3. Tạo số Serial</span>
            </NavLink>
          )}
          <div ref={warrantyRef} className={`nav-group ${warrantyOpen ? "open" : ""} ${warrantyActive ? "current" : ""}`}>
            <button type="button" className="nav-group-btn" title="Bảo hành" onClick={() => setWarrantyOpen((value) => !value)}>
              <img className="nav-png" src={warrantyIcon} alt="" />
              <span>4. Bảo hành</span>
              <i className="chevron" aria-hidden="true" />
            </button>
            {warrantyOpen && (
              <div className="nav-sub">
                <NavLink to="/warranty/quotes" title="Báo giá BH" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={quoteIcon} alt="" /><span>Báo giá BH</span></NavLink>
                <NavLink to="/warranty/tickets" title="Phiếu bảo hành" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={ticketIcon} alt="" /><span>Phiếu bảo hành</span></NavLink>
                <NavLink to="/warranty/warehouse" title="Kho bảo hành" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={warrantyWhIcon} alt="" /><span>Kho bảo hành</span></NavLink>
                <NavLink to="/warranty/receipts" title="Thu phụ tùng BH" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={receiptIcon} alt="" /><span>Thu tiền BH</span></NavLink>
                <NavLink to="/warranty/invoices" title="Hóa đơn BH" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={invoiceIcon} alt="" /><span>Hóa đơn BH</span></NavLink>
                <NavLink to="/warranty/lookup" title="Tra cứu serial" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={lookupIcon} alt="" /><span>Tra cứu serial</span></NavLink>
                <NavLink to="/warranty/promotions" title="Khuyến mãi BH" onClick={() => (isMobile ? setMenuOpen(false) : collapsed && setWarrantyOpen(false))}><img className="nav-png" src={promoIcon} alt="" /><span>Khuyến mãi BH</span></NavLink>
              </div>
            )}
          </div>
        </nav>
      </aside>
      <div className="sidebar-hot">
        <button
          type="button"
          className="sidebar-edge"
          onClick={toggleSidebar}
          aria-label={railClosed ? "Mở menu" : "Đóng menu"}
          title={railClosed ? "Mở menu" : "Đóng menu"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={railClosed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
          </svg>
        </button>
      </div>
      </div>
      <div className="main">
        <header className="topbar">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
