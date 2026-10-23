import { createFileRoute } from "@tanstack/react-router";
import { CallsOnlyGuard, ExamsScreen, meta } from "../components/screens";
export const Route = createFileRoute("/exams")({
  head: () => meta("الامتحانات", "امتحاناتك المنشورة من مدرسيك — ترجمة، قراءة، تسجيل صوتي واستماع."),
  component: () => (
    <CallsOnlyGuard>
      <ExamsScreen />
    </CallsOnlyGuard>
  ),
});
