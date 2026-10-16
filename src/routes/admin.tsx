import { createFileRoute } from "@tanstack/react-router";
import { AdminScreen, meta } from "../components/screens";
export const Route = createFileRoute("/admin")({
  head: () =>
    meta(
      "لوحة الإدارة",
      "إدارة المدرسين والطلاب والمبيعات وخدمة العملاء، رفع الكورسات للمدرسين، وأسئلة تحديد المستوى.",
    ),
  component: AdminScreen,
});
