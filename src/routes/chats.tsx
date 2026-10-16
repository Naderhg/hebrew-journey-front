import { createFileRoute } from "@tanstack/react-router";
import { ChatsScreen, meta } from "../components/screens";
export const Route = createFileRoute("/chats")({
  head: () => meta("المحادثات", "تواصل مع مدرسك أو خدمة العملاء أو المساعد الذكي."),
  component: ChatsScreen,
});
