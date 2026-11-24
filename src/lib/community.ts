import { apiFetch } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────
export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "helpful";

export interface CommunityAuthor {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  learningLanguage?: string | null;
  communityPoints?: number;
}

export interface ReactionSummary {
  total: number;
  byType: Partial<Record<ReactionType, number>>;
}

export interface PollView {
  question: string;
  multi: boolean;
  options: { text: string; image: string | null; votes: number }[];
  total: number;
  myVote: number | null;
  myVotes: number[];
}

export interface SharedPostRef {
  id: string;
  author: CommunityAuthor;
  content: string;
  images: string[];
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  author: CommunityAuthor;
  content: string;
  images: string[];
  fileUrl: string | null;
  fileName: string | null;
  poll: PollView | null;
  isPinned: boolean;
  kind: "post" | "announcement" | "challenge";
  sharedPost: SharedPostRef | null;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
  sharesCount: number;
  reactions: ReactionSummary;
  myReaction: ReactionType | null;
  saved: boolean;
}

export interface StoryViewer {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
  viewedAt: string;
}

export interface CommunityStory {
  id: string;
  author: CommunityAuthor;
  mediaUrl: string;
  caption: string | null;
  createdAt: string;
  expiresAt: string;
  viewCount?: number;
  viewers?: StoryViewer[];
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId: string | null;
  author: CommunityAuthor;
  content: string;
  isWinner?: boolean;
  createdAt: string;
  updatedAt: string;
  reactions: ReactionSummary;
  myReaction: ReactionType | null;
  replies?: CommunityComment[];
}

export interface CommunityAccess {
  visible: boolean;
  postsEnabled: boolean;
  chatEnabled: boolean;
  canModerate: boolean;
  muted: boolean;
}

export interface CommunityMessage {
  id: string;
  author: CommunityAuthor;
  content: string;
  type: "text" | "voice" | "file" | "image";
  mediaUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  replyTo: { id: string; content: string; type: string; fileName: string | null; author: CommunityAuthor } | null;
  isPinned: boolean;
  createdAt: string;
  reactions: { byEmoji: Record<string, number>; total: number };
  myReaction: string | null;
}

export interface CommunityMember {
  id: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  learningLanguage: string | null;
  level: string | null;
  createdAt: string;
  points?: number;
  stats: { posts: number; comments: number; reactions: number };
}

export interface CommunitySidebar {
  trending: { id: string; snippet: string; author: string; reactions: number; comments: number }[];
  tags: { tag: string; count: number }[];
  online: { id: string; fullName: string; role: string; avatarUrl?: string | null }[];
  onlineCount: number;
  topContributors?: { id: string; fullName: string; role: string; avatarUrl?: string | null; communityPoints: number }[];
}

export interface CommunitySettingsView {
  visibleRoles: string[];
  postsEnabled: boolean;
  chatEnabled: boolean;
  bannedWords: string[];
}

export interface CommunityReportView {
  id: string;
  reason: string;
  createdAt: string;
  reporter: CommunityAuthor;
  target: { kind: "post" | "comment"; id: string; postId: string; content: string; author: CommunityAuthor } | null;
}

export interface FeedQuery {
  cursor?: string | null;
  tag?: string;
  authorId?: string;
  roles?: string[];
  saved?: boolean;
}

// ─── API ─────────────────────────────────────────────────────────────────────
const B = "/api/community";

export const communityApi = {
  access: () => apiFetch<CommunityAccess>(`${B}/access`),
  feed: (q: FeedQuery) => {
    const p = new URLSearchParams();
    if (q.cursor) p.set("cursor", q.cursor);
    if (q.tag) p.set("tag", q.tag);
    if (q.authorId) p.set("authorId", q.authorId);
    if (q.roles?.length) p.set("roles", q.roles.join(","));
    if (q.saved) p.set("saved", "1");
    return apiFetch<{ posts: CommunityPost[]; nextCursor: string | null }>(`${B}/feed?${p.toString()}`);
  },
  post: (id: string) => apiFetch<{ post: CommunityPost }>(`${B}/posts/${id}`),
  createPost: (body: {
    content: string;
    images?: string[];
    fileUrl?: string;
    fileName?: string;
    kind?: "post" | "announcement" | "challenge";
    poll?: { question: string; multi?: boolean; options: (string | { text: string; image?: string })[] };
  }) => apiFetch<{ post: CommunityPost }>(`${B}/posts`, { method: "POST", body }),
  editPost: (id: string, content: string) => apiFetch<{ post: CommunityPost }>(`${B}/posts/${id}`, { method: "PATCH", body: { content } }),
  deletePost: (id: string) => apiFetch<void>(`${B}/posts/${id}`, { method: "DELETE" }),
  pinPost: (id: string) => apiFetch<{ isPinned: boolean }>(`${B}/posts/${id}/pin`, { method: "POST" }),
  reactPost: (id: string, type: ReactionType | null) =>
    apiFetch<{ myReaction: ReactionType | null }>(`${B}/posts/${id}/react`, { method: "POST", body: { type } }),
  postReactions: (id: string) =>
    apiFetch<{ reactions: { type: ReactionType; user: CommunityAuthor }[] }>(`${B}/posts/${id}/reactions`),
  savePost: (id: string) => apiFetch<{ saved: boolean }>(`${B}/posts/${id}/save`, { method: "POST" }),
  reportPost: (id: string, reason: string) => apiFetch<unknown>(`${B}/posts/${id}/report`, { method: "POST", body: { reason } }),
  vote: (id: string, optionIdxs: number[]) => apiFetch<{ myVotes: number[] }>(`${B}/posts/${id}/vote`, { method: "POST", body: { optionIdxs } }),
  sharePost: (id: string, content = "") =>
    apiFetch<{ post: CommunityPost }>(`${B}/posts/${id}/share`, { method: "POST", body: { content } }),
  stories: () => apiFetch<{ stories: CommunityStory[] }>(`${B}/stories`),
  addStory: (mediaUrl: string, caption?: string) =>
    apiFetch<{ story: CommunityStory }>(`${B}/stories`, { method: "POST", body: { mediaUrl, ...(caption ? { caption } : {}) } }),
  deleteStory: (id: string) => apiFetch<void>(`${B}/stories/${id}`, { method: "DELETE" }),
  viewStory: (id: string) => apiFetch<{ ok: boolean }>(`${B}/stories/${id}/view`, { method: "POST" }),
  memberProfile: (id: string) => apiFetch<{ member: CommunityMember; posts: CommunityPost[] }>(`${B}/members/${id}`),
  translate: (text: string, target = "ar") =>
    apiFetch<{ translated: string; source: string }>(`${B}/translate?text=${encodeURIComponent(text)}&target=${target}`),
  comments: (postId: string, cursor?: string | null) =>
    apiFetch<{ comments: CommunityComment[]; total: number; nextCursor: string | null }>(
      `${B}/posts/${postId}/comments${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
    ),
  addComment: (postId: string, content: string, parentId?: string) =>
    apiFetch<{ comment: CommunityComment }>(`${B}/posts/${postId}/comments`, {
      method: "POST",
      body: { content, ...(parentId ? { parentId } : {}) },
    }),
  editComment: (id: string, content: string) =>
    apiFetch<{ comment: CommunityComment }>(`${B}/comments/${id}`, { method: "PATCH", body: { content } }),
  deleteComment: (id: string) => apiFetch<void>(`${B}/comments/${id}`, { method: "DELETE" }),
  reactComment: (id: string, type: ReactionType | null) =>
    apiFetch<{ myReaction: ReactionType | null }>(`${B}/comments/${id}/react`, { method: "POST", body: { type } }),
  reportComment: (id: string, reason: string) => apiFetch<unknown>(`${B}/comments/${id}/report`, { method: "POST", body: { reason } }),
  markWinner: (id: string) => apiFetch<{ isWinner: boolean }>(`${B}/comments/${id}/winner`, { method: "POST" }),
  sidebar: () => apiFetch<CommunitySidebar>(`${B}/sidebar`),
  mentions: (q: string) => apiFetch<{ users: { id: string; fullName: string; role: string; avatarUrl?: string | null }[] }>(`${B}/mentions?q=${encodeURIComponent(q)}`),
  chatMessages: (before?: string | null) =>
    apiFetch<{ messages: CommunityMessage[]; hasMore: boolean; pinned: CommunityMessage | null }>(`${B}/chat/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`),
  sendChat: (body: { content: string; type: CommunityMessage["type"]; mediaUrl?: string; fileName?: string; mimeType?: string; replyToId?: string }) =>
    apiFetch<{ message: CommunityMessage }>(`${B}/chat/messages`, { method: "POST", body }),
  deleteChat: (id: string) => apiFetch<void>(`${B}/chat/messages/${id}`, { method: "DELETE" }),
  reactChat: (id: string, emoji: string | null) =>
    apiFetch<{ reactions: { byEmoji: Record<string, number>; total: number }; myReaction: string | null }>(`${B}/chat/messages/${id}/react`, { method: "POST", body: { emoji } }),
  pinChat: (id: string) => apiFetch<{ pinned: CommunityMessage | null }>(`${B}/chat/messages/${id}/pin`, { method: "POST" }),
  sendTyping: () => apiFetch<void>(`${B}/chat/typing`, { method: "POST" }),
  // admin
  getSettings: () => apiFetch<{ settings: CommunitySettingsView }>(`${B}/admin/settings`),
  saveSettings: (body: Partial<CommunitySettingsView>) =>
    apiFetch<{ settings: CommunitySettingsView }>(`${B}/admin/settings`, { method: "PATCH", body }),
  reports: () => apiFetch<{ reports: CommunityReportView[] }>(`${B}/admin/reports`),
  resolveReport: (id: string, action: "dismiss" | "delete") =>
    apiFetch<unknown>(`${B}/admin/reports/${id}/resolve`, { method: "POST", body: { action } }),
  mutes: () => apiFetch<{ mutes: { userId: string; reason: string; createdAt: string; user: CommunityAuthor }[] }>(`${B}/admin/mutes`),
  mute: (userId: string, reason = "") => apiFetch<unknown>(`${B}/admin/mutes`, { method: "POST", body: { userId, reason } }),
  unmute: (userId: string) => apiFetch<void>(`${B}/admin/mutes/${userId}`, { method: "DELETE" }),
};

export const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "like", emoji: "👍", label: "أعجبني", color: "text-blue-600" },
  { type: "love", emoji: "❤️", label: "أحببته", color: "text-red-500" },
  { type: "haha", emoji: "😂", label: "أضحكني", color: "text-amber-500" },
  { type: "wow", emoji: "😮", label: "واو", color: "text-amber-500" },
  { type: "sad", emoji: "😢", label: "أحزنني", color: "text-amber-600" },
  { type: "helpful", emoji: "💡", label: "مفيد", color: "text-emerald-600" },
];

export const reactionMeta = (type: ReactionType | null | undefined) => REACTIONS.find((r) => r.type === type);

// Relative time in Arabic + full timestamp helper
export function timeAgo(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  if (abs < 45) return "الآن";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
}

export const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "short" });
