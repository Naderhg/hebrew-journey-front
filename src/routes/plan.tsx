import { createFileRoute } from "@tanstack/react-router";
import { meta } from "../components/screens";
import { PlanScreen } from "../components/student-practice-screens";
export const Route = createFileRoute("/plan")({ head: () => meta("خطة التعلم", "خطة يومية شخصية مبنية على نقاط الضعف."), component: PlanScreen });
