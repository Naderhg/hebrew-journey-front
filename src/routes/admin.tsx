import { createFileRoute } from "@tanstack/react-router";
import { AdminScreen, meta, type AdminSection } from "../components/screens";
import { parseSection } from "../lib/route-section";

const adminSections = [
  "overview", "teachers", "students", "sales", "support", "add-user", "courses", "exams", "results",
  "placement", "packages", "bookings", "sessions", "groups", "free-lectures", "placement-results",
  "sales-report", "leads", "certificates", "schedules", "analytics", "guide",
] as const satisfies readonly AdminSection[];

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: parseSection(search.section, adminSections),
  }),
  head: () =>
    meta(
      "لوحة الإدارة",
      "إدارة المدرسين والطلاب والمبيعات وخدمة العملاء، رفع الكورسات للمدرسين، وأسئلة تحديد المستوى.",
    ),
  component: AdminRoutePage,
});

function AdminRoutePage() {
  const { section } = Route.useSearch();
  return <AdminScreen initialSection={section} />;
}
