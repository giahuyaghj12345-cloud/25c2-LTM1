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
import WarrantyPromotions from "./pages/WarrantyPromotions";
import { canUseSerial } from "./api";

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
        <Route path="products" element={<Products />} />
        <Route path="labors" element={<Labors />} />
        <Route path="customers" element={<Customers />} />
        <Route path="stock-outs" element={<StockOuts />} />
        <Route path="inventory" element={<Inventory />} />
        <Route
          path="serials"
          element={
            <SerialOnly>
              <CreateSerial />
            </SerialOnly>
          }
        />
        <Route path="warranty/quotes" element={<WarrantyQuotes />} />
        <Route path="warranty/tickets" element={<WarrantyTickets />} />
        <Route path="warranty/warehouse" element={<WarrantyWarehouse />} />
        <Route path="warranty/receipts" element={<WarrantyReceipts />} />
        <Route path="warranty/invoices" element={<WarrantyInvoices />} />
        <Route path="warranty/lookup" element={<WarrantyLookup />} />
        <Route path="warranty/promotions" element={<WarrantyPromotions />} />
        <Route
          path="permissions"
          element={
            <AdminOnly>
              <Permissions />
            </AdminOnly>
          }
        />
      </Route>
    </Routes>
  );
}
