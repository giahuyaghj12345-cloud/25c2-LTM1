import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Permissions from "./pages/Permissions";
import Products from "./pages/Products";
import Labors from "./pages/Labors";
import Customers from "./pages/Customers";
import StockOuts from "./pages/StockOuts";
import Inventory from "./pages/Inventory";
import CreateSerial from "./pages/CreateSerial";
import WarrantyQuotes from "./pages/WarrantyQuotes";
import WarrantyTickets from "./pages/WarrantyTickets";
import WarrantyWarehouse from "./pages/WarrantyWarehouse";
import WarrantyReceipts from "./pages/WarrantyReceipts";
import WarrantyInvoices from "./pages/WarrantyInvoices";
import WarrantyLookup from "./pages/WarrantyLookup";
import WarrantySerialReport from "./pages/WarrantySerialReport";
import WarrantyPromotions from "./pages/WarrantyPromotions";
import { canAccessCatalog, canAccessWarehouse, canAccessWarranty, canUseSerial, canWriteWarranty } from "./api";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function SerialOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!canUseSerial(user)) return <Navigate to="/" replace />;
  return children;
}

function CatalogOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!canAccessCatalog(user)) return <Navigate to="/" replace />;
  return children;
}

function WarehouseOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!canAccessWarehouse(user)) return <Navigate to="/" replace />;
  return children;
}

function WarrantyOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!canAccessWarranty(user)) return <Navigate to="/" replace />;
  return children;
}

function WarrantyWriteOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!canWriteWarranty(user)) return <Navigate to="/warranty/lookup" replace />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page">Đang tải...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="materials" element={<Navigate to="/products" replace />} />
        <Route path="products" element={<CatalogOnly><Products /></CatalogOnly>} />
        <Route path="labors" element={<CatalogOnly><Labors /></CatalogOnly>} />
        <Route path="customers" element={<CatalogOnly><Customers /></CatalogOnly>} />
        <Route path="stock-outs" element={<WarehouseOnly><StockOuts /></WarehouseOnly>} />
        <Route path="inventory" element={<WarehouseOnly><Inventory /></WarehouseOnly>} />
        <Route
          path="serials"
          element={
            <SerialOnly>
              <CreateSerial />
            </SerialOnly>
          }
        />
        <Route path="warranty/quotes" element={<WarrantyWriteOnly><WarrantyQuotes /></WarrantyWriteOnly>} />
        <Route path="warranty/tickets" element={<WarrantyWriteOnly><WarrantyTickets /></WarrantyWriteOnly>} />
        <Route path="warranty/warehouse" element={<WarrantyWriteOnly><WarrantyWarehouse /></WarrantyWriteOnly>} />
        <Route path="warranty/receipts" element={<WarrantyWriteOnly><WarrantyReceipts /></WarrantyWriteOnly>} />
        <Route path="warranty/invoices" element={<WarrantyWriteOnly><WarrantyInvoices /></WarrantyWriteOnly>} />
        <Route path="warranty/lookup" element={<WarrantyOnly><WarrantyLookup /></WarrantyOnly>} />
        <Route path="warranty/serial-report" element={<WarrantyOnly><WarrantySerialReport /></WarrantyOnly>} />
        <Route path="warranty/promotions" element={<WarrantyWriteOnly><WarrantyPromotions /></WarrantyWriteOnly>} />
        <Route
          path="permissions"
          element={
            <AdminOnly>
              <Permissions />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
