import { createFileRoute } from "@tanstack/react-router";
import { TeacherScreen, meta, type TeacherSection } from "../components/screens";
import { parseSection } from "../lib/route-section";

const teacherSections = ["students", "profile", "materials", "exams", "schedule", "homework", "attendance", "chat", "reports", "sessions", "analytics"] as const satisfies readonly TeacherSection[];

export const Route = createFileRoute("/teacher")({
  validateSearch: (search: Record<string, unknown>) => ({ section: parseSection(search.section, teacherSections) }),
  head: () => meta("لوحة المدرس", "متابعة الطلاب وإضافة الملاحظات والواجبات."),
  component: TeacherRoutePage,
});

function TeacherRoutePage() {
  const { section } = Route.useSearch();
  return <TeacherScreen initialSection={section} />;
}
