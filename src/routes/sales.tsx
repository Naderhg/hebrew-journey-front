import { createFileRoute } from "@tanstack/react-router";
import { SalesScreen, meta, type SalesSection } from "../components/screens";
import { parseSection } from "../lib/route-section";

const salesSections = ["leads", "calls", "subscriptions", "stats"] as const satisfies readonly SalesSection[];

export const Route = createFileRoute("/sales")({
  validateSearch: (search: Record<string, unknown>) => ({ section: parseSection(search.section, salesSections) }),
  head: () => meta("لوحة المبيعات", "متابعة العملاء المحتملين والاشتراكات."),
  component: SalesRoutePage,
});

function SalesRoutePage() {
  const { section } = Route.useSearch();
  return <SalesScreen initialSection={section} />;
}
