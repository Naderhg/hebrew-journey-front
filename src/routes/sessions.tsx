import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, Clock, Plus, X, AlertTriangle, Check, RotateCcw } from "lucide-react";
import { Button, Card, Input, Label, Badge } from "../components/ui";
import { usePlatformStore, type AvailableSlot, type LessonBookingItem, type SessionSubscription } from "../hooks/use-platform-store";

export const Route = createFileRoute("/sessions")({
  head: () => ({ meta: [{ title: "Fluent Hebrew — حصصي" }] }),
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
    availableSlots,
    fetchMySessions,
    fetchAvailableSlots,
    bookSession,
    rescheduleBooking: rescheduleBookingFn,
    cancelBooking,
  } = usePlatformStore();

  const [loading, setLoading] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<AvailableSlot | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<LessonBookingItem | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh() {
    setLoading(true);
    try {
      await Promise.all([fetchMySessions(), fetchAvailableSlots()]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(slot: AvailableSlot) {
    setErr("");
    try {
      await bookSession({ availabilityId: slot.availabilityId, startsAt: slot.startsAt });
      setBookingSlot(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الحجز");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("هل تريد إلغاء هذه الحصة؟ إذا تبقى أقل من 12 ساعة على موعدها ستُخصم من رصيدك.")) return;
    setErr("");
    try {
      const res = await cancelBooking(id);
      alert(res.refunded ? "تم إلغاء الحصة وأُرجعت لرصيدك" : "تم إلغاء الحصة (خصمت من رصيدك لعدم الالتزام بـ12 ساعة)");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل الإلغاء");
    }
  }

  async function handleReschedule(id: string, newSlot: AvailableSlot) {
    setErr("");
    try {
      await rescheduleBookingFn(id, { newAvailabilityId: newSlot.availabilityId, newStartsAt: newSlot.startsAt });
      setRescheduleTarget(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل تغيير الموعد");
    }
  }

  const upcoming = myBookings.filter((b) => b.status === "booked" && new Date(b.startsAt) > new Date());
  const past = myBookings.filter((b) => b.status !== "booked" || new Date(b.startsAt) <= new Date());

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">حصصي الفردية</h1>
          <p className="text-sm text-muted-foreground">احجز حصصك مع مدرسك، غيّر مواعيدها أو ألغها</p>
        </div>
        <Button variant="ghost" onClick={refresh} disabled={loading}>
          تحديث
        </Button>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</div>
      )}

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
          <h2 className="text-lg font-bold">احجز حصة جديدة</h2>
        </div>
        {availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد مواعيد متاحة حالياً — راجع مدرسك لفتح مواعيد.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableSlots.map((slot) => (
              <div
                key={slot.availabilityId + slot.startsAt}
                className="rounded-xl border border-[#e7edf7] bg-white p-4"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#0b2f6e]">
                  <Calendar className="size-4" />
                  {slot.teacherName}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{fmtDate(slot.startsAt)}</p>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  onClick={() => setBookingSlot(slot)}
                  disabled={mySessions.length === 0}
                >
                  حجز هذه الحصة
                </Button>
              </div>
            ))}
          </div>
        )}
        {mySessions.length === 0 && availableSlots.length > 0 && (
          <p className="mt-3 text-xs text-amber-600">⚠ يجب أن يكون لديك رصيد حصص نشط للحجز.</p>
        )}
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
            {upcoming.map((b) => {
              const hoursLeft = (new Date(b.startsAt).getTime() - Date.now()) / 3_600_000;
              const canReschedule = hoursLeft >= 12;
              return (
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
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRescheduleTarget(b)}
                      disabled={!canReschedule}
                    >
                      <RotateCcw className="size-4" /> تغيير الموعد
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCancel(b.id)}>
                      <X className="size-4" /> إلغاء
                    </Button>
                    {!canReschedule && (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="size-3" /> لا يمكن التغيير (أقل من 12 ساعة)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* ─── Booking modal ─── */}
      {bookingSlot && (
        <ConfirmModal
          title="تأكيد حجز الحصة"
          onClose={() => setBookingSlot(null)}
          onConfirm={() => handleBook(bookingSlot)}
        >
          <p className="text-sm text-muted-foreground">
            <b className="text-[#0b2f6e]">{bookingSlot.teacherName}</b>
            <br />
            {fmtDate(bookingSlot.startsAt)}
          </p>
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle className="mb-1 inline size-4" /> سياسة الإلغاء: يمكنك الإلغاء أو التغيير قبل 12 ساعة على الأقل لاسترجاع الحصة. أقل من 12 ساعة تُخصم الحصة.
          </div>
        </ConfirmModal>
      )}

      {/* ─── Reschedule modal ─── */}
      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          slots={availableSlots}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={(slot) => handleReschedule(rescheduleTarget.id, slot)}
        />
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

function ConfirmModal({
  title,
  children,
  onClose,
  onConfirm,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="mt-3">{children}</div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={onConfirm}>
            <Check className="size-4" /> تأكيد
          </Button>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </Card>
    </div>
  );
}

function RescheduleModal({
  booking,
  slots,
  onClose,
  onConfirm,
}: {
  booking: LessonBookingItem;
  slots: AvailableSlot[];
  onClose: () => void;
  onConfirm: (slot: AvailableSlot) => void;
}) {
  // only slots for the same teacher, in the future, excluding the current booking's time
  const teacherId = booking.teacher?.id;
  const valid = slots.filter(
    (s) => s.teacherId === teacherId && new Date(s.startsAt) > new Date() && s.startsAt !== booking.startsAt,
  );
  const [selected, setSelected] = useState<AvailableSlot | null>(null);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={onClose}>
      <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">تغيير موعد الحصة</h3>
        <p className="mt-1 text-sm text-muted-foreground">الحصة الحالية: {fmtDate(booking.startsAt)}</p>
        <div className="mt-4 space-y-2">
          {valid.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد مواعيد بديلة متاحة لنفس المدرس.</p>
          ) : (
            valid.map((s) => (
              <button
                key={s.availabilityId + s.startsAt}
                onClick={() => setSelected(s)}
                className={`w-full rounded-xl border p-3 text-right transition-colors ${
                  selected?.startsAt === s.startsAt ? "border-[#2f9e4f] bg-[#2f9e4f]/10" : "border-[#e7edf7] bg-white"
                }`}
              >
                <span className="text-sm font-semibold text-[#0b2f6e]">{fmtDate(s.startsAt)}</span>
              </button>
            ))
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" disabled={!selected} onClick={() => selected && onConfirm(selected)}>
            <RotateCcw className="size-4" /> تأكيد التغيير
          </Button>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        </div>
      </Card>
    </div>
  );
}
