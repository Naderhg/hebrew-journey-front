import { apiFetch, setAccessToken, getAccessToken } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  locale: string;
  avatarUrl?: string;
  isActive?: boolean;
  emailVerifiedAt?: string;
  createdAt?: string;
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: string;
  locale?: string;
}): Promise<{ user: AuthUser }> {
  const result = await apiFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: input,
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
