import { createFileRoute } from "@tanstack/react-router";
import { meta } from "../components/screens";
import { ScenariosScreen } from "../components/student-practice-screens";
export const Route = createFileRoute("/scenarios")({ head: () => meta("مكتبة السيناريوهات", "مواقف واقعية للتدرب على العبرية."), component: ScenariosScreen });
