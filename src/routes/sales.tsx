import { createFileRoute } from "@tanstack/react-router";
import { OpsScreen, meta } from "../components/screens";
export const Route = createFileRoute("/sales")({ head: () => meta("لوحة المبيعات", "متابعة العملاء المحتملين والاشتراكات."), component: () => <OpsScreen kind="sales" /> });
