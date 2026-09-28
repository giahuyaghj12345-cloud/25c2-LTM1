import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { authApi, ROLE_LABELS } from "../api";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [cccd, setCccd] = useState(user?.cccd || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(user?.avatar || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
      form.append("phone", phone);
      form.append("address", address);
      form.append("cccd", cccd);
      if (currentPassword) form.append("currentPassword", currentPassword);
      if (newPassword) form.append("newPassword", newPassword);
      if (avatarFile) form.append("avatar", avatarFile);

      const result = await authApi.updateProfile(form);
      setMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setAvatarFile(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <section>
      <div className="page-head">
        <h1>Hồ sơ người dùng</h1>
        <p className="muted">Cập nhật ảnh đại diện, thông tin cá nhân và mật khẩu</p>
      </div>
      <form className="card form-grid profile-form" onSubmit={onSubmit}>
        {error && <div className="alert">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <div className="avatar-field">
          <div className="avatar-preview" style={preview ? { backgroundImage: `url(${preview})` } : undefined}>
            {!preview && username.slice(0, 1).toUpperCase()}
          </div>
          <label>
            Ảnh đại diện
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setAvatarFile(file);
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>
        <label>
          Tên đăng nhập
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Số điện thoại
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." />
        </label>
        <label>
          CCCD
          <input value={cccd} onChange={(e) => setCccd(e.target.value)} placeholder="Số căn cước" />
        </label>
        <label className="full">
          Địa chỉ
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, tỉnh/thành" />
        </label>
        <label>
          Vai trò
          <input value={ROLE_LABELS[user.role]} disabled />
        </label>
        <label>
          Mật khẩu hiện tại
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </label>
        <label>
          Mật khẩu mới
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}
