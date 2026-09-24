import { createFileRoute } from "@tanstack/react-router";
import { TeacherScreen, meta } from "../components/screens";
export const Route = createFileRoute("/teacher")({ head: () => meta("لوحة المدرس", "متابعة الطلاب وإضافة الملاحظات والواجبات."), component: TeacherScreen });
