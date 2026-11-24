import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { mediaSrc } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./ui";
import { REACTIONS, type CommunityAuthor, type ReactionType } from "../lib/community";

export const ROLE_META: Record<string, { label: string; tone: "brand" | "sage" | "gold" | "muted" | "danger" }> = {
  STUDENT: { label: "طالب", tone: "muted" },
  TEACHER: { label: "مدرس", tone: "brand" },
  SALES: { label: "مبيعات", tone: "sage" },
  SUPPORT: { label: "دعم", tone: "sage" },
  ADMIN: { label: "إدارة", tone: "gold" },
  SUPER_ADMIN: { label: "إدارة", tone: "gold" },
};

const AVATAR_TONES = ["bg-brand/15 text-brand", "bg-sage/20 text-sage", "bg-gold/20 text-gold", "bg-brand2/15 text-brand2", "bg-blue-100 text-blue-700", "bg-rose-100 text-rose-700"];

// Set by CommunityScreen — lets any avatar/name open the member profile modal.
export const OpenProfileContext = createContext<((userId: string) => void) | null>(null);
export const useOpenProfile = () => useContext(OpenProfileContext);

export function Avatar({ user, size = 40, clickable = true }: { user: { id: string; fullName: string; avatarUrl?: string | null }; size?: number; clickable?: boolean }) {
  const open = useOpenProfile();
  const tone = AVATAR_TONES[[...user.id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length]!;
  const style = { width: size, height: size, fontSize: size * 0.4 };
  const inner = user.avatarUrl ? (
    <img src={mediaSrc(user.avatarUrl)} alt={user.fullName} style={style} className="rounded-full object-cover" />
  ) : (
    <span style={style} className={`grid place-items-center rounded-full font-bold ${tone}`}>
      {user.fullName.trim().charAt(0) || "?"}
    </span>
  );
  if (!clickable || !open) return <span className="shrink-0">{inner}</span>;
  return (
    <span
      role="button"
      tabIndex={0}
      title={user.fullName}
      onClick={(e) => { e.stopPropagation(); open(user.id); }}
      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); open(user.id); } }}
      className="shrink-0 cursor-pointer transition hover:opacity-80"
    >
      {inner}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const { t } = useI18n();
  const m = ROLE_META[role] ?? ROLE_META["STUDENT"]!;
  return <Badge tone={m.tone}>{t(m.label)}</Badge>;
}

export function LangChip({ lang }: { lang?: string | null | undefined }) {
  const { t } = useI18n();
  if (!lang) return null;
  return <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{lang === "english" ? t("إنجليزي") : t("عبري")}</span>;
}

export function AuthorLine({ author }: { author: CommunityAuthor }) {
  const open = useOpenProfile();
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <b
        className={`text-sm ${open ? "cursor-pointer hover:underline" : ""}`}
        onClick={open ? (e) => { e.stopPropagation(); open(author.id); } : undefined}
      >
        {author.fullName}
      </b>
      <RoleBadge role={author.role} />
      {author.role === "STUDENT" && <LangChip lang={author.learningLanguage} />}
    </span>
  );
}

// Renders @[Name](id) mentions, #hashtags and URLs inside plain text
const TOKEN_RE = /(@\[[^\]]+\]\([0-9a-fA-F-]{36}\))|(#[\p{L}\p{N}_]{2,40})|(https?:\/\/[^\s]+)/gu;

export function RichText({ text, onTag }: { text: string; onTag?: (tag: string) => void }) {
  const open = useOpenProfile();
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const [full, mention, tag, url] = m;
    if (mention) {
      const name = mention.slice(2, mention.indexOf("]"));
      const id = mention.slice(mention.indexOf("(") + 1, -1);
      out.push(
        <span
          key={i++}
          className={`rounded bg-brand/10 px-1 font-semibold text-brand ${open ? "cursor-pointer hover:bg-brand/20" : ""}`}
          onClick={open ? (e) => { e.stopPropagation(); open(id); } : undefined}
        >
          @{name}
        </span>
      );
    } else if (tag) {
      out.push(
        <button key={i++} type="button" onClick={() => onTag?.(tag)} className="font-semibold text-brand hover:underline">{tag}</button>
      );
    } else if (url) {
      out.push(<a key={i++} href={url} target="_blank" rel="noreferrer" className="break-all text-blue-600 hover:underline">{url}</a>);
    }
    last = idx + full!.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <span className="whitespace-pre-wrap break-words" dir="auto">{out}</span>;
}

// Floating reaction bar (hover on desktop, long-press on touch)
export function ReactionButton({
  value, onChange, size = "md",
}: {
  value: ReactionType | null;
  onChange: (type: ReactionType | null) => void;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = REACTIONS.find((r) => r.type === value);

  const show = (ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), ms);
  };
  const hide = (ms = 250) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), ms);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="relative" onMouseEnter={() => show(350)} onMouseLeave={() => hide()}>
      {open && (
        <div
          className="absolute bottom-full start-0 z-30 mb-1 flex gap-1 rounded-full border border-border bg-background px-2 py-1 shadow-xl"
          onMouseEnter={() => show(0)}
          onMouseLeave={() => hide()}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={t(r.label)}
              onClick={() => { onChange(r.type === value ? null : r.type); setOpen(false); }}
              className="text-2xl transition hover:-translate-y-1 hover:scale-125"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(value ? null : "like")}
        onTouchStart={() => show(450)}
        onTouchEnd={() => { if (timer.current) clearTimeout(timer.current); }}
        className={`flex items-center gap-1.5 rounded-lg font-semibold transition active:scale-95 hover:bg-muted ${size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-3 py-1.5 text-sm"} ${current ? current.color : "text-muted-foreground"}`}
      >
        <span className={size === "sm" ? "text-sm" : "text-lg"}>{current ? current.emoji : "👍"}</span>
        {current ? t(current.label) : t("تفاعل")}
      </button>
    </div>
  );
}

export function ReactionStack({ byType }: { byType: Partial<Record<ReactionType, number>> }) {
  const top = REACTIONS.filter((r) => (byType[r.type] ?? 0) > 0)
    .sort((a, b) => (byType[b.type] ?? 0) - (byType[a.type] ?? 0))
    .slice(0, 3);
  return (
    <span className="flex -space-x-1 space-x-reverse">
      {top.map((r) => (
        <span key={r.type} className="grid size-5 place-items-center rounded-full border border-background bg-muted text-[11px]">{r.emoji}</span>
      ))}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function isImageUrl(url: string | null | undefined, name?: string | null) {
  return !!url && (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) || /\.(png|jpe?g|webp|gif)$/i.test(name ?? ""));
}
