import { createFileRoute } from "@tanstack/react-router";
import { MistakesScreen, meta } from "../components/screens";
export const Route = createFileRoute("/mistakes")({ head: () => meta("سجل الأخطاء", "تدريبات مخصصة للأخطاء المتكررة."), component: MistakesScreen });
