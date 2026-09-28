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
    <div className="auth-page">
      <div className="auth-toolbar">
        <ThemeToggle />
      </div>
      <form className="card auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">Hệ thống quản lý</p>
        <h1>Đăng ký tài khoản</h1>
        <p className="muted">Tài khoản đầu tiên sẽ được gán quyền Quản trị viên</p>
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
  );
}
