import { createFileRoute } from "@tanstack/react-router";
import { CoursesScreen, meta } from "../components/screens";
export const Route = createFileRoute("/courses")({
  head: () => meta("كورساتي", "الكورسات والفيديوهات والملفات المنشورة لك — شغّلها داخل المنصة."),
  component: CoursesScreen,
});
