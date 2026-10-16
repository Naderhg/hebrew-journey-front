import { createFileRoute } from "@tanstack/react-router";
import { SalesScreen, meta } from "../components/screens";
export const Route = createFileRoute("/sales")({ head: () => meta("لوحة المبيعات", "متابعة العملاء المحتملين والاشتراكات."), component: () => <SalesScreen /> });
