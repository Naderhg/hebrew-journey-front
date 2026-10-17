const isBrowserOnHttps =
  typeof window !== "undefined" && window.location.protocol === "https:";

const API_URL = isBrowserOnHttps
  ? ""
  : (import.meta.env["VITE_API_URL"] ?? "http://162.35.184.86");
const STORAGE_SERVER_URL = isBrowserOnHttps
  ? "/storage"
  : (import.meta.env["VITE_STORAGE_SERVER_URL"] ?? "http://209.159.159.106");
const VPS_SERVER_URL = import.meta.env["VITE_VPS_SERVER_URL"] ?? "http://162.35.184.86";

export const SERVER_CONFIG = {
  apiBaseUrl: API_URL,
  storageServerIp: "209.159.159.106",
  storageServerUrl: STORAGE_SERVER_URL,
  vpsServerIp: "162.35.184.86",
  vpsServerUrl: VPS_SERVER_URL,
} as const;

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("ohran_access_token", token);
  } else {
    localStorage.removeItem("ohran_access_token");
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem("ohran_access_token");
  }
  return accessToken;
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : null,
    credentials: "include",
  });

  if (res.status === 401 && !options.skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${API_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
        credentials: "include",
      });
    }
  }

  if (!res.ok) {
    let error: { error?: string; message?: string };
    try {
      error = await res.json();
    } catch {
      error = { error: `HTTP ${res.status}` };
    }
    throw new Error(error.error ?? error.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { API_URL };

const STORAGE_HOST_PREFIX = "http://209.159.159.106";

export function mediaSrc(url: string): string {
  if (!url) return url;
  if (isBrowserOnHttps && url.startsWith(STORAGE_HOST_PREFIX)) {
    return `/storage${url.slice(STORAGE_HOST_PREFIX.length)}`;
  }
  return url;
}

export async function uploadFile(
  file: Blob,
  uploadType: "audio" | "courses" | "avatars" | "reports" | "videos" | "payments",
): Promise<{ url: string; filename: string; size: number }> {
  const doUpload = () =>
    fetch(`${API_URL}/api/storage/upload?type=${uploadType}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: file,
      credentials: "include",
    });

  let res = await doUpload();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doUpload();
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.error ?? err.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  return res.json();
}
