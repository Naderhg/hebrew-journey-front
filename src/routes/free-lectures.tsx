import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "../components/app-shell";
import { Badge, Card } from "../components/ui";
import { usePlatformStore } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { mediaSrc } from "../lib/api";

export const Route = createFileRoute("/free-lectures")({
  component: StudentFreeLecturesPage,
});

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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "مجدولة", color: "#0b2f6e" },
  live: { label: "مباشرة الآن", color: "#2f9e4f" },
  completed: { label: "انتهت", color: "#5a6b8c" },
  cancelled: { label: "ملغاة", color: "#c0392b" },
};

function StudentFreeLecturesPage() {
  const { user } = useAuth();
  const {
    studentFreeLectures,
    fetchStudentFreeLectures,
    hasCallsPackage,
    fetchHasCallsPackage,
  } = usePlatformStore();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [expandedLectureIds, setExpandedLectureIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetchHasCallsPackage().finally(() => {
      if (active) setCheckingAccess(false);
    });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (checkingAccess || !hasCallsPackage) return;
    fetchStudentFreeLectures().catch(() => {});
  }, [checkingAccess, hasCallsPackage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="المحاضرة المجانية"
        subtitle="المحاضرات المجانية المخصصة لك — تظهر هنا بعد أن يضيفك فريق الأكاديمية"
      />

      {checkingAccess ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          جاري التحقق من باقة نظام المكالمات...
        </Card>
      ) : !hasCallsPackage ? (
        <Card className="py-10 text-center text-sm font-semibold text-[#0b2f6e]">
          المحاضرات المجانية متاحة لمشتركي نظام المكالمات فقط.
        </Card>
      ) : (
        <div dir="rtl" className="space-y-3">
          {studentFreeLectures.length === 0 ? (
            <Card className="py-10 text-center text-sm text-muted-foreground">
              لا توجد محاضرات مجانية مجدولة حالياً. احجز محاضرتك التعريفية عبر واتساب.
            </Card>
          ) : (
            studentFreeLectures.map((l) => {
              const st = STATUS_LABELS[l.status] ?? STATUS_LABELS.scheduled;
              const isExpanded = expandedLectureIds.has(l.id);
              return (
                <Card key={l.id}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`free-lecture-details-${l.id}`}
                    onClick={() => setExpandedLectureIds((current) => {
                      const next = new Set(current);
                      if (next.has(l.id)) next.delete(l.id);
                      else next.add(l.id);
                      return next;
                    })}
                    className="flex w-full flex-wrap items-start justify-between gap-3 text-right"
                  >
                    <span>
                      <b>{l.title}</b>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {user?.fullName}{user?.phone ? ` · ${user.phone}` : user?.email ? ` · ${user.email}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge style={{ background: st.color }}>{st.label}</Badge>
                      <span className="text-xs font-semibold text-brand2">{isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}</span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div id={`free-lecture-details-${l.id}`} className="mt-3 border-t border-border pt-3">
                      <div className="flex flex-wrap gap-1">
                        {l.level && <Badge tone="gold">{l.level}</Badge>}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {fmtDate(l.startsAt)}
                        {l.teacher && ` · ${l.teacher.fullName}`}
                      </p>
                      {l.description && <p className="mt-2 text-sm text-muted-foreground">{l.description}</p>}
                      {l.meetingUrl && (l.status === "live" || l.status === "scheduled") ? (
                        <a
                          href={l.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-3 inline-block rounded-md bg-[#0b2f6e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#092652]"
                        >
                          عرض رابط المحاضرة والانضمام
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {l.status === "completed" ? "انتهت المحاضرة." : l.status === "cancelled" ? "أُلغيت المحاضرة." : "لم يضف الفريق رابط المحاضرة بعد."}
                        </p>
                      )}
                      {(l.files ?? []).length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <h4 className="text-xs font-bold text-muted-foreground">الملفات المرفقة</h4>
                          <div className="mt-2 space-y-1">
                            {(l.files ?? []).map((f, i) => (
                              <a
                                key={i}
                                href={mediaSrc(f.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-md bg-muted/60 px-2.5 py-1.5 text-sm text-brand2 underline"
                              >
                                {f.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </AppShell>
  );
}
