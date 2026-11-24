import { useEffect, useRef, useState } from "react";
import { Camera, MessageCircle, MessagesSquare, ThumbsUp, X } from "lucide-react";
import { apiFetch, mediaSrc, uploadFile } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../hooks/use-auth";
import { communityApi, timeAgo, type CommunityMember, type CommunityPost } from "../lib/community";
import { Avatar, LangChip, RoleBadge } from "./community-common";

export function MemberProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const [member, setMember] = useState<CommunityMember | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mine = user?.id === userId;

  useEffect(() => {
    setMember(null);
    setError(false);
    communityApi.memberProfile(userId)
      .then((r) => { setMember(r.member); setPosts(r.posts); })
      .catch(() => setError(true));
  }, [userId]);

  async function pickAvatar(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const up = await uploadFile(f, "community");
      await apiFetch("/api/auth/me", { method: "PATCH", body: { avatarUrl: up.url } });
      await refreshUser().catch(() => {});
      setMember((m) => (m ? { ...m, avatarUrl: up.url } : m));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("تعذر تغيير الصورة"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{t("تعذر تحميل الملف الشخصي")}</p>
            <button onClick={onClose} className="mt-4 text-xs font-bold text-brand hover:underline">{t("إغلاق")}</button>
          </div>
        ) : !member ? (
          <p className="p-10 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</p>
        ) : (
          <>
            {/* cover strip */}
            <div className="relative h-20 rounded-t-2xl bg-gradient-to-l from-brand/70 via-emerald-500/60 to-gold/50" />
            <button onClick={onClose} className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50">
              <X className="size-4" />
            </button>

            <div className="px-5 pb-5">
              {/* avatar + name */}
              <div className="-mt-9 flex items-end gap-3">
                <span className="relative rounded-full bg-background p-1 shadow-md">
                  <Avatar user={member} size={76} clickable={false} />
                  {mine && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      title={t("تغيير الصورة")}
                      className="absolute -bottom-1 -end-1 grid size-7 place-items-center rounded-full border-2 border-background bg-brand text-white shadow transition hover:brightness-110"
                    >
                      {uploading ? <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Camera className="size-3.5" />}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickAvatar(e.target.files?.[0]); e.target.value = ""; }} />
                </span>
                <div className="min-w-0 pb-1">
                  <h3 className="truncate text-lg font-extrabold">{member.fullName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <RoleBadge role={member.role} />
                    {member.role === "STUDENT" && <LangChip lang={member.learningLanguage} />}
                    {member.level && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{member.level}</span>}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                {t("عضو منذ")} {new Date(member.createdAt).toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}
              </p>

              {/* stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: MessagesSquare, label: t("منشور"), value: member.stats.posts },
                  { icon: MessageCircle, label: t("تعليق"), value: member.stats.comments },
                  { icon: ThumbsUp, label: t("تفاعل"), value: member.stats.reactions },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/50 py-3">
                    <s.icon className="mx-auto size-4 text-brand" />
                    <p className="mt-1 text-base font-extrabold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* recent posts */}
              <h4 className="mt-5 mb-2 text-sm font-bold">{t("أحدث المنشورات")}</h4>
              {posts.length === 0 ? (
                <p className="rounded-xl bg-muted/40 py-6 text-center text-xs text-muted-foreground">{t("لا توجد منشورات بعد")}</p>
              ) : (
                <div className="space-y-2">
                  {posts.map((p) => (
                    <a key={p.id} href={`/community?post=${p.id}`} className="block rounded-xl border border-border p-3 transition hover:bg-muted/40">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {p.content || (p.images.length ? "📷" : "") + (p.poll ? `📊 ${p.poll.question}` : "") || t("منشور")}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(p.createdAt)} · ❤️ {p.reactions.total} · 💬 {p.commentsCount}
                        {p.isPinned && ` · 📌`}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
