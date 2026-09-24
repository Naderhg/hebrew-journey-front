import { createFileRoute } from "@tanstack/react-router";
import { PlanScreen, meta } from "../components/screens";
export const Route = createFileRoute("/plan")({ head: () => meta("خطة التعلم", "خطة يومية شخصية مبنية على نقاط الضعف."), component: PlanScreen });
