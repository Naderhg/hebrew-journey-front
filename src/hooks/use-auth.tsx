import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type AuthUser, login as loginFn, register as registerFn, logout as logoutFn, getMe, updateProfile as updateProfileFn } from "../lib/auth";
import { getAccessToken } from "../lib/api";
import {
  DEMO_STUDENT_EMAIL,
  DEMO_STUDENT_PASSWORD,
  DEMO_STUDENT_USER,
} from "../data/demo-student";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (input: {
    phone: string;
    password: string;
    fullName: string;
    email?: string;
    locale?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (input: { fullName?: string; phone?: string; locale?: string; avatarUrl?: string; bio?: string }) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wantsLocalPreview =
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get("dev-preview") === "1";
    if (wantsLocalPreview) {
      setUser(DEMO_STUDENT_USER);
      setLoading(false);
      return;
    }

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

  async function login(identifier: string, password: string) {
    if (
      import.meta.env.DEV &&
      identifier.trim().toLowerCase() === DEMO_STUDENT_EMAIL &&
      password === DEMO_STUDENT_PASSWORD
    ) {
      setUser(DEMO_STUDENT_USER);
      return DEMO_STUDENT_USER;
    }

    const { user } = await loginFn({ identifier, password });
    setUser(user);
    return user;
  }

  async function register(input: {
    phone: string;
    password: string;
    fullName: string;
    email?: string;
    locale?: string;
  }) {
    const { user } = await registerFn(input);
    return user;
  }

  async function logout() {
    if (user?.isDemo) {
      setUser(null);
      return;
    }
    await logoutFn();
    setUser(null);
  }

  async function refreshUser() {
    if (user?.isDemo) return;
    const { user: fresh } = await getMe();
    setUser(fresh);
  }

  async function updateProfile(input: { fullName?: string; phone?: string; locale?: string; avatarUrl?: string; bio?: string }) {
    const { user: updatedUser } = await updateProfileFn(input);
    setUser(updatedUser);
    return updatedUser;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
