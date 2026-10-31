import { createFileRoute } from "@tanstack/react-router";
import { SupportScreen, meta, type SupportSection } from "../components/screens";
import { parseSection } from "../lib/route-section";

const supportSections = ["students", "tickets", "chat", "schedules", "sessions", "groups", "free-lectures", "attendance", "irregular"] as const satisfies readonly SupportSection[];

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>) => ({ section: parseSection(search.section, supportSections) }),
  head: () => meta("خدمة العملاء", "إدارة التذاكر والمحادثات والمتابعة."),
  component: SupportRoutePage,
});

function SupportRoutePage() {
  const { section } = Route.useSearch();
  return <SupportScreen initialSection={section} />;
}
