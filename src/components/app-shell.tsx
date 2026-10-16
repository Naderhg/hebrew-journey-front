import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  Film,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Library,
  LogOut,
  MessageCircle,
  ShieldCheck,
  TicketCheck,
  Upload,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole, ROLE_LABELS, type UserRole } from "../lib/auth";
import { Badge, Button, Card } from "./ui";

export interface SidebarItem {
  to: string;
  section?: string;
  label: string;
  icon: LucideIcon;
}

const studentNav: readonly SidebarItem[] = [
  { to: "/dashboard", label: "لوحة الطالب", icon: LayoutDashboard },
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

const teacherNav: readonly SidebarItem[] = [
  { to: "/teacher", section: "students", label: "طلابي وتقدمهم", icon: UsersRound },
  { to: "/teacher", section: "materials", label: "الكورسات والماتيريال", icon: Film },
  { to: "/teacher", section: "exams", label: "الامتحانات والنتائج", icon: FileCheck },
  { to: "/teacher", section: "schedule", label: "جدولي", icon: CalendarDays },
  { to: "/teacher", section: "homework", label: "الواجبات", icon: ClipboardList },
  { to: "/teacher", section: "attendance", label: "الحضور والغياب", icon: TicketCheck },
  { to: "/teacher", section: "chat", label: "محادثات الطلاب", icon: MessageCircle },
  { to: "/teacher", section: "reports", label: "تقارير الطلاب", icon: BarChart3 },
];

const adminNav: readonly SidebarItem[] = [
  { to: "/admin", section: "overview", label: "نظرة عامة", icon: ShieldCheck },
  { to: "/admin", section: "teachers", label: "المدرسون", icon: UsersRound },
  { to: "/admin", section: "students", label: "الطلاب", icon: GraduationCap },
  { to: "/admin", section: "sales", label: "فريق المبيعات", icon: BriefcaseBusiness },
  { to: "/admin", section: "support", label: "فريق خدمة العملاء", icon: Headphones },
  { to: "/admin", section: "add-user", label: "إضافة مستخدم جديد", icon: UserPlus },
  { to: "/admin", section: "courses", label: "الكورسات والماتيريال", icon: Upload },
  { to: "/admin", section: "exams", label: "الامتحانات", icon: FileCheck },
  { to: "/admin", section: "results", label: "تسليمات الطلاب", icon: ClipboardCheck },
  { to: "/admin", section: "placement", label: "أسئلة تحديد المستوى", icon: ClipboardCheck },
  { to: "/admin", section: "packages", label: "الباقات والأسعار", icon: TicketCheck },
  { to: "/admin", section: "sales-report", label: "تقارير المبيعات", icon: BarChart3 },
  { to: "/admin", section: "leads", label: "توزيع العملاء", icon: BriefcaseBusiness },
  { to: "/admin", section: "certificates", label: "الشهادات", icon: Award },
];

const roleNavigationMap: Record<UserRole, readonly SidebarItem[]> = {
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

  const currentUserRole = (user?.role?.toUpperCase() as UserRole | undefined) ?? role;
  const isRoleMismatch = Boolean(user && currentUserRole !== role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (isRoleMismatch) {
      navigate({ to: getHomeRouteForRole(currentUserRole) });
    }
  }, [loading, user, isRoleMismatch, currentUserRole, navigate]);

  const navItems = roleNavigationMap[role] ?? studentNav;
  const displayName = user ? user.fullName : "غير مسجل الدخول";
  const displaySubtitle = user ? `${ROLE_LABELS[currentUserRole]} · ${user.email}` : ROLE_LABELS[role];

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate({ to: "/login" });
    }
  }

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden bg-paper text-ink">
      <div className="page-glow pointer-events-none fixed inset-0 -z-10" />
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 p-4 lg:flex-row lg:p-5">
        <aside className="glass flex shrink-0 flex-col gap-4 rounded-lg p-4 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[260px]">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-brand font-lat text-lg font-bold text-primary-foreground">
                O
              </span>
              <span>
                <strong className="block">Ohran</strong>
                <small className="font-he text-muted-foreground">עברית, בביטחון</small>
              </span>
            </Link>
            <Badge tone="brand">{ROLE_LABELS[role]}</Badge>
          </div>

          <div className="rounded-md bg-muted/80 px-3 py-2 text-xs text-muted-foreground">
            مساحة العمل المخصصة لـ <b className="text-foreground">{ROLE_LABELS[role]}</b>
          </div>

          <nav className="grid grid-cols-2 gap-1 overflow-y-auto text-sm lg:flex lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.section
                ? path === item.to && (activeSection ?? "overview") === item.section
                : path === item.to;

              if (item.section && onSelectSection) {
                return (
                  <button
                    key={`${item.to}-${item.section}`}
                    type="button"
                    onClick={() => onSelectSection(item.section!)}
                    className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-2.5 text-right transition-colors ${
                      isActive
                        ? "bg-brand/10 font-semibold text-brand"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
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
                  className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-2.5 transition-colors ${
                    isActive
                      ? "bg-brand/10 font-semibold text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1 text-xs">
              <span className="rounded-sm bg-background py-1.5 text-center font-semibold">
                العربية
              </span>
              <span className="py-1.5 text-center font-he">עברית</span>
              <span className="py-1.5 text-center">EN</span>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-muted p-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand2/20 font-bold text-brand2">
                {displayName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{displayName}</b>
                <small className="block truncate text-muted-foreground">{displaySubtitle}</small>
              </div>
            </div>

            {user ? (
              <Button variant="ghost" className="w-full justify-center text-xs" onClick={handleLogout}>
                <LogOut className="size-3.5" />
                تسجيل الخروج
              </Button>
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
          </div>
        </aside>

        <main className="min-w-0 flex-1 animate-enter">
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
  return (
    <header className="glass mb-4 flex flex-wrap items-center gap-3 rounded-lg px-5 py-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="me-auto flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
