import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
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
        <h1>Tạo tài khoản làm việc</h1>
        <p>Tài khoản đầu tiên trong hệ thống sẽ được gán quyền Quản trị viên.</p>
        <ul className="login-points">
          <li>Phân quyền theo vai trò</li>
          <li>Theo dõi kho & bảo hành</li>
          <li>Import Excel danh mục nhanh</li>
        </ul>
      </aside>

      <div className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <header className="login-head">
            <strong>Bắt đầu</strong>
            <h1>Đăng ký</h1>
            <p>Điền thông tin để tạo tài khoản mới</p>
          </header>
          {error && <div className="alert">{error}</div>}
          <label>
            Tên đăng nhập
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Mật khẩu
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Đang xử lý..." : "Tạo tài khoản"}
          </button>
          <p className="muted center">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
