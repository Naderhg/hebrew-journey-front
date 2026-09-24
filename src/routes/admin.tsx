import { createFileRoute } from "@tanstack/react-router";
import { OpsScreen, meta } from "../components/screens";
export const Route = createFileRoute("/admin")({ head: () => meta("لوحة الإدارة", "إدارة المستخدمين والسيناريوهات واللغات."), component: () => <OpsScreen kind="admin" /> });
