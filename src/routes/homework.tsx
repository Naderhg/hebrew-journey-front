import { createFileRoute } from "@tanstack/react-router";
import { CallsOnlyGuard, StudentHomeworkScreen, meta } from "../components/screens";
export const Route = createFileRoute("/homework")({
  head: () => meta("الواجبات", "واجباتك من مدرسيك — سلّم إجابة نصية أو تسجيلاً صوتياً."),
  component: () => (
    <CallsOnlyGuard>
      <StudentHomeworkScreen />
    </CallsOnlyGuard>
  ),
});
