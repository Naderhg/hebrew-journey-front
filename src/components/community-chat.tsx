import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Mic, Paperclip, Pin, PinOff, Reply, Send, Smile, Square, Trash2, X } from "lucide-react";
import { mediaSrc, uploadFile } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { subscribeRealtime } from "../lib/realtime";
import { communityApi, type CommunityAccess, type CommunityMessage } from "../lib/community";
import { Card } from "./ui";
import { Avatar, RichText, RoleBadge } from "./community-common";
import type { Me } from "./community-feed";

const dayKey = (iso: string) => new Date(iso).toDateString();
const CHAT_EMOJIS = ["😊", "😂", "❤️", "👍", "🙏", "🔥", "🎉", "👏", "😍", "🤔", "😢", "🤣", "🥳", "💪", "✨", "🫶", "😴", "🤝"];
const REACT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const EMOJI_ONLY_RE = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\s]{1,16}$/u;


function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "اليوم";
  if (d.toDateString() === yest.toDateString()) return "أمس";
  return d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
}

function snippet(m: { content: string; type: string; fileName?: string | null }) {
  if (m.content) return m.content.slice(0, 80);
  return m.type === "image" ? "📷 صورة" : m.type === "voice" ? "🎙️ رسالة صوتية" : `📎 ${m.fileName ?? "ملف"}`;
}

function Bubble({
  m, mine, canDelete, canModerate, onReply, onReact, onPin, onDelete, onJump,
}: {
  m: CommunityMessage;
  mine: boolean;
  canDelete: boolean;
  canModerate: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onPin: () => void;
  onDelete: () => void;
  onJump?: (() => void) | undefined;
}) {
  const { t } = useI18n();
  const [picker, setPicker] = useState(false);
  const time = new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const myEmoji = m.myReaction;

  return (
    <div className={`group relative flex max-w-[85%] items-end gap-2 ${mine ? "me-auto" : "ms-auto flex-row-reverse"}`}>
      {!mine && <Avatar user={m.author} size={30} />}
      <div className="relative min-w-0">
        {m.isPinned && <Pin className="absolute -top-1.5 end-2 size-3 rotate-45 text-gold" />}
        <div className={`min-w-0 rounded-2xl px-3 py-2 ${mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-muted"}`}>
          {!mine && (
            <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs font-bold">
              {m.author.fullName} <RoleBadge role={m.author.role} />
            </p>
          )}
          {m.replyTo && (
            <button
              onClick={onJump}
              className={`mb-1.5 block w-full rounded-lg border-s-2 px-2 py-1 text-start text-[11px] ${mine ? "border-white/60 bg-white/15 text-white/90" : "border-brand bg-brand/10 text-ink"}`}
            >
              <b className="block truncate">{m.replyTo.author.fullName}</b>
              <span className="line-clamp-1 opacity-80">{snippet(m.replyTo)}</span>
            </button>
          )}
          {m.type === "voice" && m.mediaUrl && <audio controls preload="none" src={mediaSrc(m.mediaUrl)} className="h-9 max-w-[240px]" />}
          {m.type === "image" && m.mediaUrl && (
            <a href={mediaSrc(m.mediaUrl)} target="_blank" rel="noreferrer">
              <img src={mediaSrc(m.mediaUrl)} alt={m.fileName ?? ""} loading="lazy" className="max-h-60 rounded-xl object-cover" />
            </a>
          )}
          {m.type === "file" && m.mediaUrl && (
            <a href={mediaSrc(m.mediaUrl)} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-sm font-semibold underline ${mine ? "text-white" : "text-brand"}`}>
              <Paperclip className="size-4 shrink-0" /> <span className="truncate">{m.fileName ?? t("ملف")}</span>
            </a>
          )}
          {m.content && <p className={`${EMOJI_ONLY_RE.test(m.content.trim()) ? "text-3xl leading-tight" : "text-sm leading-6"}`}><RichText text={m.content} /></p>}
          <p className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{time}</p>
        </div>

        {/* reaction summary pill */}
        {m.reactions.total > 0 && (
          <span className={`absolute -bottom-3 z-10 flex items-center gap-0.5 rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] shadow-sm ${mine ? "end-2" : "start-2"}`}>
            {Object.entries(m.reactions.byEmoji).slice(0, 3).map(([e, n]) => (
              <span key={e} className={myEmoji === e ? "rounded-full bg-brand/15 px-0.5" : ""}>{e}{n > 1 ? n : ""}</span>
            ))}
          </span>
        )}
      </div>

      {/* hover actions */}
      <div className={`mb-1 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 ${mine ? "" : "flex-row-reverse"}`}>
        <button onClick={() => setPicker((v) => !v)} title={t("تفاعل")} className="grid size-7 place-items-center rounded-full bg-background text-muted-foreground shadow-sm transition hover:text-brand"><Smile className="size-4" /></button>
        <button onClick={onReply} title={t("رد")} className="grid size-7 place-items-center rounded-full bg-background text-muted-foreground shadow-sm transition hover:text-brand"><Reply className="size-4" /></button>
        {canModerate && (
          <button onClick={onPin} title={m.isPinned ? t("إلغاء التثبيت") : t("تثبيت")} className="grid size-7 place-items-center rounded-full bg-background text-muted-foreground shadow-sm transition hover:text-gold">
            {m.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </button>
        )}
        {canDelete && (
          <button onClick={onDelete} title={t("حذف")} className="grid size-7 place-items-center rounded-full bg-background text-danger shadow-sm transition hover:bg-danger/10"><Trash2 className="size-3.5" /></button>
        )}
      </div>

      {/* emoji picker */}
      {picker && (
        <>
          <button className="fixed inset-0 z-20 cursor-default" onClick={() => setPicker(false)} aria-label="close" />
          <div className={`absolute -top-10 z-30 flex gap-1 rounded-full border border-border bg-background px-2 py-1 shadow-xl ${mine ? "start-0" : "end-0"}`}>
            {REACT_EMOJIS.map((e) => (
              <button key={e} onClick={() => { onReact(e); setPicker(false); }}
                className={`text-xl transition hover:-translate-y-1 hover:scale-125 ${myEmoji === e ? "grayscale-0" : ""}`}>
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CommunityChat({ me, access }: { me: Me; access: CommunityAccess }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [pinned, setPinned] = useState<CommunityMessage | null>(null);
  const [typers, setTypers] = useState<Map<string, string>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTypingSent = useRef(0);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const blocked = !access.chatEnabled && !access.canModerate ? t("الشات متوقف مؤقتاً من الإدارة") : access.muted && !access.canModerate ? t("تم كتمك من المجتمع") : "";

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const r = await communityApi.chatMessages();
      setMessages(r.messages);
      setHasMore(r.hasMore);
      setPinned(r.pinned);
      stickRef.current = true;
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => subscribeRealtime((event, data) => {
    if (event === "community:message" && data) {
      const msg = data as CommunityMessage;
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
      // a reply bumps me to the bottom + clears typer
      if (msg.author?.id) setTypers((prev) => { const m = new Map(prev); m.delete(msg.author.id); return m; });
    }
    if (event === "community:message-deleted" && data?.id) {
      setMessages((prev) => prev.filter((x) => x.id !== data.id));
      setPinned((p) => (p?.id === data.id ? null : p));
    }
    if (event === "community:message-react" && data?.id) {
      setMessages((prev) => prev.map((x) => (x.id === data.id ? { ...x, reactions: data.reactions } : x)));
      setPinned((p) => (p && p.id === data.id ? { ...p, reactions: data.reactions } : p));
    }
    if (event === "community:message-pinned") {
      const mp = (data?.message ?? null) as CommunityMessage | null;
      setPinned(mp);
      setMessages((prev) => prev.map((x) => ({ ...x, isPinned: mp ? x.id === mp.id : false })));
    }
    if (event === "community:typing" && data?.userId && data.userId !== me.id) {
      const { userId, name } = data as { userId: string; name: string };
      setTypers((prev) => new Map(prev).set(userId, name));
      const old = typingTimers.current.get(userId);
      if (old) clearTimeout(old);
      typingTimers.current.set(userId, setTimeout(() => {
        setTypers((prev) => { const m = new Map(prev); m.delete(userId); return m; });
        typingTimers.current.delete(userId);
      }, 4000));
    }
  }), [me.id]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, typers]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    typingTimers.current.forEach((t) => clearTimeout(t));
  }, []);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2500) return;
    lastTypingSent.current = now;
    communityApi.sendTyping().catch(() => {});
  }

  async function loadOlder() {
    const first = messages[0];
    if (!first) return;
    const el = listRef.current;
    const prevH = el?.scrollHeight ?? 0;
    stickRef.current = false;
    const r = await communityApi.chatMessages(first.createdAt);
    setMessages((prev) => [...r.messages, ...prev]);
    setHasMore(r.hasMore);
    requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevH; });
  }

  async function send(body: Parameters<typeof communityApi.sendChat>[0]) {
    setSending(true);
    setError("");
    try {
      const { message } = await communityApi.sendChat(body);
      stickRef.current = true;
      setMessages((prev) => (prev.some((x) => x.id === message.id) ? prev : [...prev, message]));
      setReplyTo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر الإرسال"));
    } finally { setSending(false); }
  }

  async function sendText() {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    await send({ content, type: "text", ...(replyTo ? { replyToId: replyTo.id } : {}) });
  }

  async function sendFile(file: File, kind: "image" | "file") {
    setSending(true);
    setError("");
    try {
      const up = await uploadFile(file, "community");
      await send({ content: "", type: kind, mediaUrl: up.url, fileName: file.name, mimeType: file.type, ...(replyTo ? { replyToId: replyTo.id } : {}) });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر الرفع"));
      setSending(false);
    }
  }

  async function reactMessage(m: CommunityMessage, emoji: string) {
    const prev = m;
    const myEmoji = m.myReaction === emoji ? null : emoji;
    const byEmoji = { ...m.reactions.byEmoji };
    if (m.myReaction) byEmoji[m.myReaction] = Math.max(0, (byEmoji[m.myReaction] ?? 1) - 1);
    if (myEmoji) byEmoji[myEmoji] = (byEmoji[myEmoji] ?? 0) + 1;
    const total = Object.values(byEmoji).reduce((a, n) => a + n, 0);
    const patched = { ...m, myReaction: myEmoji, reactions: { byEmoji, total } };
    setMessages((p) => p.map((x) => (x.id === m.id ? patched : x)));
    try { await communityApi.reactChat(m.id, emoji); } catch {
      setMessages((p) => p.map((x) => (x.id === m.id ? prev : x)));
    }
  }

  async function togglePin(m: CommunityMessage) {
    try {
      const r = await communityApi.pinChat(m.id);
      setPinned(r.pinned);
      setMessages((prev) => prev.map((x) => ({ ...x, isPinned: r.pinned ? x.id === r.pinned.id : false })));
    } catch { /* ignore */ }
  }

  function jumpTo(id: string) {
    document.getElementById(`cmsg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function startRec() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 800) return;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setSending(true);
        try {
          const up = await uploadFile(file, "community");
          await send({ content: "", type: "voice", mediaUrl: up.url, fileName: file.name, mimeType: "audio/webm", ...(replyTo ? { replyToId: replyTo.id } : {}) });
        } catch (e) {
          setError(e instanceof Error ? e.message : t("تعذر رفع الرسالة الصوتية"));
          setSending(false);
        }
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setSecs(0);
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      setError(t("لا يمكن الوصول للميكروفون"));
    }
  }

  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const typingNames = [...typers.values()];

  return (
    <Card className="flex h-[62vh] flex-col overflow-hidden p-0 sm:h-[68vh] lg:h-[72vh]">
      <div className="flex items-center gap-2 border-b border-border bg-gradient-to-l from-brand/10 to-transparent px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-brand text-lg text-white">💬</span>
        <div>
          <p className="text-sm font-bold">{t("شات المجتمع")}</p>
          <p className="text-[11px] text-muted-foreground">{t("غرفة عامة لكل أعضاء الأكاديمية")}</p>
        </div>
      </div>

      {/* pinned message bar */}
      {pinned && (
        <button onClick={() => jumpTo(pinned.id)} className="flex items-center gap-2 border-b border-gold/40 bg-gold/10 px-4 py-2 text-start text-xs">
          <Pin className="size-3.5 shrink-0 rotate-45 text-gold" />
          <span className="min-w-0 flex-1 truncate font-semibold">
            <b>{pinned.author.fullName}:</b> {snippet(pinned)}
          </span>
        </button>
      )}

      <div
        ref={listRef}
        onScroll={(e) => { const el = e.currentTarget; stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4"
      >
        {hasMore && <button onClick={loadOlder} className="mx-auto block rounded-full bg-background px-4 py-1 text-xs font-semibold text-brand shadow-sm">{t("عرض الرسائل الأقدم")}</button>}
        {loading && <p className="py-6 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</p>}
        {!loading && messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t("لا توجد رسائل بعد — ابدأ المحادثة 👋")}</p>}
        {messages.map((m, i) => (
          <div key={m.id} id={`cmsg-${m.id}`} className="space-y-2 rounded-xl transition-shadow">
            {(i === 0 || dayKey(messages[i - 1]!.createdAt) !== dayKey(m.createdAt)) && (
              <p className="py-1 text-center"><span className="rounded-full bg-background px-3 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-sm">{t(dayLabel(m.createdAt))}</span></p>
            )}
            <Bubble
              m={m}
              mine={m.author.id === me.id}
              canDelete={m.author.id === me.id || access.canModerate}
              canModerate={access.canModerate}
              onReply={() => setReplyTo(m)}
              onReact={(e) => reactMessage(m, e)}
              onPin={() => togglePin(m)}
              onDelete={() => { if (window.confirm(t("حذف الرسالة؟"))) communityApi.deleteChat(m.id).then(() => setMessages((p) => p.filter((x) => x.id !== m.id))).catch(() => {}); }}
              onJump={m.replyTo ? () => jumpTo(m.replyTo!.id) : undefined}
            />
          </div>
        ))}

        {/* typing indicator */}
        {typingNames.length > 0 && (
          <div className="flex items-end gap-2 ps-2">
            <span className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {typingNames.slice(0, 2).join(t(" و "))}{typingNames.length > 2 ? ` +${typingNames.length - 2}` : ""} {t("يكتب الآن…")}
              </span>
            </span>
          </div>
        )}
      </div>

      {error && <p className="border-t border-border bg-danger/5 px-4 py-1.5 text-xs font-semibold text-danger">{error}</p>}
      <div className="border-t border-border bg-background p-3">
        {blocked ? (
          <p className="py-2 text-center text-sm text-muted-foreground">{blocked}</p>
        ) : recording ? (
          <div className="flex items-center gap-3">
            <span className="size-3 animate-pulse rounded-full bg-danger" />
            <span className="text-sm font-bold text-danger">{t("جاري التسجيل")} {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
            <button onClick={stopRec} className="ms-auto flex items-center gap-1.5 rounded-full bg-danger px-4 py-2 text-sm font-bold text-white transition active:scale-95"><Square className="size-4" /> {t("إيقاف وإرسال")}</button>
          </div>
        ) : (
          <>
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border-s-4 border-brand bg-brand/5 px-3 py-2 text-xs">
                <Reply className="size-3.5 shrink-0 text-brand" />
                <span className="min-w-0 flex-1">
                  <b className="block text-brand">{t("رد على")} {replyTo.author.fullName}</b>
                  <span className="line-clamp-1 text-muted-foreground">{snippet(replyTo)}</span>
                </span>
                <button onClick={() => setReplyTo(null)} className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f, "image"); e.target.value = ""; }} />
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f, "file"); e.target.value = ""; }} />
              <button onClick={() => imgRef.current?.click()} title={t("صورة")} className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition hover:brightness-95 active:scale-90"><ImageIcon className="size-5" /></button>
              <button onClick={() => fileRef.current?.click()} title={t("ملف")} className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 transition hover:brightness-95 active:scale-90"><Paperclip className="size-5" /></button>
              <div className="relative flex-1">
                <textarea
                  value={text}
                  rows={1}
                  onChange={(e) => { setText(e.target.value); notifyTyping(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                  placeholder={t("اكتب رسالة...")}
                  className="max-h-28 min-h-10 w-full resize-none rounded-2xl bg-muted px-4 py-2.5 pe-10 text-sm outline-none"
                />
                <button onClick={() => setEmojiOpen((v) => !v)} title={t("إيموجي")} className="absolute bottom-1.5 end-2 grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-background active:scale-90"><Smile className="size-4" /></button>
                {emojiOpen && (
                  <div className="absolute bottom-full end-0 z-30 mb-2 grid w-60 grid-cols-6 gap-1 rounded-xl border border-border bg-background p-2 shadow-xl">
                    {CHAT_EMOJIS.map((e) => (
                      <button key={e} onClick={() => { setText((v) => v + e); setEmojiOpen(false); }} className="grid size-8 place-items-center rounded text-xl hover:bg-muted">{e}</button>
                    ))}
                  </div>
                )}
              </div>
              {text.trim() ? (
                <button onClick={sendText} disabled={sending} className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition active:scale-90 disabled:opacity-50"><Send className="size-5" /></button>
              ) : (
                <button onClick={startRec} disabled={sending} title={t("رسالة صوتية")} className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition active:scale-90 disabled:opacity-50"><Mic className="size-5" /></button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
