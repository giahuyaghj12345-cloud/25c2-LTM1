import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, type User } from "./api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authApi.profile();
      setUser(profile);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const result = await authApi.login(email, password);
        localStorage.setItem("token", result.token);
        setUser(result.user);
      },
      register: async (username, email, password) => {
        const result = await authApi.register(username, email, password);
        localStorage.setItem("token", result.token);
        setUser(result.user);
      },
      logout: () => {
        const token = localStorage.getItem("token");
        if (token) {
          void fetch("/api/catalog/serials/lock", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
            keepalive: true,
          });
        }
        localStorage.removeItem("token");
        setUser(null);
      },
      refresh,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
