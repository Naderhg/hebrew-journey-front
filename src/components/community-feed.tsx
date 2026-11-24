import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  ImagePlus,
  Languages,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Send,
  Share2,
  Smile,
  Trash2,
  VolumeX,
  X,
} from "lucide-react";
import { mediaSrc } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { uploadFile } from "../lib/api";
import { subscribeRealtime } from "../lib/realtime";
import {
  communityApi,
  fullDate,
  timeAgo,
  reactionMeta,
  type CommunityAccess,
  type CommunityAuthor,
  type CommunityComment,
  type CommunityPost,
  type CommunityStory,
  type ReactionType,
} from "../lib/community";
import { Button, Card } from "./ui";
import { Avatar, AuthorLine, Modal, ReactionButton, ReactionStack, RichText, RoleBadge, isImageUrl } from "./community-common";

export interface Me {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

const EMOJIS = ["😊", "😂", "❤️", "👍", "🙏", "🔥", "🎉", "💡", "👏", "😍", "🤔", "😢"];
const EMOJI_ONLY_RE = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\s]{1,16}$/u;
const isEmojiOnly = (s: string) => EMOJI_ONLY_RE.test(s.trim());

// ─── @mention aware textarea ─────────────────────────────────────────────────
// The visible text keeps "@Name"; names are mapped to ids and converted to
// @[Name](id) tokens by encodeMentions() right before sending.
export function encodeMentions(text: string, map: Record<string, string>): string {
  let out = text;
  for (const name of Object.keys(map).sort((a, b) => b.length - a.length)) {
    out = out.split(`@${name}`).join(`@[${name}](${map[name]})`);
  }
  return out;
}

export function MentionTextarea({
  value, onChange, mentions, setMentions, placeholder, rows = 2, onEnter, className = "", autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  mentions: Record<string, string>;
  setMentions: (m: Record<string, string>) => void;
  placeholder: string;
  rows?: number;
  onEnter?: () => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<{ id: string; fullName: string; role: string; avatarUrl?: string | null }[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [value]);

  useEffect(() => {
    if (query === null) return;
    const h = setTimeout(() => {
      communityApi.mentions(query).then((r) => setResults(r.users)).catch(() => {});
    }, 200);
    return () => clearTimeout(h);
  }, [query]);

  function detect(v: string, caret: number) {
    const m = v.slice(0, caret).match(/(?:^|\s)@([^\s@]{0,30})$/);
    setQuery(m ? m[1]! : null);
  }

  function pick(u: { id: string; fullName: string }) {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([^\s@]{0,30})$/, "");
    const after = value.slice(caret);
    const next = `${before}@${u.fullName} ${after}`;
    setMentions({ ...mentions, [u.fullName]: u.id });
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = (before + `@${u.fullName} `).length;
      el?.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); detect(e.target.value, e.target.selectionStart); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery(null);
          if (onEnter && e.key === "Enter" && !e.shiftKey && query === null) { e.preventDefault(); onEnter(); }
        }}
        className={`w-full resize-none bg-transparent outline-none ${className}`}
      />
      {query !== null && results.length > 0 && (
        <div className="absolute start-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-xl">
          {results.map((u) => (
            <button key={u.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(u)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm hover:bg-muted">
              <Avatar user={u} size={24} />
              <span className="truncate">{u.fullName}</span>
              <span className="ms-auto"><RoleBadge role={u.role} /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────
export function Composer({ me, access, onPosted }: { me: Me; access: CommunityAccess; onPosted: (p: CommunityPost) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [pollOn, setPollOn] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState<{ text: string; img: File | null }[]>([{ text: "", img: null }, { text: "", img: null }]);
  const [pollMulti, setPollMulti] = useState(false);
  const [pollImgIdx, setPollImgIdx] = useState<number | null>(null);
  const [kind, setKind] = useState<"post" | "announcement" | "challenge">("post");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollImgRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  const optPreviews = useMemo(() => pollOpts.map((o) => (o.img ? URL.createObjectURL(o.img) : null)), [pollOpts]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const blocked = !access.postsEnabled && !access.canModerate ? t("النشر متوقف مؤقتاً من الإدارة") : access.muted && !access.canModerate ? t("تم كتمك من المجتمع") : "";
  const validPoll = pollOn && pollQ.trim() && pollOpts.filter((o) => o.text.trim()).length >= 2;
  const canSubmit = !busy && !blocked && (text.trim() || images.length || file || validPoll);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const urls = await Promise.all(images.map((f) => uploadFile(f, "community").then((r) => r.url)));
      const up = file ? await uploadFile(file, "community") : null;
      const optUrls = await Promise.all(pollOpts.map((o) => (o.img ? uploadFile(o.img, "community").then((r) => r.url) : Promise.resolve(null))));
      const { post } = await communityApi.createPost({
        content: encodeMentions(text.trim(), mentions),
        images: urls,
        kind,
        ...(up ? { fileUrl: up.url, fileName: file!.name } : {}),
        ...(validPoll
          ? {
              poll: {
                question: pollQ.trim(),
                multi: pollMulti,
                options: pollOpts
                  .map((o, i) => ({ text: o.text.trim(), ...(optUrls[i] ? { image: optUrls[i]! } : {}) }))
                  .filter((o) => o.text),
              },
            }
          : {}),
      });
      onPosted(post);
      setText(""); setMentions({}); setImages([]); setFile(null); setPollOn(false); setPollQ("");
      setPollOpts([{ text: "", img: null }, { text: "", img: null }]); setPollMulti(false); setKind("post");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر النشر"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar user={me} size={44} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-muted/60 px-4 py-2.5">
            <MentionTextarea
              value={text}
              onChange={setText}
              mentions={mentions}
              setMentions={setMentions}
              placeholder={blocked || `${t("بمَ تفكر يا")} ${me.fullName.split(" ")[0]}؟ (${t("استخدم @ للإشارة و # للوسوم")})`}
              rows={2}
              className="text-sm"
            />
          </div>

          {previews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div key={src} className="relative">
                  <img src={src} alt="" className="size-20 rounded-xl border border-border object-cover" />
                  <button onClick={() => setImages((a) => a.filter((_, j) => j !== i))}
                    className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-danger text-white shadow"><X className="size-3" /></button>
                </div>
              ))}
            </div>
          )}
          {file && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
              <Paperclip className="size-4" /> <span className="truncate">{file.name}</span>
              <button onClick={() => setFile(null)} className="ms-auto"><X className="size-4" /></button>
            </div>
          )}
          {pollOn && (
            <div className="mt-2 space-y-2 rounded-xl border border-brand/30 bg-brand/5 p-3">
              <input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder={t("سؤال الاستطلاع...")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" />
              {pollOpts.map((o, i) => (
                <div key={i} className="flex gap-1">
                  <button onClick={() => { setPollImgIdx(i); pollImgRef.current?.click(); }} title={t("صورة للخيار")}
                    className={`grid size-8 shrink-0 place-items-center rounded-lg border ${o.img ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {optPreviews[i] ? <img src={optPreviews[i]!} alt="" className="size-full rounded-lg object-cover" /> : <ImagePlus className="size-4" />}
                  </button>
                  <input value={o.text} onChange={(e) => setPollOpts((a) => a.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                    placeholder={`${t("الخيار")} ${i + 1}`}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand" />
                  {pollOpts.length > 2 && (
                    <button onClick={() => setPollOpts((a) => a.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/10"><X className="size-4" /></button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                {pollOpts.length < 6 && (
                  <button onClick={() => setPollOpts((a) => [...a, { text: "", img: null }])} className="flex items-center gap-1 text-xs font-semibold text-brand"><Plus className="size-3.5" /> {t("إضافة خيار")}</button>
                )}
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <input type="checkbox" checked={pollMulti} onChange={(e) => setPollMulti(e.target.checked)} className="accent-brand" />
                  {t("اختيار متعدد")}
                </label>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <input ref={imgRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { setImages((a) => [...a, ...Array.from(e.target.files ?? [])].slice(0, 6)); e.target.value = ""; }} />
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            <input ref={pollImgRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && pollImgIdx !== null) setPollOpts((a) => a.map((x, j) => (j === pollImgIdx ? { ...x, img: f } : x)));
                e.target.value = "";
              }} />
            <button onClick={() => imgRef.current?.click()} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:brightness-95 active:scale-95"><ImagePlus className="size-4" /> {t("صور")}</button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:brightness-95 active:scale-95"><Paperclip className="size-4" /> {t("ملف")}</button>
            <button onClick={() => setPollOn((v) => !v)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-95 active:scale-95 ${pollOn ? "bg-brand text-white" : "bg-blue-50 text-blue-700"}`}><BarChart3 className="size-4" /> {t("استطلاع")}</button>
            {access.canModerate && (
              <>
                <button onClick={() => setKind((k) => (k === "announcement" ? "post" : "announcement"))}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-95 active:scale-95 ${kind === "announcement" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"}`}>
                  📢 {t("إعلان")}
                </button>
                <button onClick={() => setKind((k) => (k === "challenge" ? "post" : "challenge"))}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:brightness-95 active:scale-95 ${kind === "challenge" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                  🏆 {t("تحدي")}
                </button>
              </>
            )}
            <div className="relative">
              <button onClick={() => setEmojiOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:brightness-95 active:scale-95"><Smile className="size-4" /> {t("إيموجي")}</button>
              {emojiOpen && (
                <div className="absolute start-0 top-full z-20 mt-1 grid w-48 grid-cols-6 gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => { setText((v) => v + e); setEmojiOpen(false); }} className="grid size-7 place-items-center rounded text-lg hover:bg-muted">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <Button className="ms-auto px-5 text-sm" disabled={!canSubmit} onClick={submit}>
              <Send className="size-4" /> {busy ? t("جاري النشر...") : t("نشر")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Comments ────────────────────────────────────────────────────────────────
function CommentItem({
  c, me, canModerate, postAuthorId, isReply, challenge, onReply, onChanged, onDeleted, onWinner,
}: {
  c: CommunityComment;
  me: Me;
  canModerate: boolean;
  postAuthorId: string;
  isReply?: boolean;
  challenge?: boolean;
  onReply: (c: CommunityComment) => void;
  onChanged: (c: CommunityComment) => void;
  onDeleted: (id: string) => void;
  onWinner?: (id: string) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.content);
  const [menu, setMenu] = useState(false);
  const mine = c.author.id === me.id;

  async function react(type: ReactionType | null) {
    const prev = c;
    const byType = { ...c.reactions.byType };
    let total = c.reactions.total;
    if (c.myReaction) { byType[c.myReaction] = Math.max(0, (byType[c.myReaction] ?? 1) - 1); total--; }
    if (type) { byType[type] = (byType[type] ?? 0) + 1; total++; }
    onChanged({ ...c, myReaction: type, reactions: { total, byType } });
    try { await communityApi.reactComment(c.id, type); } catch { onChanged(prev); }
  }

  async function saveEdit() {
    if (!draft.trim()) return;
    try {
      const { comment } = await communityApi.editComment(c.id, draft.trim());
      onChanged({ ...c, content: comment.content, updatedAt: comment.updatedAt });
      setEditing(false);
    } catch { /* keep editing */ }
  }

  const meta = reactionMeta(c.myReaction);
  return (
    <div className="flex gap-2">
      <Avatar user={c.author} size={isReply ? 28 : 34} />
      <div className="min-w-0 flex-1">
        <div className={`group relative inline-block max-w-full rounded-2xl px-3 py-2 ${c.isWinner ? "bg-emerald-50 ring-2 ring-emerald-400" : "bg-muted"}`}>
          {c.isWinner && <p className="mb-0.5 text-[10px] font-bold text-emerald-700">🏆 {t("إجابة فائزة")}</p>}
          <AuthorLine author={c.author} />
          {editing ? (
            <div className="mt-1">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus:border-brand" />
              <div className="mt-1 flex gap-2 text-xs">
                <button onClick={saveEdit} className="font-bold text-brand">{t("حفظ")}</button>
                <button onClick={() => { setEditing(false); setDraft(c.content); }} className="text-muted-foreground">{t("إلغاء")}</button>
              </div>
            </div>
          ) : (
            <p className={`mt-0.5 ${isEmojiOnly(c.content) ? "text-3xl leading-tight" : "text-sm"}`}><RichText text={c.content} /></p>
          )}
          {c.reactions.total > 0 && (
            <span className="absolute -bottom-2 end-2 flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] shadow-sm">
              <ReactionStack byType={c.reactions.byType} /> {c.reactions.total}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 ps-1 text-[11px] text-muted-foreground">
          <ReactionButton size="sm" value={c.myReaction} onChange={react} />
          {!isReply && <button onClick={() => onReply(c)} className="font-semibold hover:underline">{t("ردّ")}</button>}
          <span title={fullDate(c.createdAt)}>{timeAgo(c.createdAt)}</span>
          {c.updatedAt !== c.createdAt && <span>· {t("معدّل")}</span>}
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="rounded p-0.5 hover:bg-muted"><MoreHorizontal className="size-4" /></button>
            {menu && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} aria-label="close" />
                <div className="absolute start-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-background py-1 text-xs shadow-xl">
                  {canModerate && challenge && !mine && onWinner && (
                    <button onClick={() => { onWinner(c.id); setMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50">🏆 {c.isWinner ? t("إلغاء الفوز") : t("إجابة صحيحة")}</button>
                  )}
                  {mine && <button onClick={() => { setEditing(true); setMenu(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-muted"><Pencil className="size-3.5" /> {t("تعديل")}</button>}
                  {(mine || canModerate || postAuthorId === me.id) && (
                    <button onClick={() => { if (window.confirm(t("حذف التعليق؟"))) communityApi.deleteComment(c.id).then(() => onDeleted(c.id)).catch(() => {}); setMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-danger hover:bg-danger/10"><Trash2 className="size-3.5" /> {t("حذف")}</button>
                  )}
                  {!mine && <button onClick={() => { const r = window.prompt(t("سبب البلاغ (اختياري)")) ?? ""; communityApi.reportComment(c.id, r).then(() => window.alert(t("تم إرسال البلاغ"))).catch(() => {}); setMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-muted"><Flag className="size-3.5" /> {t("إبلاغ")}</button>}
                </div>
              </>
            )}
          </div>
          {meta && <span className="sr-only">{meta.label}</span>}
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ post, me, canModerate, onCount }: { post: CommunityPost; me: Me; canModerate: boolean; onCount: (n: number) => void }) {
  const { t } = useI18n();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const countRef = useRef(post.commentsCount);

  const load = useCallback(async (cur: string | null) => {
    setLoading(true);
    try {
      const r = await communityApi.comments(post.id, cur);
      setComments((prev) => (cur ? [...prev, ...r.comments] : r.comments));
      setCursor(r.nextCursor);
      countRef.current = r.total;
      onCount(r.total);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(null); }, [load]);

  function patch(updated: CommunityComment) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, replies: c.replies ?? [] }
      : { ...c, replies: (c.replies ?? []).map((r) => (r.id === updated.id ? updated : r)) })));
  }
  function remove(id: string) {
    let removed = 1;
    setComments((prev) => {
      const top = prev.find((c) => c.id === id);
      if (top) removed += (top.replies ?? []).length;
      return prev.filter((c) => c.id !== id).map((c) => ({ ...c, replies: (c.replies ?? []).filter((r) => r.id !== id) }));
    });
    countRef.current = Math.max(0, countRef.current - removed);
    onCount(countRef.current);
  }

  async function send() {
    const content = encodeMentions(text.trim(), mentions);
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const { comment } = await communityApi.addComment(post.id, content, replyTo?.id);
      if (replyTo) {
        const parentId = replyTo.parentId ?? replyTo.id;
        setComments((prev) => prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), comment] } : c)));
      } else {
        setComments((prev) => [...prev, comment]);
      }
      countRef.current += 1;
      onCount(countRef.current);
      setText(""); setMentions({}); setReplyTo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر إرسال التعليق"));
    } finally { setSending(false); }
  }

  function startReply(c: CommunityComment) {
    setReplyTo(c);
    setText((v) => v || `@${c.author.fullName} `);
    setMentions((m) => ({ ...m, [c.author.fullName]: c.author.id }));
  }

  async function markWinner(id: string) {
    try { await communityApi.markWinner(id); load(null); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {comments.map((c) => (
        <div key={c.id} className="space-y-2">
          <CommentItem c={c} me={me} canModerate={canModerate} postAuthorId={post.author.id} challenge={post.kind === "challenge"}
            onReply={startReply} onChanged={patch} onDeleted={remove} onWinner={markWinner} />
          {(c.replies ?? []).length > 0 && (
            <div className="space-y-2 border-s-2 border-border ps-3 ms-8">
              {(c.replies ?? []).map((r) => (
                <CommentItem key={r.id} c={r} me={me} canModerate={canModerate} postAuthorId={post.author.id} isReply challenge={post.kind === "challenge"}
                  onReply={() => startReply(c)} onChanged={patch} onDeleted={remove} onWinner={markWinner} />
              ))}
            </div>
          )}
        </div>
      ))}
      {loading && <p className="text-center text-xs text-muted-foreground">{t("جاري التحميل...")}</p>}
      {!loading && comments.length === 0 && <p className="py-2 text-center text-xs text-muted-foreground">{t("كن أول من يعلّق")}</p>}
      {cursor && !loading && <button onClick={() => load(cursor)} className="text-xs font-semibold text-brand hover:underline">{t("عرض المزيد من التعليقات")}</button>}

      <div className="flex gap-2">
        <Avatar user={me} size={32} />
        <div className="min-w-0 flex-1">
          {replyTo && (
            <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              {t("ردّ على")} <b>{replyTo.author.fullName}</b>
              <button onClick={() => { setReplyTo(null); setText(""); }}><X className="size-3.5" /></button>
            </div>
          )}
          <div className="relative flex items-end gap-1 rounded-2xl bg-muted px-3 py-1.5">
            <div className="min-w-0 flex-1">
              <MentionTextarea value={text} onChange={setText} mentions={mentions} setMentions={setMentions}
                placeholder={t("اكتب تعليقاً...")} rows={1} onEnter={send} className="text-sm" />
            </div>
            <button onClick={() => setEmojiOpen((v) => !v)} title={t("إيموجي")} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-background active:scale-90"><Smile className="size-4" /></button>
            <button onClick={send} disabled={!text.trim() || sending} className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white transition active:scale-90 disabled:opacity-40"><Send className="size-4" /></button>
            {emojiOpen && (
              <div className="absolute bottom-full end-0 z-30 mb-1 grid w-52 grid-cols-6 gap-1 rounded-xl border border-border bg-background p-2 shadow-xl">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => { setText((v) => v + e); setEmojiOpen(false); }} className="grid size-7 place-items-center rounded text-xl hover:bg-muted">{e}</button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="mt-1 text-[11px] font-semibold text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Post card ───────────────────────────────────────────────────────────────
export function PostCard({
  post, me, canModerate, onChange, onRemove, onTag, onShared, highlight = false, openComments = false,
}: {
  post: CommunityPost;
  me: Me;
  canModerate: boolean;
  onChange: (p: CommunityPost) => void;
  onRemove: (id: string) => void;
  onTag: (tag: string) => void;
  onShared?: (p: CommunityPost) => void;
  highlight?: boolean;
  openComments?: boolean;
}) {
  const { t } = useI18n();
  const [showComments, setShowComments] = useState(openComments);
  const [menu, setMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [reactorsOpen, setReactorsOpen] = useState(false);
  const [reactors, setReactors] = useState<{ type: ReactionType; user: { id: string; fullName: string; role: string; avatarUrl?: string | null } }[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const mine = post.author.id === me.id;
  const long = post.content.length > 420 && !expanded;

  async function react(type: ReactionType | null) {
    const prev = post;
    const byType = { ...post.reactions.byType };
    let total = post.reactions.total;
    if (post.myReaction) { byType[post.myReaction] = Math.max(0, (byType[post.myReaction] ?? 1) - 1); total--; }
    if (type) { byType[type] = (byType[type] ?? 0) + 1; total++; }
    onChange({ ...post, myReaction: type, reactions: { total, byType } });
    try { await communityApi.reactPost(post.id, type); } catch { onChange(prev); }
  }

  async function toggleSave() {
    onChange({ ...post, saved: !post.saved });
    setMenu(false);
    try { await communityApi.savePost(post.id); } catch { onChange(post); }
  }

  const [picks, setPicks] = useState<number[]>(post.poll?.myVotes ?? []);
  const [voting, setVoting] = useState(false);

  async function sendVotes(next: number[]) {
    if (!post.poll || voting) return;
    const old = post.poll;
    const options = old.options.map((o, i) => ({
      ...o,
      votes: o.votes - (old.myVotes.includes(i) ? 1 : 0) + (next.includes(i) ? 1 : 0),
    }));
    onChange({
      ...post,
      poll: { ...old, options, myVote: next[0] ?? null, myVotes: next, total: options.reduce((a, o) => a + o.votes, 0) },
    });
    setPicks(next);
    setVoting(true);
    try { await communityApi.vote(post.id, next); } catch { onChange(post); setPicks(old.myVotes); } finally { setVoting(false); }
  }

  function vote(idx: number) {
    if (!post.poll) return;
    if (post.poll.multi) {
      setPicks((p) => (p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx]));
    } else {
      void sendVotes(post.poll.myVotes.includes(idx) && post.poll.myVotes.length === 1 ? [] : [idx]);
    }
  }

  async function doShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const { post: p } = await communityApi.sharePost(post.sharedPost ? post.sharedPost.id : post.id, shareText.trim());
      onShared?.(p);
      setShareOpen(false);
      setShareText("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("تعذرت المشاركة"));
    } finally {
      setSharing(false);
    }
  }

  async function openReactors() {
    setReactorsOpen(true);
    communityApi.postReactions(post.id).then((r) => setReactors(r.reactions)).catch(() => {});
  }

  async function saveEdit() {
    try {
      const { post: p } = await communityApi.editPost(post.id, draft);
      onChange(p);
      setEditing(false);
    } catch { /* keep editing */ }
  }

  const imgs = post.images;
  const grid = imgs.length === 1 ? "grid-cols-1" : imgs.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <Card className={`p-0 transition ${highlight ? "ring-2 ring-brand" : ""} ${post.isPinned ? "border-gold/50" : ""}`}>
      <article className="p-4">
        {post.isPinned && <p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-gold"><Pin className="size-3.5" /> {t("منشور مثبّت من الإدارة")}</p>}
        {post.kind === "announcement" && (
          <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-l from-amber-100 to-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800">
            📢 {t("إعلان رسمي من الإدارة")}
          </p>
        )}
        {post.kind === "challenge" && (
          <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-l from-emerald-100 to-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
            🏆 {t("تحدي — أجب في التعليقات والإجابة الفائزة تكسب 10 نقاط")}
          </p>
        )}
        <header className="flex items-start gap-3">
          <Avatar user={post.author} size={44} />
          <div className="min-w-0 flex-1">
            <AuthorLine author={post.author} />
            <p className="mt-0.5 text-[11px] text-muted-foreground" title={fullDate(post.createdAt)}>
              {timeAgo(post.createdAt)} · {new Date(post.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })} {new Date(post.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              {post.updatedAt !== post.createdAt && post.content !== "" && ` · ${t("معدّل")}`}
            </p>
            {post.sharedPost && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-brand">
                <Share2 className="size-3" /> {t("شارك منشور")} {post.sharedPost.author.fullName}
              </p>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><MoreHorizontal className="size-5" /></button>
            {menu && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} aria-label="close" />
                <div className="absolute end-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-background py-1 text-sm shadow-xl">
                  <button onClick={toggleSave} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted">
                    {post.saved ? <BookmarkCheck className="size-4 text-brand" /> : <Bookmark className="size-4" />} {post.saved ? t("إلغاء الحفظ") : t("حفظ المنشور")}
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community?post=${post.id}`).catch(() => {}); setMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted"><Link2 className="size-4" /> {t("نسخ الرابط")}</button>
                  {mine && <button onClick={() => { setEditing(true); setMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted"><Pencil className="size-4" /> {t("تعديل")}</button>}
                  {canModerate && (
                    <button onClick={() => { communityApi.pinPost(post.id).then((r) => onChange({ ...post, isPinned: r.isPinned })).catch(() => {}); setMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-gold hover:bg-gold/10">{post.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />} {post.isPinned ? t("إلغاء التثبيت") : t("تثبيت")}</button>
                  )}
                  {canModerate && !mine && post.author.role !== "SUPER_ADMIN" && post.author.role !== "ADMIN" && (
                    <button onClick={() => { if (window.confirm(`${t("كتم")} ${post.author.fullName}؟`)) communityApi.mute(post.author.id).then(() => window.alert(t("تم الكتم"))).catch(() => {}); setMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted"><VolumeX className="size-4" /> {t("كتم الكاتب")}</button>
                  )}
                  {(mine || canModerate) && (
                    <button onClick={() => { if (window.confirm(t("حذف المنشور نهائياً؟"))) communityApi.deletePost(post.id).then(() => onRemove(post.id)).catch(() => {}); setMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10"><Trash2 className="size-4" /> {t("حذف")}</button>
                  )}
                  {!mine && (
                    <button onClick={() => { const r = window.prompt(t("سبب البلاغ (اختياري)")) ?? ""; communityApi.reportPost(post.id, r).then(() => window.alert(t("تم إرسال البلاغ"))).catch(() => {}); setMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted"><Flag className="size-4" /> {t("إبلاغ")}</button>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {editing ? (
          <div className="mt-3">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand" />
            <div className="mt-2 flex gap-2">
              <Button className="text-xs" onClick={saveEdit}>{t("حفظ")}</Button>
              <Button className="text-xs" variant="secondary" onClick={() => { setEditing(false); setDraft(post.content); }}>{t("إلغاء")}</Button>
            </div>
          </div>
        ) : (
          post.content && (
            <div className="mt-3 text-[15px] leading-7">
              <RichText text={long ? post.content.slice(0, 420) + "…" : post.content} onTag={onTag} />
              {post.content.length > 420 && (
                <button onClick={() => setExpanded((v) => !v)} className="ms-1 text-sm font-semibold text-brand hover:underline">{expanded ? t("عرض أقل") : t("عرض المزيد")}</button>
              )}
            </div>
          )
        )}

        {!editing && post.content && (
          <div className="mt-1.5">
            {translated ? (
              <div className="rounded-xl bg-brand/5 px-3 py-2 text-sm leading-6 text-ink">
                <p className="text-[10px] font-bold text-brand">{t("الترجمة العربية")}</p>
                <p className="mt-0.5 whitespace-pre-wrap" dir="auto">{translated}</p>
                <button onClick={() => setTranslated(null)} className="mt-1 text-[10px] font-semibold text-muted-foreground hover:underline">{t("إخفاء الترجمة")}</button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setTranslating(true);
                  try {
                    const r = await communityApi.translate(post.content.slice(0, 1500));
                    setTranslated(r.translated);
                  } catch { setTranslated(t("تعذرت الترجمة")); } finally { setTranslating(false); }
                }}
                disabled={translating}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition hover:text-brand"
              >
                <Languages className="size-3.5" /> {translating ? t("جاري الترجمة...") : t("عرض الترجمة")}
              </button>
            )}
          </div>
        )}

        {imgs.length > 0 && (
          <div className={`mt-3 grid gap-1.5 overflow-hidden rounded-xl ${grid}`}>
            {imgs.map((src) => (
              <button key={src} onClick={() => setLightbox(mediaSrc(src))} className="overflow-hidden bg-muted">
                <img src={mediaSrc(src)} alt="" loading="lazy" className={`w-full object-cover transition hover:scale-105 ${imgs.length === 1 ? "max-h-[28rem]" : "h-44"}`} />
              </button>
            ))}
          </div>
        )}
        {post.fileUrl && !isImageUrl(post.fileUrl, post.fileName) && (
          <a href={mediaSrc(post.fileUrl)} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-muted">
            <Paperclip className="size-4 shrink-0" /> <span className="truncate">{post.fileName ?? t("ملف مرفق")}</span>
          </a>
        )}

        {post.poll && (
          <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <p className="flex items-center gap-1.5 text-sm font-bold"><BarChart3 className="size-4 text-brand" /> {post.poll.question}</p>
            {post.poll.options.map((o, i) => {
              const pct = post.poll!.total ? Math.round((o.votes / post.poll!.total) * 100) : 0;
              const chosen = post.poll!.multi ? picks.includes(i) || post.poll!.myVotes.includes(i) : post.poll!.myVote === i;
              return (
                <button key={i} onClick={() => vote(i)} className={`relative block w-full overflow-hidden rounded-lg border text-start text-sm transition ${chosen ? "border-brand" : "border-border hover:border-brand/50"}`}>
                  <span className={`absolute inset-y-0 start-0 transition-all ${chosen ? "bg-brand/25" : "bg-brand/10"}`} style={{ width: `${pct}%` }} />
                  <span className="relative flex items-center justify-between gap-2 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 font-semibold">
                      {o.image && <img src={mediaSrc(o.image)} alt="" className="size-9 shrink-0 rounded-md object-cover" />}
                      <span className="truncate">{o.text}{chosen && " ✓"}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{pct}% · {o.votes}</span>
                  </span>
                </button>
              );
            })}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">{post.poll.total} {t("صوت")}{post.poll.multi ? ` · ${t("اختيار متعدد")}` : ""}</p>
              {post.poll.multi && (
                <button onClick={() => sendVotes(picks)} disabled={voting || (picks.length === post.poll!.myVotes.length && picks.every((x) => post.poll!.myVotes.includes(x)))}
                  className="rounded-lg bg-brand px-3 py-1 text-[11px] font-bold text-white transition active:scale-95 disabled:opacity-40">
                  {voting ? t("جاري التصويت...") : t("تصويت")}
                </button>
              )}
            </div>
          </div>
        )}

        {post.sharedPost && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Avatar user={post.sharedPost.author} size={30} />
                <div className="min-w-0 flex-1">
                  <AuthorLine author={post.sharedPost.author} />
                  <p className="text-[10px] text-muted-foreground" title={fullDate(post.sharedPost.createdAt)}>{timeAgo(post.sharedPost.createdAt)}</p>
                </div>
              </div>
              {post.sharedPost.content && (
                <p className="mt-2 line-clamp-4 text-sm leading-6"><RichText text={post.sharedPost.content} onTag={onTag} /></p>
              )}
              {post.sharedPost.fileUrl && !isImageUrl(post.sharedPost.fileUrl, post.sharedPost.fileName) && (
                <a href={mediaSrc(post.sharedPost.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
                  <Paperclip className="size-3.5" /> <span className="truncate">{post.sharedPost.fileName ?? t("ملف مرفق")}</span>
                </a>
              )}
            </div>
            {post.sharedPost.images.length > 0 && (
              <div className={`grid gap-0.5 ${post.sharedPost.images.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
                {post.sharedPost.images.slice(0, 3).map((src) => (
                  <img key={src} src={mediaSrc(src)} alt="" loading="lazy" className="h-28 w-full object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        {(post.reactions.total > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            {post.reactions.total > 0 ? (
              <button onClick={openReactors} className="flex items-center gap-1.5 hover:underline"><ReactionStack byType={post.reactions.byType} /> {post.reactions.total}</button>
            ) : <span />}
            <span className="flex items-center gap-3">
              {post.commentsCount > 0 && <button onClick={() => setShowComments((v) => !v)} className="hover:underline">{post.commentsCount} {t("تعليق")}</button>}
              {post.sharesCount > 0 && <span>{post.sharesCount} {t("مشاركة")}</span>}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 border-y border-border py-1">
          <ReactionButton value={post.myReaction} onChange={react} />
          <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted active:scale-95">
            <MessageCircle className="size-[18px]" /> {t("تعليق")}
          </button>
          {!mine && (
            <button onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted active:scale-95">
              <Share2 className="size-[18px]" /> {t("مشاركة")}
            </button>
          )}
          <button onClick={toggleSave} className={`ms-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:bg-muted active:scale-95 ${post.saved ? "text-brand" : "text-muted-foreground"}`}>
            {post.saved ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />} {post.saved ? t("محفوظ") : t("حفظ")}
          </button>
        </div>

        {showComments && (
          <div className="mt-3">
            <CommentsSection post={post} me={me} canModerate={canModerate} onCount={(n) => onChange({ ...post, commentsCount: n })} />
          </div>
        )}
      </article>

      {lightbox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          <button className="absolute end-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white"><X className="size-5" /></button>
        </div>
      )}
      {reactorsOpen && (
        <Modal title={t("التفاعلات")} onClose={() => setReactorsOpen(false)}>
          <div className="space-y-2">
            {reactors.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="relative"><Avatar user={r.user} size={36} /><span className="absolute -bottom-1 -end-1 text-sm">{reactionMeta(r.type)?.emoji}</span></span>
                <span className="text-sm font-semibold">{r.user.fullName}</span>
                <span className="ms-auto"><RoleBadge role={r.user.role} /></span>
              </div>
            ))}
            {reactors.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">{t("جاري التحميل...")}</p>}
          </div>
        </Modal>
      )}
      {shareOpen && (
        <Modal title={t("مشاركة المنشور")} onClose={() => setShareOpen(false)}>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Avatar user={post.sharedPost ? post.sharedPost.author : post.author} size={28} />
                <span className="truncate text-xs font-semibold">{(post.sharedPost ?? post).author.fullName}</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{(post.sharedPost ?? post).content || t("مرفقات")}</p>
            </div>
            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={3}
              placeholder={t("أضف تعليقاً على المشاركة (اختياري)...")}
              className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand"
            />
            <Button className="w-full" disabled={sharing} onClick={doShare}>
              <Share2 className="size-4" /> {sharing ? t("جاري المشاركة...") : t("مشاركة على خلاصتي")}
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

// ─── Feed list with infinite loading ─────────────────────────────────────────
export function FeedView({
  mode, roles, tag, onTag, me, access, focusPostId,
}: {
  mode: "feed" | "saved" | "mine";
  roles: string[];
  tag: string;
  onTag: (t: string) => void;
  me: Me;
  access: CommunityAccess;
  focusPostId: string | null;
}) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const rolesKey = roles.join(",");

  const load = useCallback(async (cur: string | null) => {
    setLoading(true);
    try {
      const r = await communityApi.feed({
        cursor: cur,
        ...(tag ? { tag } : {}),
        ...(mode === "mine" ? { authorId: me.id } : {}),
        ...(mode === "saved" ? { saved: true } : {}),
        ...(roles.length ? { roles } : {}),
      });
      setPosts((prev) => {
        if (cur) return [...prev, ...r.posts.filter((p) => !prev.some((x) => x.id === p.id))];
        return r.posts;
      });
      setCursor(r.nextCursor);
      if (!cur) setNewCount(0);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [mode, tag, rolesKey, me.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(null); }, [load]);

  // Deep-linked post (from a notification) is fetched and shown on top
  useEffect(() => {
    if (!focusPostId) return;
    communityApi.post(focusPostId).then((r) => {
      setPosts((prev) => (prev.some((p) => p.id === r.post.id) ? prev : [r.post, ...prev]));
    }).catch(() => {});
  }, [focusPostId]);

  useEffect(() => subscribeRealtime((event, data) => {
    if (event === "community:post" && data?.authorId !== me.id && mode === "feed" && !tag) setNewCount((n) => n + 1);
  }), [me.id, mode, tag]);

  const update = (p: CommunityPost) => setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  const remove = (id: string) => setPosts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="space-y-4">
      {mode === "feed" && !tag && <StoriesBar me={me} canModerate={access.canModerate} blocked={!access.postsEnabled && !access.canModerate || (access.muted && !access.canModerate)} />}
      {mode === "feed" && !tag && <Composer me={me} access={access} onPosted={(p) => setPosts((prev) => [p, ...prev])} />}
      {tag && (
        <div className="flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
          {t("وسم")}: {tag}
          <button onClick={() => onTag("")} className="ms-auto text-xs underline">{t("إلغاء الفلتر")}</button>
        </div>
      )}
      {newCount > 0 && (
        <button onClick={() => load(null)} className="w-full rounded-xl bg-brand py-2 text-sm font-bold text-white shadow transition active:scale-[0.99]">
          {newCount} {t("منشور جديد — اضغط للتحديث")}
        </button>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} me={me} canModerate={access.canModerate} onChange={update} onRemove={remove} onTag={onTag}
          onShared={(np) => setPosts((prev) => [np, ...prev])}
          highlight={p.id === focusPostId} openComments={p.id === focusPostId} />
      ))}
      {loading && <p className="py-6 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</p>}
      {!loading && posts.length === 0 && (
        <Card className="py-12 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-brand/10 text-3xl">{mode === "saved" ? "🔖" : "💬"}</div>
          <p className="text-sm font-semibold">{mode === "saved" ? t("لا توجد منشورات محفوظة") : mode === "mine" ? t("لم تنشر شيئاً بعد") : t("لا توجد منشورات بعد — ابدأ النقاش!")}</p>
        </Card>
      )}
      {cursor && !loading && (
        <Button variant="secondary" className="w-full" onClick={() => load(cursor)}>{t("تحميل المزيد")}</Button>
      )}
    </div>
  );
}

// ─── Stories (24h) ───────────────────────────────────────────────────────────
const STORY_MS = 5000;

export function StoriesBar({ me, canModerate, blocked }: { me: Me; canModerate: boolean; blocked: boolean }) {
  const { t } = useI18n();
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    communityApi.stories().then((r) => setStories(r.stories)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeRealtime((event, data) => {
    if (event === "community:story" && data?.authorId !== me.id) load();
  }), [load, me.id]);

  const groups = useMemo(() => {
    const m = new Map<string, { author: CommunityAuthor; items: CommunityStory[] }>();
    for (const s of stories) {
      const g = m.get(s.author.id) ?? { author: s.author, items: [] };
      g.items.push(s);
      m.set(s.author.id, g);
    }
    return [...m.values()];
  }, [stories]);
  const myStories = groups.find((g) => g.author.id === me.id)?.items ?? [];

  async function pickFile(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const up = await uploadFile(f, "community");
      await communityApi.addStory(up.url);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("تعذر نشر القصة"));
    } finally {
      setUploading(false);
    }
  }

  if (!stories.length && blocked) return null;

  return (
    <Card className="p-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* Add story */}
        {!blocked && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="group flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="relative">
              <span className={`block rounded-full p-[3px] ${myStories.length ? "bg-gradient-to-tr from-brand to-emerald-400" : "bg-muted"}`}>
                <span className="block rounded-full bg-card p-[2px]"><Avatar user={me} size={52} clickable={false} /></span>
              </span>
              <span className="absolute -bottom-0.5 -end-0.5 grid size-5 place-items-center rounded-full border-2 border-card bg-brand text-white">
                {uploading ? <span className="size-2 animate-spin rounded-full border border-white/40 border-t-white" /> : <Plus className="size-3" />}
              </span>
            </span>
            <span className="max-w-16 truncate text-[10px] font-semibold text-muted-foreground">{t("قصتك")}</span>
          </button>
        )}

        {groups.map((g) => {
          const firstIdx = stories.findIndex((s) => s.id === g.items[0]!.id);
          return (
            <button key={g.author.id} onClick={() => setViewerAt(firstIdx)} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <span className="block rounded-full bg-gradient-to-tr from-brand via-emerald-400 to-gold p-[3px]">
                <span className="block rounded-full bg-card p-[2px]"><Avatar user={g.author} size={52} clickable={false} /></span>
              </span>
              <span className="max-w-16 truncate text-[10px] font-semibold text-muted-foreground">{g.author.fullName.split(" ")[0]}</span>
            </button>
          );
        })}
        {groups.length === 0 && <p className="self-center text-xs text-muted-foreground">{t("لا قصص بعد — شارك لحظة من يومك ✨")}</p>}
      </div>

      {viewerAt !== null && createPortal(
        <StoryViewer
          stories={stories}
          start={viewerAt}
          me={me}
          canModerate={canModerate}
          onClose={() => setViewerAt(null)}
          onDeleted={(id) => setStories((prev) => prev.filter((s) => s.id !== id))}
        />,
        document.body
      )}
    </Card>
  );
}

function StoryViewer({
  stories, start, me, canModerate, onClose, onDeleted,
}: {
  stories: CommunityStory[];
  start: number;
  me: Me;
  canModerate: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(start);
  const [viewersOpen, setViewersOpen] = useState(false);
  const story = stories[idx];

  const go = useCallback((d: number) => {
    setIdx((i) => {
      const n = i + d;
      if (n < 0) return 0;
      if (n >= stories.length) { onClose(); return i; }
      return n;
    });
  }, [stories.length, onClose]);

  useEffect(() => {
    const h = setTimeout(() => go(1), STORY_MS);
    return () => clearTimeout(h);
  }, [idx, go]);

  // Record the view (server ignores self-views)
  useEffect(() => {
    if (story) void communityApi.viewStory(story.id).catch(() => {});
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!story) return null;
  const canDelete = story.author.id === me.id || canModerate;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95" onClick={onClose}>
      <div className="relative flex h-full max-h-[92vh] w-full max-w-md flex-col" onClick={(e) => e.stopPropagation()}>
        {/* progress segments */}
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {stories.map((s, i) => (
            <span key={s.id} className={`h-1 flex-1 rounded-full ${i < idx ? "bg-white" : i === idx ? "bg-white/90" : "bg-white/30"}`}
              style={i === idx ? { animation: `storyProgress ${STORY_MS}ms linear forwards`, transformOrigin: "left" } : undefined} />
          ))}
        </div>
        {/* header */}
        <div className="absolute inset-x-0 top-6 z-10 flex items-center gap-2 px-4">
          <Avatar user={story.author} size={34} />
          <div className="min-w-0 flex-1 text-white">
            <p className="truncate text-sm font-bold drop-shadow">{story.author.fullName}</p>
            <p className="text-[11px] text-white/70">{timeAgo(story.createdAt)}</p>
          </div>
          {canDelete && (
            <button
              onClick={() => {
                if (!window.confirm(t("حذف القصة؟"))) return;
                communityApi.deleteStory(story.id).then(() => {
                  onDeleted(story.id);
                  stories.length <= 1 ? onClose() : setIdx((i) => Math.min(i, stories.length - 2));
                }).catch(() => {});
              }}
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            ><Trash2 className="size-4" /></button>
          )}
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><X className="size-5" /></button>
        </div>
        {/* media */}
        <img src={mediaSrc(story.mediaUrl)} alt="" className="m-auto max-h-full max-w-full rounded-2xl object-contain" />
        {story.caption && (
          <p className="absolute inset-x-0 bottom-10 z-10 mx-4 rounded-xl bg-black/50 px-4 py-2.5 text-center text-sm text-white backdrop-blur">{story.caption}</p>
        )}
        {/* viewers — own stories only */}
        {story.author.id === me.id && (
          <button onClick={() => setViewersOpen(true)}
            className="absolute bottom-3 start-4 z-10 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
            👁 {story.viewCount ?? 0} {t("مشاهدة")}
          </button>
        )}
        {viewersOpen && (
          <div className="absolute inset-x-4 bottom-14 z-20 max-h-64 overflow-y-auto rounded-2xl bg-black/85 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-white">{t("شاهدوا قصتك")} ({story.viewers?.length ?? 0})</p>
              <button onClick={() => setViewersOpen(false)} className="grid size-7 place-items-center rounded-full bg-white/10 text-white"><X className="size-4" /></button>
            </div>
            <div className="space-y-2">
              {(story.viewers ?? []).map((v) => (
                <div key={v.id} className="flex items-center gap-2.5">
                  <Avatar user={v} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{v.fullName}</span>
                  <span className="text-[10px] text-white/60">{timeAgo(v.viewedAt)}</span>
                </div>
              ))}
              {(story.viewers ?? []).length === 0 && <p className="py-3 text-center text-xs text-white/60">{t("لا مشاهدات بعد")}</p>}
            </div>
          </div>
        )}
        {/* nav arrows */}
        {idx > 0 && (
          <button onClick={() => go(-1)} className="absolute start-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"><ChevronRight className="size-5" /></button>
        )}
        {idx < stories.length - 1 && (
          <button onClick={() => go(1)} className="absolute end-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"><ChevronLeft className="size-5" /></button>
        )}
      </div>
      <style>{`@keyframes storyProgress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
    </div>
  );
}
