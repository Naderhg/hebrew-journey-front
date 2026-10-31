import { createFileRoute } from "@tanstack/react-router";
import { meta } from "../components/screens";
import { ConversationScreen } from "../components/student-practice-screens";
export const Route = createFileRoute("/conversation")({ head: () => meta("المحادثة", "محادثة عبرية تجريبية مع تحليل المهارات."), component: ConversationScreen });
