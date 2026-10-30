import type { components } from "../../api/generated/schema";
export type ComponentKind =
  components["schemas"]["ComponentData-Output"]["kind"];
export type ComponentData = components["schemas"]["ComponentData-Output"];
export type DiagramNode = components["schemas"]["DiagramNode-Output"];
export type DiagramEdge = components["schemas"]["DiagramEdge-Output"];
export type Diagram = components["schemas"]["Diagram-Output"];
export type Rating = NonNullable<
  components["schemas"]["DesignDocument-Output"]["ratings"]
>[string];
export type Deliverable = "diagram" | "flow" | "capacity" | "failures" | "adr";
export type DesignDocument = components["schemas"]["DesignDocument-Output"];
export type Workspace = components["schemas"]["WorkspaceView"];
export type DesignSummary = components["schemas"]["DesignSummary"];
export type DesignChallenge = components["schemas"]["DesignDetail"];
export const deliverables: { id: Deliverable; title: string; short: string }[] =
  [
    { id: "diagram", title: "Component diagram", short: "Diagram" },
    { id: "flow", title: "Request and data flow", short: "Data flow" },
    { id: "capacity", title: "Capacity assumptions", short: "Capacity" },
    { id: "failures", title: "Failure analysis", short: "Failures" },
    { id: "adr", title: "Architectural decision record", short: "ADR" },
  ];
export function completeness(
  document: DesignDocument,
): Record<Deliverable, boolean> {
  return {
    diagram:
      document.diagram.nodes.length >= 2 && document.diagram.edges.length >= 1,
    flow: !!document.flow.trim(),
    capacity: !!document.capacity.trim(),
    failures: !!document.failures.trim(),
    adr: !!document.adr.trim(),
  };
}
