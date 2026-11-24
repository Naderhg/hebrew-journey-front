import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Mic, Paperclip, Send, Square, Trash2 } from "lucide-react";
import { mediaSrc, uploadFile } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { subscribeRealtime } from "../lib/realtime";
import { communityApi, type CommunityAccess, type CommunityMessage } from "../lib/community";
import { Card } from "./ui";
import { Avatar, RichText, RoleBadge } from "./community-common";
import type { Me } from "./community-feed";

const dayKey = (iso: string) => new Date(iso).toDateString();

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "اليوم";
  if (d.toDateString() === yest.toDateString()) return "أمس";
  return d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
}

function Bubble({ m, mine, canDelete, onDelete }: { m: CommunityMessage; mine: boolean; canDelete: boolean; onDelete: () => void }) {
  const { t } = useI18n();
  const time = new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`group flex max-w-[85%] items-end gap-2 ${mine ? "me-auto" : "ms-auto flex-row-reverse"}`}>
      {!mine && <Avatar user={m.author} size={30} />}
      <div className={`min-w-0 rounded-2xl px-3 py-2 ${mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-muted"}`}>
        {!mine && (
          <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {m.author.fullName} <RoleBadge role={m.author.role} />
          </p>
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
        {m.content && <p className="text-sm leading-6"><RichText text={m.content} /></p>}
        <p className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{time}</p>
      </div>
      {canDelete && (
        <button onClick={onDelete} title={t("حذف")} className="mb-1 hidden size-7 place-items-center rounded-full text-danger transition hover:bg-danger/10 group-hover:grid">
          <Trash2 className="size-3.5" />
        </button>
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
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const blocked = !access.chatEnabled && !access.canModerate ? t("الشات متوقف مؤقتاً من الإدارة") : access.muted && !access.canModerate ? t("تم كتمك من المجتمع") : "";

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const r = await communityApi.chatMessages();
      setMessages(r.messages);
      setHasMore(r.hasMore);
      stickRef.current = true;
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => subscribeRealtime((event, data) => {
    if (event === "community:message" && data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as CommunityMessage]));
    }
    if (event === "community:message-deleted" && data?.id) {
      setMessages((prev) => prev.filter((x) => x.id !== data.id));
    }
  }), []);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر الإرسال"));
    } finally { setSending(false); }
  }

  async function sendText() {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    await send({ content, type: "text" });
  }

  async function sendFile(file: File, kind: "image" | "file") {
    setSending(true);
    setError("");
    try {
      const up = await uploadFile(file, "community");
      await send({ content: "", type: kind, mediaUrl: up.url, fileName: file.name, mimeType: file.type });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر الرفع"));
      setSending(false);
    }
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
          await send({ content: "", type: "voice", mediaUrl: up.url, fileName: file.name, mimeType: "audio/webm" });
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

  return (
    <Card className="flex h-[62vh] flex-col overflow-hidden p-0 sm:h-[68vh] lg:h-[72vh]">
      <div className="flex items-center gap-2 border-b border-border bg-gradient-to-l from-brand/10 to-transparent px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-brand text-lg text-white">💬</span>
        <div>
          <p className="text-sm font-bold">{t("شات المجتمع")}</p>
          <p className="text-[11px] text-muted-foreground">{t("غرفة عامة لكل أعضاء الأكاديمية")}</p>
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={(e) => { const el = e.currentTarget; stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4"
      >
        {hasMore && <button onClick={loadOlder} className="mx-auto block rounded-full bg-background px-4 py-1 text-xs font-semibold text-brand shadow-sm">{t("عرض الرسائل الأقدم")}</button>}
        {loading && <p className="py-6 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</p>}
        {!loading && messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t("لا توجد رسائل بعد — ابدأ المحادثة 👋")}</p>}
        {messages.map((m, i) => (
          <div key={m.id} className="space-y-2">
            {(i === 0 || dayKey(messages[i - 1]!.createdAt) !== dayKey(m.createdAt)) && (
              <p className="py-1 text-center"><span className="rounded-full bg-background px-3 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-sm">{t(dayLabel(m.createdAt))}</span></p>
            )}
            <Bubble
              m={m}
              mine={m.author.id === me.id}
              canDelete={m.author.id === me.id || access.canModerate}
              onDelete={() => { if (window.confirm(t("حذف الرسالة؟"))) communityApi.deleteChat(m.id).then(() => setMessages((p) => p.filter((x) => x.id !== m.id))).catch(() => {}); }}
            />
          </div>
        ))}
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
          <div className="flex items-end gap-1.5">
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f, "image"); e.target.value = ""; }} />
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f, "file"); e.target.value = ""; }} />
            <button onClick={() => imgRef.current?.click()} title={t("صورة")} className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition hover:brightness-95 active:scale-90"><ImageIcon className="size-5" /></button>
            <button onClick={() => fileRef.current?.click()} title={t("ملف")} className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 transition hover:brightness-95 active:scale-90"><Paperclip className="size-5" /></button>
            <textarea
              value={text}
              rows={1}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              placeholder={t("اكتب رسالة...")}
              className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm outline-none"
            />
            {text.trim() ? (
              <button onClick={sendText} disabled={sending} className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition active:scale-90 disabled:opacity-50"><Send className="size-5" /></button>
            ) : (
              <button onClick={startRec} disabled={sending} title={t("رسالة صوتية")} className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition active:scale-90 disabled:opacity-50"><Mic className="size-5" /></button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
