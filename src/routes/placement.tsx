import { createFileRoute } from "@tanstack/react-router";
import { PlacementScreen, meta } from "../components/screens";
export const Route = createFileRoute("/placement")({ head: () => meta("اختبار تحديد المستوى", "اختبار القراءة والاستماع والكتابة والمحادثة."), component: PlacementScreen });
