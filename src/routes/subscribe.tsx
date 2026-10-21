import { createFileRoute } from "@tanstack/react-router";
import { SubscribeScreen } from "../components/screens";

export const Route = createFileRoute("/subscribe")({
  head: () => ({ meta: [{ title: "Fluent Hebrew — الباقات والاشتراك" }] }),
  component: SubscribeScreen,
});
