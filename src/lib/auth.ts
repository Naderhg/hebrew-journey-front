import { apiFetch, setAccessToken, getAccessToken, setRefreshToken, getRefreshToken } from "./api";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "SALES" | "SUPPORT";

export interface AuthUser {
  id: string;
  email?: string | null;
  fullName: string;
  phone?: string;
  role: UserRole;
  locale: string;
  avatarUrl?: string;
  bio?: string | null;
  specialty?: string | null;
  isActive?: boolean;
  emailVerifiedAt?: string;
  createdAt?: string;
  // student onboarding/billing gates
  level?: string | null;
  placementCompletedAt?: string | null;
  hasActiveSubscription?: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "طالب",
  TEACHER: "مدرس",
  ADMIN: "أدمن",
  SALES: "سيلز",
  SUPPORT: "خدمة عملاء",
};

export function getHomeRouteForRole(role?: string): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "SALES":
      return "/sales";
    case "SUPPORT":
      return "/support";
    case "STUDENT":
    default:
      return "/dashboard";
  }
}

const DEVICE_KEY = "ohran_device_id";

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const m = document.cookie.match(/(?:^|;\s*)ohran_device_id=([^;]+)/);
      if (m?.[1]) id = decodeURIComponent(m[1]);
    }
    if (!id) {
      const rand = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
        : Math.random().toString(36).slice(2, 14).toUpperCase();
      id = `DEV-${rand}`;
    }
    localStorage.setItem(DEVICE_KEY, id);
    document.cookie = `${DEVICE_KEY}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365 * 5}; SameSite=Lax`;
    return id;
  } catch {
    return "unknown";
  }
}

export async function register(input: {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  locale?: string;
}): Promise<{ user: AuthUser }> {
  const result = await apiFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: { ...input, role: "STUDENT", deviceId: getDeviceId() },
    skipAuth: true,
  });
  return result;
}

export async function login(input: {
  identifier: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string }> {
  const result = await apiFetch<{ user: AuthUser; accessToken: string; refreshToken: string }>("/api/auth/login", {
    method: "POST",
    body: { ...input, deviceId: getDeviceId() },
    skipAuth: true,
  });
  setAccessToken(result.accessToken);
  setRefreshToken(result.refreshToken);
  return result;
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", {
    method: "POST",
    body: { refreshToken: getRefreshToken() },
  }).catch(() => {});
  setAccessToken(null);
  setRefreshToken(null);
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/api/auth/me");
}

export async function updateProfile(input: {
  fullName?: string;
  phone?: string;
  locale?: string;
  avatarUrl?: string;
  bio?: string;
}): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: input,
  });
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
