import { apiFetch, setAccessToken, getAccessToken } from "./api";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "SALES" | "SUPPORT";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  locale: string;
  avatarUrl?: string;
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

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  locale?: string;
}): Promise<{ user: AuthUser }> {
  const result = await apiFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: { ...input, role: "STUDENT" },
    skipAuth: true,
  });
  return result;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string }> {
  const result = await apiFetch<{ user: AuthUser; accessToken: string }>("/api/auth/login", {
    method: "POST",
    body: input,
    skipAuth: true,
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
  setAccessToken(null);
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/api/auth/me");
}

export async function updateProfile(input: {
  fullName?: string;
  phone?: string;
  locale?: string;
  avatarUrl?: string;
}): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/api/auth/me", {
    method: "PATCH",
    body: input,
  });
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
