import { API_URL, apiFetch, getAccessToken } from "./api";

// ─── Realtime WebSocket client ───────────────────────────────────────────────
// Connects to ws(s)://<api-host>/ws?token=<accessToken> and fans events out
// to subscribers. Reconnects automatically; refreshes the token via a cheap
// authenticated request before each reconnect attempt.

type RealtimeHandler = (event: string, data: any) => void;

const handlers = new Set<RealtimeHandler>();
let ws: WebSocket | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let chatEventListeners = new Set<(e: ChatEventPayload) => void>();

export interface ChatEventPayload {
  channel: string;
  studentId: string;
  staffId: string | null;
  message: {
    id: string;
    studentId: string;
    staffId?: string | null;
    channel: string;
    fromRole: string;
    content: string;
    type?: string;
    mediaUrl?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    createdAt: string;
  };
}

export function onChatEvent(cb: (e: ChatEventPayload) => void): () => void {
  chatEventListeners.add(cb);
  return () => chatEventListeners.delete(cb);
}

function wsUrl(): string | null {
  const token = getAccessToken();
  if (!token || typeof window === "undefined") return null;
  let base: string;
  const explicitWs = import.meta.env["VITE_WS_URL"] as string | undefined;
  if (explicitWs) {
    base = explicitWs.replace(/^http/, "ws");
  } else if (API_URL) {
    base = API_URL.replace(/^http/, "ws");
  } else if (window.location.protocol === "https:") {
    // Same-origin WS doesn't work behind Vercel rewrites — hit the VPS SSL host directly.
    base = "wss://api.162.35.184.86.sslip.io";
  } else {
    base = `ws://${window.location.host}`;
  }
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

async function connect() {
  if (typeof window === "undefined") return;
  // Make sure the access token is fresh before connecting (apiFetch refreshes on 401)
  try {
    await apiFetch("/api/notifications");
  } catch {
    /* offline or logged out — still try with whatever token we have */
  }
  const url = wsUrl();
  if (!url) {
    scheduleReconnect();
    return;
  }
  try {
    ws = new WebSocket(url);
  } catch {
    scheduleReconnect();
    return;
  }
  ws.onmessage = (ev) => {
    try {
      const { event, data } = JSON.parse(ev.data as string);
      if (event === "chat:message" && data) {
        for (const cb of chatEventListeners) cb(data as ChatEventPayload);
      }
      for (const h of handlers) h(event, data);
    } catch {
      /* ignore malformed frames */
    }
  };
  ws.onclose = () => {
    ws = null;
    scheduleReconnect();
  };
  ws.onerror = () => {
    try {
      ws?.close();
    } catch {
      /* noop */
    }
  };
}

function scheduleReconnect() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, 15_000);
}

export function subscribeRealtime(handler: RealtimeHandler): () => void {
  handlers.add(handler);
  if (!ws && !retryTimer) void connect();
  return () => handlers.delete(handler);
}
