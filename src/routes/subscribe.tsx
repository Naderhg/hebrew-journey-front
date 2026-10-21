import { createFileRoute } from "@tanstack/react-router";
import { SubscribeScreen } from "../components/screens";

export const Route = createFileRoute("/subscribe")({
  head: () => ({ meta: [{ title: "עברית שוטפת — الباقات والاشتراك" }] }),
  component: SubscribeScreen,
});
