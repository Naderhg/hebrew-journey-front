import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceScreen } from "../components/workspace-screen";

export const Route = createFileRoute("/workspace")({
  component: WorkspaceScreen,
});
