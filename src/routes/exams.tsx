import { createFileRoute } from "@tanstack/react-router";
import { ExamsScreen, meta } from "../components/screens";
export const Route = createFileRoute("/exams")({
  head: () => meta("الامتحانات", "امتحاناتك المنشورة من مدرسيك — ترجمة، قراءة، تسجيل صوتي واستماع."),
  component: ExamsScreen,
});
