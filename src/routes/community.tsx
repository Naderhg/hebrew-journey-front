import { createFileRoute } from "@tanstack/react-router";
import { CommunityScreen } from "../components/community-screen";

export const Route = createFileRoute("/community")({
  component: CommunityScreen,
});
