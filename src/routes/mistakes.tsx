import { createFileRoute } from "@tanstack/react-router";
import { meta } from "../components/screens";
import { MistakesScreen } from "../components/student-practice-screens";
export const Route = createFileRoute("/mistakes")({ head: () => meta("سجل الأخطاء", "تدريبات مخصصة للأخطاء المتكررة."), component: MistakesScreen });
