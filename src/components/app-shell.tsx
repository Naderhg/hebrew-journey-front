import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, ClipboardCheck, Headphones, LayoutDashboard, Library, MessageCircle, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  ["/dashboard", "لوحة الطالب", LayoutDashboard], ["/placement", "اختبار المستوى", ClipboardCheck], ["/plan", "خطة التعلم", BookOpen],
  ["/conversation", "المحادثة", MessageCircle], ["/scenarios", "السيناريوهات", Library], ["/mistakes", "سجل الأخطاء", Bot], ["/progress", "التقدم", BarChart3],
  ["/teacher", "لوحة المدرس", UsersRound], ["/admin", "الإدارة", ShieldCheck], ["/sales", "المبيعات", BriefcaseBusiness], ["/support", "خدمة العملاء", Headphones],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return <div dir="rtl" className="relative min-h-screen overflow-x-hidden bg-paper text-ink">
    <div className="page-glow pointer-events-none fixed inset-0 -z-10" />
    <div className="mx-auto flex max-w-[1480px] flex-col gap-4 p-4 lg:flex-row lg:p-5">
      <aside className="glass flex shrink-0 flex-col gap-4 rounded-lg p-4 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[250px]">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-brand font-lat text-lg font-bold text-primary-foreground">O</span>
          <span><strong className="block">Ohran</strong><small className="font-he text-muted-foreground">עברית, בביטחון</small></span>
        </Link>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1 text-xs">
          <Link to="/dashboard" className="rounded-sm bg-brand px-1 py-1.5 text-center font-semibold text-primary-foreground">طالب</Link>
          <Link to="/teacher" className="rounded-sm px-1 py-1.5 text-center text-muted-foreground">مدرس</Link>
          <Link to="/admin" className="rounded-sm px-1 py-1.5 text-center text-muted-foreground">إدارة</Link>
        </div>
        <nav className="grid grid-cols-2 gap-1 text-sm lg:flex lg:flex-col">
          {nav.map(([to, label, Icon]) => <Link key={to} to={to} className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-2 transition-colors ${path === to ? "bg-brand/10 font-semibold text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-4 shrink-0" /><span className="truncate">{label}</span></Link>)}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1 text-xs"><span className="rounded-sm bg-background py-1.5 text-center font-semibold">العربية</span><span className="py-1.5 text-center font-he">עברית</span><span className="py-1.5 text-center">EN</span></div>
          <div className="flex items-center gap-2 rounded-md bg-muted p-2"><span className="grid size-8 place-items-center rounded-full bg-brand2/20 text-brand2">ل</span><span><b className="block text-sm">لينا حداد</b><small className="text-muted-foreground">B1 · نشطة الآن</small></span><UserRoundCog className="me-auto size-4 text-muted-foreground" /></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 animate-enter">{children}</main>
    </div>
  </div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) { return <header className="glass mb-4 flex flex-wrap items-center gap-3 rounded-lg px-5 py-4"><div><h1 className="text-xl font-bold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{actions && <div className="me-auto flex gap-2">{actions}</div>}</header>; }
