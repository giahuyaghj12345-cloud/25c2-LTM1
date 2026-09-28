import { useEffect, useState } from "react";
import { authApi, ROLE_LABELS, STATUS_LABELS, type Role, type User, type UserStatus } from "../api";
import { useAuth } from "../auth";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export default function Permissions() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setUsers(await authApi.users());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError("");
    setMessage("");
    try {
      const result = (await action()) as { message?: string };
      setMessage(result.message || "Thành công");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h1>Phân quyền</h1>
        <p className="muted">Quản trị viên đổi vai trò, cấp quyền tạo Serial, chặn hoặc xóa user.</p>
      </div>
      {error && <div className="alert">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email / SĐT</th>
              <th>Vai trò</th>
              <th>Tạo Serial</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <span
                        className="avatar-mini"
                        style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : undefined}
                      >
                        {!user.avatar && user.username.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        {user.username}
                        {isSelf ? " (bạn)" : ""}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>{user.email}</div>
                    <small className="muted">{user.phone || "Chưa có SĐT"}</small>
                  </td>
                  <td>
                    <select value={user.role} onChange={(e) => void run(() => authApi.updateRole(user.id, e.target.value as Role), "Cập nhật quyền thất bại")}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                    <td>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={Boolean(user.canCreateSerial)}
                          onChange={(e) => void run(() => authApi.updateSerialAccess(user.id, e.target.checked), "Cập nhật quyền Serial thất bại")}
                        />
                        Được tạo
                      </label>
                    </td>
                    <td>
                      <span className={`status-dot ${user.status}`}>{STATUS_LABELS[user.status]}</span>
                    </td>
                  <td>
                    <div className="row-actions">
                      {user.status !== "blocked" && (
                        <button type="button" className="ghost" disabled={isSelf} onClick={() => void run(() => authApi.updateStatus(user.id, "blocked" as UserStatus), "Chặn thất bại")}>
                          Chặn
                        </button>
                      )}
                      {user.status !== "suspended" && (
                        <button type="button" className="ghost" disabled={isSelf} onClick={() => void run(() => authApi.updateStatus(user.id, "suspended" as UserStatus), "Tạm ngừng thất bại")}>
                          Tạm ngừng
                        </button>
                      )}
                      {user.status !== "active" && (
                        <button type="button" className="ghost" disabled={isSelf} onClick={() => void run(() => authApi.updateStatus(user.id, "active" as UserStatus), "Mở lại thất bại")}>
                          Mở lại
                        </button>
                      )}
                      <button
                        type="button"
                        className="danger"
                        disabled={isSelf}
                        onClick={() => {
                          if (confirm(`Xóa tài khoản ${user.username}?`)) {
                            void run(() => authApi.deleteUser(user.id), "Xóa thất bại");
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
