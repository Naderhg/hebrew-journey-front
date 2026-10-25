import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, Clock, Plus } from "lucide-react";
import { Button, Card, Badge } from "../components/ui";
import { usePlatformStore, type SessionSubscription } from "../hooks/use-platform-store";

export const Route = createFileRoute("/sessions")({
  head: () => ({ meta: [{ title: "עברית שוטפת — حصصي" }] }),
  component: StudentSessionsPage,
});

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  booked: { label: "محجوزة", color: "#0b2f6e" },
  completed: { label: "مكتملة", color: "#2f9e4f" },
  cancelled: { label: "ملغاة", color: "#c0392b" },
  no_show: { label: "لم يحضر", color: "#e67e22" },
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StudentSessionsPage() {
  const {
    mySessions,
    myBookings,
    fetchMySessions,
    hasCallsPackage,
    fetchHasCallsPackage,
  } = usePlatformStore();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      await fetchHasCallsPackage();
      setChecking(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!checking && hasCallsPackage) refresh();
  }, [checking, hasCallsPackage]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh() {
    setLoading(true);
    try {
      await fetchMySessions();
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f6f9fd] text-sm text-[#5a6b8c]">
        جاري التحقق من اشتراكك...
      </div>
    );
  }

  if (!hasCallsPackage) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f6f9fd] px-6">
        <div className="max-w-md rounded-2xl border border-[#e7edf7] bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#0b2f6e]">هذا القسم لباقات المكالمات فقط</h2>
          <p className="mt-2 text-sm text-[#5a6b8c]">
            حصص الحجز الفردي متاحة فقط للطلاب المشتركين في باقة نظام المكالمات.
            إذا كنت تريد حجز حصص فردية، يرجى الاشتراك في باقة المكالمات.
          </p>
        </div>
      </div>
    );
  }

  const upcoming = myBookings.filter((b) => b.status === "booked" && new Date(b.startsAt) > new Date());
  const past = myBookings.filter((b) => b.status !== "booked" || new Date(b.startsAt) <= new Date());

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">حصصي الفردية</h1>
          <p className="text-sm text-muted-foreground">تابع حصصك المحجوزة ورصيدك المتبقي</p>
        </div>
        <Button variant="ghost" onClick={refresh} disabled={loading}>
          تحديث
        </Button>
      </div>

      {/* ─── Balance cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mySessions.length === 0 ? (
          <Card className="col-span-full p-6 text-center text-sm text-muted-foreground">
            لا يوجد رصيد حصص نشط — اشترِ باقة حصص للبدء.
          </Card>
        ) : (
          mySessions.map((s) => <BalanceCard key={s.id} sub={s} />)
        )}
      </div>

      {/* ─── Book a session ─── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-5 text-[#0b2f6e]" />
          <h2 className="text-lg font-bold">حجز حصة جديدة</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          حجز الحصص الفردية يتم من خلال فريق الدعم — تواصل معنا على واتساب وسنحدد لك موعداً ضمن أوقات المدرس المتاحة.
        </p>
      </Card>

      {/* ─── Upcoming bookings ─── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarCheck className="size-5 text-[#2f9e4f]" />
          <h2 className="text-lg font-bold">الحصص القادمة</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد حصص محجوزة قادمة.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div key={b.id} className="rounded-xl border border-[#e7edf7] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0b2f6e]">
                      <Clock className="size-4" />
                      {b.teacher?.fullName ?? "مدرس"}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{fmtDate(b.startsAt)}</p>
                    {b.meetingUrl && (
                      <a href={b.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-[#2f6fed]">
                        رابط الاجتماع
                      </a>
                    )}
                  </div>
                  <Badge style={{ background: STATUS_LABELS.booked.color }}>{STATUS_LABELS.booked.label}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  لتغيير الموعد أو الإلغاء، تواصل مع فريق الدعم.
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Past bookings ─── */}
      {past.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">سجل الحصص</h2>
          </div>
          <div className="space-y-2">
            {past.slice(0, 20).map((b) => {
              const st = STATUS_LABELS[b.status] ?? STATUS_LABELS.booked;
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-[#eef2f9] bg-white px-4 py-3">
                  <div>
                    <b className="text-sm text-[#0b2f6e]">{b.teacher?.fullName ?? "مدرس"}</b>
                    <p className="text-xs text-muted-foreground">{fmtDate(b.startsAt)}</p>
                    {b.cancelReason && <p className="text-xs text-red-600">سبب الإلغاء: {b.cancelReason}</p>}
                  </div>
                  <Badge style={{ background: st.color }}>{st.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function BalanceCard({ sub }: { sub: SessionSubscription }) {
  const remaining = sub.sessionsRemaining ?? 0;
  const total = sub.sessionsTotal ?? 0;
  const used = sub.sessionsUsed ?? 0;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const expired = sub.expiresAt && new Date(sub.expiresAt) < new Date();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <b className="text-sm text-[#0b2f6e]">{sub.packageName}</b>
        {expired ? (
          <Badge style={{ background: "#c0392b" }}>منتهية</Badge>
        ) : (
          <Badge style={{ background: "#2f9e4f" }}>نشط</Badge>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-bold text-[#2f9e4f]">{remaining}</span>
        <span className="text-sm text-muted-foreground">/ {total} حصة متبقية</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef2f9]">
        <div className="h-full rounded-full bg-[#2f9e4f]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>استُخدمت {used}</span>
        {sub.expiresAt && <span>تنتهي: {new Date(sub.expiresAt).toLocaleDateString("ar-EG")}</span>}
      </div>
    </Card>
  );
}

