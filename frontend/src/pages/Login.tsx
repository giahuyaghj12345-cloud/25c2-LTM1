import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-toolbar">
        <ThemeToggle />
      </div>
      <form className="card auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">Hệ thống quản lý</p>
        <h1>Đăng nhập</h1>
        <p className="muted">Xuất kho, serial và vòng đời bảo hành sản phẩm</p>
        {error && <div className="alert">{error}</div>}
        <label>
          Email hoặc tên đăng nhập
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mật khẩu
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        <p className="muted center">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </div>
  );
}
