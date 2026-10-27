import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import ThemeToggle from "../components/ThemeToggle";

const REMEMBER_KEY = "remember-account";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const savedAccount = localStorage.getItem(REMEMBER_KEY) || "";
  const [email, setEmail] = useState(savedAccount);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(Boolean(savedAccount));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="auth-toolbar">
        <ThemeToggle />
      </div>

      <aside className="login-brand">
        <div className="brand-mark">QL</div>
        <h1>Quản lý kho & bảo hành</h1>
        <p>Giao diện làm việc rõ ràng, thao tác nhanh cho danh mục, kho, serial và quy trình bảo hành.</p>
        <ul className="login-points">
          <li>Danh mục sản phẩm, khách hàng, tiền công</li>
          <li>Xuất kho & theo dõi tồn</li>
          <li>Phiếu bảo hành → thu tiền → hóa đơn</li>
        </ul>
      </aside>

      <div className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <header className="login-head">
            <strong>Xin chào</strong>
            <h1>Đăng nhập</h1>
            <p>Nhập tài khoản để tiếp tục làm việc</p>
          </header>
          {error && <div className="alert">{error}</div>}
          <label>
            Email hoặc tên đăng nhập
            <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Mật khẩu
            <span className="pw-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {showPassword ? (
                    <path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7-.6 1.4-1.5 2.6-2.6 3.6M6.1 6.1C4.2 7.4 2.7 9.1 2 12c1.1 2.4 3.2 4.4 5.7 5.6" />
                  ) : (
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                  )}
                </svg>
              </button>
            </span>
          </label>
          <label className="auth-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Ghi nhớ tài khoản
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Đang xử lý..." : "Đăng nhập"}
          </button>
          <p className="muted center">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
