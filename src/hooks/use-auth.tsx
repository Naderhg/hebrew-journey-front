import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type AuthUser, login as loginFn, register as registerFn, logout as logoutFn, getMe } from "../lib/auth";
import { getAccessToken } from "../lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    locale?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { user } = await loginFn({ email, password });
    setUser(user);
    return user;
  }

  async function register(input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    locale?: string;
  }) {
    const { user } = await registerFn(input);
    return user;
  }

  async function logout() {
    await logoutFn();
    setUser(null);
  }

  async function refreshUser() {
    const { user: fresh } = await getMe();
    setUser(fresh);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
