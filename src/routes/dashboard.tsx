import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen, meta } from "../components/screens";
export const Route = createFileRoute("/dashboard")({ head: () => meta("لوحة الطالب", "متابعة المستوى والمهام اليومية والواجبات."), component: DashboardScreen });
