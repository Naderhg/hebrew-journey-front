import { createFileRoute } from "@tanstack/react-router";
import { ProgressScreen, meta } from "../components/screens";
export const Route = createFileRoute("/progress")({ head: () => meta("التقدم", "رسوم تطور المهارات الست عبر الوقت."), component: ProgressScreen });
