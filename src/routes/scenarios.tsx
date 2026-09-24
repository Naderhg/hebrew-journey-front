import { createFileRoute } from "@tanstack/react-router";
import { ScenariosScreen, meta } from "../components/screens";
export const Route = createFileRoute("/scenarios")({ head: () => meta("مكتبة السيناريوهات", "مواقف واقعية للتدرب على العبرية."), component: ScenariosScreen });
