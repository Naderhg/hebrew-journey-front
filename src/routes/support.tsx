import { createFileRoute } from "@tanstack/react-router";
import { SupportScreen, meta } from "../components/screens";
export const Route = createFileRoute("/support")({ head: () => meta("خدمة العملاء", "إدارة التذاكر والمحادثات والمتابعة."), component: () => <SupportScreen /> });
