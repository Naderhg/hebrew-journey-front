import { createFileRoute } from "@tanstack/react-router";
import { LecturesScreen, meta } from "../components/screens";
export const Route = createFileRoute("/lectures")({
  head: () => meta("المحاضرات", "جدول محاضراتك وسجل حضورك وطلبات تغيير المواعيد."),
  component: LecturesScreen,
});
