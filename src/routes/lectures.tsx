import { createFileRoute } from "@tanstack/react-router";
import { CallsOnlyGuard, LecturesScreen, meta } from "../components/screens";
export const Route = createFileRoute("/lectures")({
  head: () => meta("المحاضرات", "جدول محاضراتك وسجل حضورك وطلبات تغيير المواعيد."),
  component: () => (
    <CallsOnlyGuard>
      <LecturesScreen />
    </CallsOnlyGuard>
  ),
});
