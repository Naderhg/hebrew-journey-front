import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CalendarCheck, CircleCheck, Wallet, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "../components/app-shell";
import { Badge, Card, ProgressBar, SectionHeader } from "../components/ui";
import { usePlatformStore } from "../hooks/use-platform-store";

export const Route = createFileRoute("/wallet")({
  component: StudentWalletPage,
});

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<string, { label: string; tone: "sage" | "danger" | "muted" | "brand" | "gold" }> = {
  booked: { label: "محجوزة", tone: "brand" },
  completed: { label: "حضرتها", tone: "sage" },
  no_show: { label: "لم تحضر (خصمت)", tone: "danger" },
  cancelled: { label: "ملغاة", tone: "muted" },
};

const SUB_LABELS: Record<string, { label: string; tone: "sage" | "muted" | "gold" }> = {
  ACTIVE: { label: "نشطة", tone: "sage" },
  EXPIRED: { label: "انتهت", tone: "muted" },
  PENDING: { label: "بانتظار الدفع", tone: "gold" },
};

function StudentWalletPage() {
  const { studentWallet, studentWalletBookings, fetchStudentWallet } = usePlatformStore();

  useEffect(() => {
    fetchStudentWallet().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = studentWallet.find((w) => w.status === "ACTIVE") ?? studentWallet[0];

  const overview = [
    { label: "إجمالي الحصص", value: active?.sessionsTotal ?? 0, icon: CalendarCheck, tone: "text-brand bg-brand/10" },
    { label: "حصص حضرتها", value: active?.attended ?? 0, icon: CircleCheck, tone: "text-sage bg-sage/15" },
    { label: "خصمت دون حضور", value: active?.deductedNotAttended ?? 0, icon: XCircle, tone: "text-gold bg-gold/15" },
    { label: "الحصص المتبقية", value: active?.sessionsRemaining ?? 0, icon: Wallet, tone: "text-brand2 bg-brand2/10" },
  ];

  return (
    <AppShell role="STUDENT">
      <PageHeader title="محفظتي" subtitle="تفاصيل باقتك واستهلاك حصصك — الحصة تُخصم عند الحضور أو عدم الحضور بدون إبلاغ مسبق" />

      <div dir="rtl" className="space-y-4">
        {studentWallet.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            لا توجد باقات حصص مفعّلة لديك حالياً.
          </Card>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overview.map((c) => (
                <Card key={c.label} className="flex items-center gap-3 p-4">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${c.tone}`}>
                    <c.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <b className="block text-xl leading-tight">{c.value}</b>
                    <p className="text-[11px] text-muted-foreground">{c.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Packages */}
            {studentWallet.map((w) => {
              const st = SUB_LABELS[w.status] ?? { label: w.status, tone: "muted" as const };
              const usedPct = w.sessionsTotal > 0 ? (w.sessionsUsed / w.sessionsTotal) * 100 : 0;
              return (
                <Card key={w.id}>
                  <SectionHeader
                    icon={Banknote}
                    tone="gold"
                    title={w.packageName}
                    subtitle={`${w.price.toLocaleString("ar-EG")} ج.م · الحصة = ${w.sessionPrice.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`}
                    actions={<Badge tone={st.tone}>{st.label}</Badge>}
                  />

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>استخدمت {w.sessionsUsed} من {w.sessionsTotal} حصة</span>
                      <span>{Math.round(usedPct)}%</span>
                    </div>
                    <div className="mt-1.5"><ProgressBar value={usedPct} /></div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">حضرت</p>
                      <b className="text-sm">{w.attended} حصة</b>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">خصمت دون حضور</p>
                      <b className="text-sm">{w.deductedNotAttended} حصة</b>
                      <p className="text-[10px] text-muted-foreground">لم تحضر {w.noShow} · إلغاء متأخر {w.lateCancel}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">المتبقي</p>
                      <b className="text-sm">{w.sessionsRemaining ?? "—"} حصة</b>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">الصلاحية</p>
                      <b className="text-sm">{fmtDate(w.expiresAt)}</b>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Sessions log */}
            <Card>
              <SectionHeader icon={CalendarCheck} tone="brand" title="سجل الحصص" subtitle="آخر حصصك المحجوزة والمكتملة" />
              <div className="mt-3 space-y-2">
                {studentWalletBookings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">لا توجد حصص مسجلة بعد.</p>
                ) : (
                  studentWalletBookings.map((b) => {
                    const st = STATUS_LABELS[b.status] ?? { label: b.status, tone: "muted" as const };
                    return (
                      <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                        <div>
                          <b className="block text-sm">{b.teacherName}</b>
                          <p className="text-xs text-muted-foreground">
                            {new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {b.cancelReason && <p className="text-[10px] text-muted-foreground">{b.cancelReason}</p>}
                        </div>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
