import { createFileRoute } from "@tanstack/react-router";
import { OpsScreen, meta } from "../components/screens";
export const Route = createFileRoute("/support")({ head: () => meta("خدمة العملاء", "إدارة التذاكر والمحادثات والمتابعة."), component: () => <OpsScreen kind="support" /> });
