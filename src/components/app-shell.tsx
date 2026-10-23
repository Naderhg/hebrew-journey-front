import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  LineChart,
  Wallet,
  FileCheck,
  Film,
  GraduationCap,
  Gift,
  Headphones,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  TicketCheck,
  Upload,
  UserPlus,
  UsersRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { usePlatformStore } from "../hooks/use-platform-store";
import { getHomeRouteForRole, ROLE_LABELS, type UserRole } from "../lib/auth";
import { Badge, Button, Card } from "./ui";

export interface SidebarItem {
  to: string;
  section?: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarGroup {
  group: string;
  icon: LucideIcon;
  items: SidebarItem[];
}

type NavEntry = SidebarItem | SidebarGroup;

const ShellToolsContext = createContext<ReactNode>(null);

function isGroup(entry: NavEntry): entry is SidebarGroup {
  return "group" in entry;
}

const studentNav: readonly SidebarItem[] = [
  { to: "/dashboard", label: "لوحة الطالب", icon: LayoutDashboard },
  { to: "/sessions", label: "حصصي الفردية", icon: CalendarCheck },
  { to: "/wallet", label: "محفظتي", icon: Wallet },
  { to: "/free-lectures", label: "المحاضرة المجانية", icon: Gift },
  { to: "/courses", label: "كورساتي", icon: Film },
  { to: "/lectures", label: "المحاضرات والمواعيد", icon: CalendarDays },
  { to: "/homework", label: "الواجبات", icon: ClipboardList },
  { to: "/exams", label: "الامتحانات", icon: FileCheck },
  { to: "/placement", label: "اختبار المستوى", icon: ClipboardCheck },
  { to: "/certificates", label: "شهاداتي", icon: GraduationCap },
  { to: "/plan", label: "خطة التعلم", icon: BookOpen },
  { to: "/conversation", label: "المحادثة الذكية", icon: MessageCircle },
  { to: "/chats", label: "المحادثات", icon: Headphones },
  { to: "/scenarios", label: "مكتبة السيناريوهات", icon: Library },
  { to: "/mistakes", label: "سجل الأخطاء", icon: Bot },
  { to: "/progress", label: "التقدم والمهارات", icon: BarChart3 },
];

const teacherNav: readonly NavEntry[] = [
  { to: "/teacher", section: "students", label: "طلابي وتقدمهم", icon: UsersRound },
  {
    group: "المواعيد والحضور",
    icon: CalendarDays,
    items: [
      { to: "/teacher", section: "sessions", label: "مواعيدي المتاحة", icon: CalendarCheck },
      { to: "/teacher", section: "schedule", label: "جدولي", icon: CalendarDays },
      { to: "/teacher", section: "attendance", label: "الحضور والغياب", icon: TicketCheck },
    ],
  },
  {
    group: "المحتوى التعليمي",
    icon: BookOpen,
    items: [
      { to: "/teacher", section: "materials", label: "الكورسات والماتيريال", icon: Film },
      { to: "/teacher", section: "exams", label: "الامتحانات والنتائج", icon: FileCheck },
      { to: "/teacher", section: "homework", label: "الواجبات", icon: ClipboardList },
    ],
  },
  { to: "/teacher", section: "chat", label: "محادثات الطلاب", icon: MessageCircle },
  { to: "/teacher", section: "reports", label: "تقارير الطلاب", icon: BarChart3 },
  { to: "/teacher", section: "analytics", label: "التحليلات", icon: LineChart },
];

const adminNav: readonly NavEntry[] = [
  { to: "/admin", section: "overview", label: "نظرة عامة", icon: ShieldCheck },
  {
    group: "المستخدمون",
    icon: UsersRound,
    items: [
      { to: "/admin", section: "teachers", label: "المدرسون", icon: UsersRound },
      { to: "/admin", section: "students", label: "الطلاب", icon: GraduationCap },
      { to: "/admin", section: "sales", label: "فريق المبيعات", icon: BriefcaseBusiness },
      { to: "/admin", section: "support", label: "فريق خدمة العملاء", icon: Headphones },
      { to: "/admin", section: "add-user", label: "إضافة مستخدم جديد", icon: UserPlus },
    ],
  },
  {
    group: "المحتوى التعليمي",
    icon: BookOpen,
    items: [
      { to: "/admin", section: "courses", label: "الكورسات والماتيريال", icon: Upload },
      { to: "/admin", section: "exams", label: "الامتحانات", icon: FileCheck },
      { to: "/admin", section: "results", label: "تسليمات الطلاب", icon: ClipboardCheck },
      { to: "/admin", section: "certificates", label: "الشهادات", icon: Award },
    ],
  },
  {
    group: "المبيعات والاشتراكات",
    icon: CreditCard,
    items: [
      { to: "/admin", section: "packages", label: "الباقات والأسعار", icon: TicketCheck },
      { to: "/admin", section: "bookings", label: "الحجوزات والمدفوعات", icon: CreditCard },
      { to: "/admin", section: "sales-report", label: "تقارير المبيعات", icon: BarChart3 },
      { to: "/admin", section: "leads", label: "توزيع العملاء", icon: BriefcaseBusiness },
    ],
  },
  {
    group: "تحديد المستوى",
    icon: ClipboardCheck,
    items: [
      { to: "/admin", section: "placement", label: "أسئلة تحديد المستوى", icon: ClipboardCheck },
      { to: "/admin", section: "placement-results", label: "نتائج تحديد المستوى", icon: BarChart3 },
    ],
  },
  {
    group: "المحاضرات والجداول",
    icon: CalendarDays,
    items: [
      { to: "/admin", section: "lectures", label: "المحاضرات المباشرة", icon: CalendarDays },
      { to: "/admin", section: "schedules", label: "المواعيد الأسبوعية", icon: RotateCcw },
      { to: "/admin", section: "sessions", label: "نظام المكالمات", icon: CalendarCheck },
      { to: "/admin", section: "groups", label: "المجموعات", icon: Users },
      { to: "/admin", section: "free-lectures", label: "المحاضرة المجانية", icon: Gift },
    ],
  },
  { to: "/admin", section: "analytics", label: "التحليلات", icon: LineChart },
];

const placementOnlyNav: readonly SidebarItem[] = [
  { to: "/placement", label: "اختبار المستوى", icon: ClipboardCheck },
];

const lockedStudentNav: readonly SidebarItem[] = [
  { to: "/subscribe", label: "الباقات والاشتراك", icon: CreditCard },
  { to: "/free-lectures", label: "المحاضرة المجانية", icon: Gift },
];

const roleNavigationMap: Record<UserRole, readonly NavEntry[]> = {
  STUDENT: studentNav,
  TEACHER: teacherNav,
  ADMIN: adminNav,
  SALES: [
    { to: "/sales", section: "leads", label: "العملاء المحتملون", icon: UsersRound },
    { to: "/sales", section: "calls", label: "سجل المكالمات", icon: Headphones },
    { to: "/sales", section: "subscriptions", label: "الاشتراكات", icon: TicketCheck },
    { to: "/sales", section: "stats", label: "التقارير والإحصائيات", icon: BarChart3 },
  ],
  SUPPORT: [
    { to: "/support", section: "students", label: "الطلاب", icon: GraduationCap },
    { to: "/support", section: "tickets", label: "الشكاوى والتذاكر", icon: TicketCheck },
    { to: "/support", section: "chat", label: "محادثات الطلاب", icon: MessageCircle },
    { to: "/support", section: "schedules", label: "جداول المدرسين", icon: ClipboardCheck },
    { to: "/support", section: "lectures", label: "المحاضرات المباشرة", icon: CalendarDays },
    { to: "/support", section: "sessions", label: "نظام المكالمات", icon: CalendarCheck },
    { to: "/support", section: "groups", label: "المجموعات", icon: Users },
    { to: "/support", section: "free-lectures", label: "المحاضرة المجانية", icon: Gift },
    { to: "/support", section: "attendance", label: "الحضور والغياب", icon: UsersRound },
    { to: "/support", section: "irregular", label: "متابعة الطلاب", icon: BarChart3 },
  ],
};

export function AppShell({
  children,
  role = "STUDENT",
  activeSection,
  onSelectSection,
}: {
  children: ReactNode;
  role?: UserRole;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    hasCallsPackage,
    hasBasicPackage,
    fetchHasCallsPackage,
  } = usePlatformStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const currentUserRole = (user?.role?.toUpperCase() as UserRole | undefined) ?? role;
  const isRoleMismatch = Boolean(user && currentUserRole !== role);
  const isStudent = Boolean(user && currentUserRole === "STUDENT" && role === "STUDENT");
  const needsPlacement = isStudent && !user!.placementCompletedAt;
  const isLocked = isStudent && Boolean(user!.placementCompletedAt) && !user!.hasActiveSubscription;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (isRoleMismatch) {
      navigate({ to: getHomeRouteForRole(currentUserRole) });
      return;
    }
    if (isStudent) {
      if (!user.placementCompletedAt && path !== "/placement") {
        navigate({ to: "/placement" });
      } else if (
        user.placementCompletedAt &&
        !user.hasActiveSubscription &&
        path !== "/subscribe" &&
        path !== "/placement" &&
        path !== "/free-lectures"
      ) {
        navigate({ to: "/subscribe" });
      }
    }
  }, [loading, user, isRoleMismatch, isStudent, currentUserRole, path, navigate]);

  // Close the mobile drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  // Fetch whether the student has a calls package (controls /sessions visibility)
  useEffect(() => {
    if (isStudent) fetchHasCallsPackage().catch(() => {});
  }, [isStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  let navItems = roleNavigationMap[role] ?? studentNav;
  if (needsPlacement) navItems = placementOnlyNav;
  else if (isLocked) navItems = lockedStudentNav;
  else if (isStudent) {
    const callsOnly = hasCallsPackage && !hasBasicPackage;
    navItems = studentNav.filter((item) => {
      if (item.to === "/sessions") return hasCallsPackage;
      if (callsOnly && ["/lectures", "/courses", "/homework", "/exams"].includes(item.to)) return false;
      return true;
    });
  }
  const displayName = user ? user.fullName : "غير مسجل الدخول";
  const displaySubtitle = user ? `${ROLE_LABELS[currentUserRole]} · ${user.phone ?? user.email ?? ""}` : ROLE_LABELS[role];

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate({ to: "/login" });
    }
  }

  const notifBell = user ? (
    <button
      type="button"
      onClick={() => {
        setNotifOpen((o) => !o);
        if (!notifOpen) fetchNotifications().catch(() => {});
      }}
      className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="الإشعارات"
    >
      <Bell className="size-4.5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -left-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  ) : null;

  function renderNavItem(item: SidebarItem, nested = false) {
    const Icon = item.icon;
    const isActive = item.section
      ? path === item.to && (activeSection ?? "overview") === item.section
      : path === item.to;
    const cls = `relative flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-right transition-colors ${
      isActive
        ? `bg-brand/8 font-bold text-brand ${nested ? "" : "before:absolute before:-start-4 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-e-full before:bg-sage"}`
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

    if (item.section && onSelectSection) {
      return (
        <button
          key={`${item.to}-${item.section}`}
          type="button"
          onClick={() => {
            onSelectSection(item.section!);
            setSidebarOpen(false);
          }}
          className={cls}
        >
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </button>
      );
    }

    return (
      <Link
        key={`${item.to}-${item.label}`}
        to={item.to}
        onClick={() => setSidebarOpen(false)}
        className={cls}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  const langSwitch = (
    <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-card p-1 text-[11px] font-bold sm:flex">
      <span className="rounded-lg px-2.5 py-1 text-muted-foreground">EN</span>
      <span className="rounded-lg px-2.5 py-1 font-he text-muted-foreground">עברית</span>
      <span className="rounded-lg bg-background px-2.5 py-1 text-brand shadow-sm">عربي</span>
    </div>
  );

  const tools = (
    <div className="flex items-center gap-2">
      {langSwitch}
      {notifBell && <div className="rounded-xl border border-border bg-card">{notifBell}</div>}
    </div>
  );

  return (
    <ShellToolsContext.Provider value={tools}>
      <div dir="rtl" className="dash-theme relative min-h-screen overflow-x-hidden bg-paper text-ink">
        <div className="flex min-h-screen flex-col lg:flex-row">
          {/* Mobile top bar */}
          <header className="glass m-3 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة"
              className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Menu className="size-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand text-primary-foreground">
                <GraduationCap className="size-4.5" />
              </span>
              <b className="font-lat">Ohran</b>
            </Link>
            <div className="flex items-center gap-1">
              {notifBell}
              <Badge tone="brand">{ROLE_LABELS[role]}</Badge>
            </div>
          </header>

          {/* Mobile drawer overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Notification panel */}
          {notifOpen && user && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-xl sm:start-auto sm:end-4 sm:w-96">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <b className="text-sm">الإشعارات</b>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead().catch(() => {})}
                      className="text-[11px] font-semibold text-brand"
                    >
                      تعليم الكل كمقروء
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      لا توجد إشعارات
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (!n.readAt) markNotificationRead(n.id).catch(() => {});
                          if (n.link) {
                            setNotifOpen(false);
                            navigate({ to: n.link });
                          }
                        }}
                        className={`block w-full border-b border-border/50 px-4 py-2.5 text-right last:border-0 hover:bg-muted/60 ${
                          !n.readAt ? "bg-brand/5" : ""
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          {!n.readAt && (
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                          )}
                          <span className="min-w-0">
                            <b className="block truncate text-xs">{n.title}</b>
                            {n.body && (
                              <small className="block truncate text-muted-foreground">{n.body}</small>
                            )}
                            <small className="text-[10px] text-muted-foreground">
                              {new Date(n.createdAt).toLocaleString("ar-EG")}
                            </small>
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          <aside
            className={`shrink-0 flex-col gap-3 border-e border-border bg-card px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[260px] ${
              sidebarOpen
                ? "fixed inset-y-0 start-0 z-50 flex w-[290px] max-w-[85vw] overflow-y-auto"
                : "hidden"
            }`}
          >
            <Link to="/" className="flex items-center gap-3 px-1 pb-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-[0_10px_24px_-12px] shadow-brand">
                <GraduationCap className="size-5" />
              </span>
              <span className="min-w-0">
                <strong className="block font-lat text-base leading-tight">Ohran</strong>
                <small className="block font-lat text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Language Academy
                </small>
              </span>
            </Link>

            <div className="px-3 pt-1 text-[11px] font-semibold text-muted-foreground">
              القائمة الرئيسية
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-2 text-sm">
              {navItems.map((entry) => {
                if (!isGroup(entry)) return renderNavItem(entry);

                const groupActive = entry.items.some((it) =>
                  it.section
                    ? path === it.to && (activeSection ?? "overview") === it.section
                    : path === it.to
                );
                const isOpen = openGroups[entry.group] ?? groupActive;
                const GroupIcon = entry.icon;

                return (
                  <div key={entry.group}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((p) => ({ ...p, [entry.group]: !isOpen }))
                      }
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-right transition-colors ${
                        groupActive
                          ? "bg-brand/5 font-bold text-brand"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <GroupIcon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{entry.group}</span>
                      <ChevronDown
                        className={`size-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-1 mb-1 flex flex-col gap-1 border-s border-border ps-2 ms-5">
                        {entry.items.map((it) => renderNavItem(it, true))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-border pt-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10"
                >
                  <LogOut className="size-4 shrink-0" />
                  تسجيل الخروج
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <Link to="/login">
                    <Button variant="ghost" className="w-full text-xs">
                      دخول
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="secondary" className="w-full text-xs">
                      حساب طالب
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">
                  {displayName[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{displayName}</b>
                  <small className="block truncate text-[11px] text-muted-foreground">{displaySubtitle}</small>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 animate-enter p-4 lg:p-6">
            {loading || !user || isRoleMismatch ? (
              <Card className="mx-auto my-12 max-w-lg p-8 text-center">
                <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {loading
                    ? "جاري التحقق من الحساب…"
                    : !user
                      ? "جاري تحويلك إلى تسجيل الدخول…"
                      : "جاري تحويلك إلى لوحة التحكم الخاصة بك…"}
                </p>
              </Card>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </ShellToolsContext.Provider>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  const tools = useContext(ShellToolsContext);
  return (
    <header className="mb-5 flex flex-wrap items-center gap-3 px-1 py-1">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold text-brand">{title}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="me-auto flex flex-wrap items-center gap-2">
        {actions}
        {tools}
      </div>
    </header>
  );
}
