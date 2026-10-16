import { createFileRoute } from "@tanstack/react-router";
import { CertificatesScreen, meta } from "../components/screens";
export const Route = createFileRoute("/certificates")({
  head: () => meta("شهاداتي", "الشهادات التي حصلت عليها عند إتمام المستويات."),
  component: CertificatesScreen,
});
