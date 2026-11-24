import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Bookmark, Flame, Hash, Home, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { AppShell, PageHeader } from "./app-shell";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../hooks/use-auth";
import { usePlatformStore } from "../hooks/use-platform-store";
import type { UserRole } from "../lib/auth";
import { communityApi, timeAgo, type CommunityAccess, type CommunitySidebar } from "../lib/community";
import { subscribeRealtime } from "../lib/realtime";
import { Card } from "./ui";
import { Avatar, OpenProfileContext, RoleBadge } from "./community-common";
import { MemberProfileModal } from "./community-profile";
import { FeedView, type Me } from "./community-feed";
import { CommunityChat } from "./community-chat";
import { CommunityAdmin } from "./community-admin";

type Tab = "feed" | "saved" | "mine" | "chat" | "notifs" | "admin";

const ROLE_FILTERS: { key: string; label: string; roles: string[] }[] = [
  { key: "all", label: "الكل", roles: [] },
  { key: "teachers", label: "المدرسون", roles: ["TEACHER"] },
  { key: "students", label: "الطلاب", roles: ["STUDENT"] },
  { key: "staff", label: "الإدارة", roles: ["ADMIN", "SUPER_ADMIN"] },
];

export function CommunityScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialTab = (params.get("tab") as Tab | null) ?? "feed";
  const focusPostId = params.get("post");

  const [tab, setTab] = useState<Tab>(initialTab);
  const [tag, setTag] = useState("");
  const [roleKey, setRoleKey] = useState("all");
  const [access, setAccess] = useState<CommunityAccess | null>(null);
  const [denied, setDenied] = useState(false);
  const [side, setSide] = useState<CommunitySidebar | null>(null);
  const [feedDot, setFeedDot] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { notifications, fetchNotifications, markNotificationRead } = usePlatformStore();
  const communityNotifs = notifications.filter((n) => n.type.startsWith("community"));
  const notifDot = communityNotifs.filter((n) => !n.readAt).length;

  const loadAccess = useCallback(() => {
    communityApi.access().then((a) => { setAccess(a); setDenied(!a.visible); }).catch(() => setDenied(true));
  }, []);

  useEffect(() => { if (user) loadAccess(); }, [user, loadAccess]);

  useEffect(() => {
    if (!access?.visible) return;
    const load = () => communityApi.sidebar().then(setSide).catch(() => {});
    load();
    const h = setInterval(load, 30000);
    return () => clearInterval(h);
  }, [access?.visible]);

  // Red dot on the feed icon when new posts arrive while on another tab
  useEffect(() => subscribeRealtime((event, data) => {
    if (event === "community:post" && data?.authorId !== user?.id) setFeedDot(true);
  }), [user?.id]);
  useEffect(() => { if (tab === "feed") setFeedDot(false); }, [tab]);
  useEffect(() => { if (tab === "notifs") fetchNotifications().catch(() => {}); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const role = ((user?.role ?? "STUDENT") as UserRole);
  const me: Me | null = user ? { id: user.id, fullName: user.fullName, role: user.role, avatarUrl: (user as { avatarUrl?: string | null }).avatarUrl ?? null } : null;

  const pickTag = (v: string) => { setTag(v.replace(/^#/, "")); if (v) setTab("feed"); };

  const navItems: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: "feed", label: "الخلاصة", icon: Home },
    { key: "saved", label: "المحفوظات", icon: Bookmark },
    { key: "mine", label: "منشوراتي", icon: UserRound },
    { key: "chat", label: "شات المجتمع", icon: MessageCircle },
    { key: "notifs", label: "الإشعارات", icon: Bell },
    ...(access?.canModerate ? [{ key: "admin" as Tab, label: "الإدارة", icon: ShieldCheck }] : []),
  ];

  return (
    <AppShell role={role}>
      <PageHeader title={t("المجتمع")} subtitle={t("شارك، تفاعل، وتعلّم مع باقي أعضاء الأكاديمية")} />

      {denied ? (
        <Card className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-muted text-3xl">🔒</div>
          <p className="text-sm font-semibold">{t("المجتمع غير متاح لحسابك حالياً")}</p>
        </Card>
      ) : !access || !me ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</p>
      ) : (
        <OpenProfileContext.Provider value={setProfileId}>
        <div className="grid gap-4 pb-24 lg:grid-cols-[200px_minmax(0,1fr)] lg:pb-0 xl:grid-cols-[200px_minmax(0,1fr)_290px]">
          {/* ── Left nav (desktop) ── */}
          <aside className="hidden lg:block">
            <Card className="sticky top-4 space-y-1 p-3">
              {navItems.map((n) => (
                <button key={n.key} onClick={() => { setTab(n.key); setTag(""); }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${tab === n.key ? "bg-brand text-white shadow" : "text-muted-foreground hover:bg-muted"}`}>
                  <n.icon className="size-[18px]" /> {t(n.label)}
                  {n.key === "notifs" && notifDot > 0 && (
                    <span className="ms-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{notifDot}</span>
                  )}
                </button>
              ))}
              {tab === "feed" && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("تصفية حسب الكاتب")}</p>
                  {ROLE_FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setRoleKey(f.key)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${roleKey === f.key ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted"}`}>
                      <span className={`size-2 rounded-full ${roleKey === f.key ? "bg-brand" : "bg-border"}`} /> {t(f.label)}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </aside>

          {/* ── Main column ── */}
          <main className="min-w-0 space-y-4">
            {tab === "feed" && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
                {ROLE_FILTERS.map((f) => (
                  <button key={f.key} onClick={() => setRoleKey(f.key)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${roleKey === f.key ? "bg-brand/15 text-brand" : "bg-muted/60 text-muted-foreground"}`}>{t(f.label)}</button>
                ))}
              </div>
            )}

            {(tab === "feed" || tab === "saved" || tab === "mine") && (
              <FeedView
                key={`${tab}-${roleKey}-${tag}`}
                mode={tab}
                roles={tab === "feed" ? ROLE_FILTERS.find((f) => f.key === roleKey)?.roles ?? [] : []}
                tag={tag}
                onTag={pickTag}
                me={me}
                access={access}
                focusPostId={tab === "feed" ? focusPostId : null}
              />
            )}
            {tab === "chat" && <CommunityChat me={me} access={access} />}
            {tab === "notifs" && (
              <Card className="p-0">
                <p className="border-b border-border px-4 py-3 text-sm font-bold">{t("إشعارات المجتمع")}</p>
                {communityNotifs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t("لا إشعارات بعد")}</p>}
                <div className="divide-y divide-border">
                  {communityNotifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id).catch(() => {});
                        if (n.link) window.location.href = n.link;
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-start transition hover:bg-muted/40"
                    >
                      <span className={`mt-1 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-brand"}`} />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm">{n.title}</b>
                        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                        <small className="mt-0.5 block text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
            {tab === "admin" && access.canModerate && <CommunityAdmin onAccessChange={loadAccess} />}
          </main>

          {/* ── Right widgets ── */}
          <aside className="hidden space-y-4 xl:block">
            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Flame className="size-4 text-orange-500" /> {t("الأكثر تفاعلاً هذا الأسبوع")}</h3>
              {(side?.trending ?? []).length === 0 && <p className="text-xs text-muted-foreground">{t("لا توجد بيانات بعد")}</p>}
              <div className="space-y-2.5">
                {(side?.trending ?? []).map((p, i) => (
                  <a key={p.id} href={`/community?post=${p.id}`} className="block rounded-lg p-2 transition hover:bg-muted">
                    <p className="flex items-start gap-2 text-xs">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">{i + 1}</span>
                      <span className="line-clamp-2 font-semibold">{p.snippet}</span>
                    </p>
                    <p className="mt-1 ps-7 text-[10px] text-muted-foreground">{p.author} · ❤️ {p.reactions} · 💬 {p.comments}</p>
                  </a>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Hash className="size-4 text-brand" /> {t("وسوم رائجة")}</h3>
              {(side?.tags ?? []).length === 0 && <p className="text-xs text-muted-foreground">{t("استخدم # في منشورك لإنشاء وسم")}</p>}
              <div className="flex flex-wrap gap-1.5">
                {(side?.tags ?? []).map((tg) => (
                  <button key={tg.tag} onClick={() => pickTag(tg.tag)} className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition hover:brightness-95">
                    {tg.tag} <span className="text-[10px] opacity-70">{tg.count}</span>
                  </button>
                ))}
              </div>
            </Card>

            {(side?.topContributors ?? []).length > 0 && (
              <Card className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">🏆 {t("نجوم المجتمع")}</h3>
                <div className="space-y-2">
                  {side!.topContributors!.map((u, i) => (
                    <button key={u.id} onClick={() => setProfileId(u.id)} className="flex w-full items-center gap-2 rounded-lg p-1 transition hover:bg-muted">
                      <span className="grid size-5 shrink-0 place-items-center text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                      <Avatar user={u} size={28} />
                      <span className="min-w-0 flex-1 truncate text-start text-xs font-semibold">{u.fullName}</span>
                      <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">{u.communityPoints} {t("نقطة")}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <span className="size-2.5 animate-pulse rounded-full bg-sage" /> {t("المتصلون الآن")}
                <span className="ms-auto rounded-full bg-sage/15 px-2 py-0.5 text-[11px] text-sage">{side?.onlineCount ?? 0}</span>
              </h3>
              <div className="space-y-2">
                {(side?.online ?? []).slice(0, 10).map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <span className="relative"><Avatar user={u} size={30} /><span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-background bg-sage" /></span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">{u.fullName}</span>
                    <RoleBadge role={u.role} />
                  </div>
                ))}
                {(side?.onlineCount ?? 0) === 0 && <p className="text-xs text-muted-foreground">{t("لا أحد متصل حالياً")}</p>}
              </div>
            </Card>
          </aside>
        </div>
        </OpenProfileContext.Provider>
      )}

      {profileId && createPortal(<MemberProfileModal userId={profileId} onClose={() => setProfileId(null)} />, document.body)}

      {/* ── Mobile bottom nav: icons only, active tab inside a circle ──
          Rendered via portal: the <main> ancestor has an enter animation with
          transform, which would otherwise break position:fixed. */}
      {!denied && access && createPortal(
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex max-w-md items-center justify-around px-3 py-2">
            {navItems.map((n) => {
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  aria-label={t(n.label)}
                  title={t(n.label)}
                  onClick={() => { setTab(n.key); setTag(""); window.scrollTo({ top: 0 }); }}
                  className="relative grid place-items-center py-1"
                >
                  <span
                    className={`grid size-11 place-items-center rounded-full transition-all duration-200 ${
                      active
                        ? "scale-110 bg-gradient-to-br from-brand to-emerald-500 text-white shadow-lg shadow-brand/40"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <n.icon className="size-[22px]" />
                  </span>
                  {active && <span className="absolute -top-0.5 size-1.5 rounded-full bg-brand" />}
                  {n.key === "feed" && feedDot && (
                    <span className="absolute -end-0.5 top-0.5 size-2.5 animate-pulse rounded-full bg-danger shadow ring-2 ring-card" />
                  )}
                  {n.key === "notifs" && notifDot > 0 && (
                    <span className="absolute -end-0.5 top-0 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow">
                      {notifDot}
                    </span>
                  )}
                  {n.key === "chat" && (side?.onlineCount ?? 0) > 0 && (
                    <span className="absolute -end-0.5 top-0 grid min-w-5 place-items-center rounded-full bg-sage px-1 text-[10px] font-bold text-white shadow">
                      {side!.onlineCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>,
        document.body
      )}
    </AppShell>
  );
}
