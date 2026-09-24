import { createFileRoute } from "@tanstack/react-router";
import { ConversationScreen, meta } from "../components/screens";
export const Route = createFileRoute("/conversation")({ head: () => meta("المحادثة", "محادثة عبرية تجريبية مع تحليل المهارات."), component: ConversationScreen });
