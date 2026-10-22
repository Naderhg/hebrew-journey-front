import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "../components/app-shell";
import { Badge, Card } from "../components/ui";
import { usePlatformStore } from "../hooks/use-platform-store";
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
  const { studentFreeLectures, fetchStudentFreeLectures } = usePlatformStore();

  useEffect(() => {
    fetchStudentFreeLectures().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="المحاضرة المجانية"
        subtitle="محاضرات تعريفية مجانية من الأكاديمية — احجز مكانك من خلال فريق الدعم عبر واتساب"
      />

      <div dir="rtl" className="space-y-3">
        {studentFreeLectures.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            لا توجد محاضرات مجانية مجدولة حالياً. احجز محاضرتك التعريفية عبر واتساب.
          </Card>
        ) : (
          studentFreeLectures.map((l) => {
            const st = STATUS_LABELS[l.status] ?? STATUS_LABELS.scheduled;
            return (
              <Card key={l.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b>{l.title}</b>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge style={{ background: st.color }}>{st.label}</Badge>
                      {l.group && <Badge tone="brand">{l.group.name}</Badge>}
                      {l.level && <Badge tone="gold">{l.level}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fmtDate(l.startsAt)}
                      {l.teacher && ` · ${l.teacher.fullName}`}
                    </p>
                    {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
                    {l.meetingUrl && (l.status === "live" || l.status === "scheduled") && (
                      <a
                        href={l.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block rounded-md bg-[#0b2f6e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#092652]"
                      >
                        انضم للمحاضرة
                      </a>
                    )}
                  </div>
                </div>

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
              </Card>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
