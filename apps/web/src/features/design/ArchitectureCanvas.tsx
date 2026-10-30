import { Input, Textarea, Select } from "../../components/ui/primitives";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type NodeProps,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import {
  Box,
  Database,
  Globe,
  Layers3,
  Monitor,
  Plus,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  ComponentData,
  ComponentKind,
  Diagram,
  DiagramEdge,
} from "./types";
import "@xyflow/react/dist/style.css";

type FlowNode = Node<ComponentData, "component">;
const kinds = [
  { id: "client", label: "Client", icon: Monitor },
  { id: "service", label: "Service", icon: Server },
  { id: "model", label: "Model", icon: Sparkles },
  { id: "database", label: "Database", icon: Database },
  { id: "queue", label: "Queue", icon: Layers3 },
  { id: "cache", label: "Cache", icon: Box },
  { id: "external", label: "External", icon: Globe },
] as const;

function ComponentNode({ data, selected }: NodeProps<FlowNode>) {
  const Icon = kinds.find((kind) => kind.id === data.kind)?.icon || Server;
  return (
    <div className={`architecture-node ${selected ? "node-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div>
        <Icon size={15} />
        <span>{data.kind}</span>
      </div>
      <strong>{data.label}</strong>
      {data.notes && <small>{data.notes}</small>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { component: ComponentNode };

export function ArchitectureCanvas({
  diagram,
  onChange,
  theme,
}: {
  diagram: Diagram;
  onChange: (diagram: Diagram) => void;
  theme: string;
}) {
  const [selected, select] = useState<{
    type: "node" | "edge";
    id: string;
  } | null>(null);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const node = diagram.nodes.find(
    (item) => selected?.type === "node" && item.id === selected.id,
  );
  const edge = diagram.edges.find(
    (item) => selected?.type === "edge" && item.id === selected.id,
  );
  const nodes: FlowNode[] = diagram.nodes.map((item) => ({
    ...item,
    type: "component",
    selected: item.id === node?.id,
  }));
  const edges = diagram.edges.map((item) => ({
    ...item,
    type: "smoothstep",
    selected: item.id === edge?.id,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  function addNode(kind: ComponentKind) {
    if (diagram.nodes.length >= 60) return;
    const id = `n_${crypto.randomUUID()}`;
    const index = diagram.nodes.length;
    onChange({
      ...diagram,
      nodes: [
        ...diagram.nodes,
        {
          id,
          position: {
            x: 60 + (index % 3) * 290,
            y: 60 + Math.floor(index / 3) * 170,
          },
          data: {
            label: kinds.find((item) => item.id === kind)!.label,
            kind,
            notes: "",
          },
        },
      ],
    });
    select({ type: "node", id });
  }
  function connect(from: string, to: string, text = "") {
    if (
      !diagram.nodes.some((item) => item.id === from) ||
      !diagram.nodes.some((item) => item.id === to) ||
      from === to ||
      diagram.edges.length >= 120
    ) {
      setMessage("Choose two different components. Maximum 120 connections.");
      return;
    }
    const id = `e_${crypto.randomUUID()}`;
    onChange({
      ...diagram,
      edges: [...diagram.edges, { id, source: from, target: to, label: text }],
    });
    select({ type: "edge", id });
    setMessage("");
    setLabel("");
  }
  function changeNodes(changes: NodeChange<FlowNode>[]) {
    const meaningful = changes.filter(
      (change) => change.type === "position" || change.type === "remove",
    );
    if (!meaningful.length) return;
    const next = applyNodeChanges(meaningful, nodes).map(
      ({ id, position, data }) => ({ id, position, data }),
    );
    onChange({
      ...diagram,
      nodes: next,
      edges: diagram.edges.filter(
        (item) =>
          next.some((n) => n.id === item.source) &&
          next.some((n) => n.id === item.target),
      ),
    });
  }
  function changeEdges(changes: EdgeChange[]) {
    if (!changes.some((change) => change.type === "remove")) return;
    const next = applyEdgeChanges(
      changes.filter((change) => change.type === "remove"),
      edges,
    );
    onChange({
      ...diagram,
      edges: next.map(({ id, source, target, label }) => ({
        id,
        source,
        target,
        label: String(label || ""),
      })),
    });
  }
  function updateNode(data: Partial<ComponentData>) {
    if (node)
      onChange({
        ...diagram,
        nodes: diagram.nodes.map((item) =>
          item.id === node.id
            ? { ...item, data: { ...item.data, ...data } }
            : item,
        ),
      });
  }
  function updateEdge(data: Partial<DiagramEdge>) {
    if (edge)
      onChange({
        ...diagram,
        edges: diagram.edges.map((item) =>
          item.id === edge.id ? { ...item, ...data } : item,
        ),
      });
  }
  return (
    <div className="architecture-builder">
      <div className="component-palette" aria-label="Component palette">
        <span>Add a component</span>
        {kinds.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            disabled={diagram.nodes.length >= 60}
            onClick={() => addNode(id)}
          >
            <Icon size={14} />
            {label}
            <Plus size={12} />
          </button>
        ))}
      </div>
      <div className="canvas-with-inspector">
        <div
          className="architecture-canvas"
          data-testid="architecture-canvas"
          aria-label="Architecture drawing canvas"
        >
          <ReactFlow<FlowNode>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={changeNodes}
            onEdgesChange={changeEdges}
            onConnect={(connection) =>
              connect(connection.source, connection.target)
            }
            onNodeClick={(_, item) => select({ type: "node", id: item.id })}
            onEdgeClick={(_, item) => select({ type: "edge", id: item.id })}
            onPaneClick={() => select(null)}
            onMoveEnd={(_, viewport) => onChange({ ...diagram, viewport })}
            defaultViewport={diagram.viewport}
            minZoom={0.1}
            maxZoom={3}
            nodeExtent={[
              [-20000, -20000],
              [20000, 20000],
            ]}
            deleteKeyCode={null}
            colorMode={theme === "dark" ? "dark" : "light"}
            fitView={false}
            isValidConnection={(connection) =>
              connection.source !== connection.target &&
              diagram.edges.length < 120
            }
          >
            <Background gap={22} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable />
          </ReactFlow>
          {!nodes.length && (
            <div className="canvas-empty">
              <GitBranchIcon />
              <h3>Start with the system boundaries.</h3>
              <p>
                Add components above, then connect their handles.
                <br />
                You can also use the connection form below.
              </p>
            </div>
          )}
        </div>
        <aside className="component-inspector">
          <div className="eyebrow">INSPECTOR</div>
          {node ? (
            <>
              <label>
                Component name
                <Input
                  aria-label="Component name"
                  maxLength={120}
                  value={node.data.label}
                  onChange={(event) =>
                    updateNode({ label: event.target.value })
                  }
                />
              </label>
              <label>
                Component type
                <Select
                  aria-label="Component type"
                  value={node.data.kind}
                  onChange={(event) =>
                    updateNode({ kind: event.target.value as ComponentKind })
                  }
                >
                  {kinds.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Responsibilities and trust boundary
                <Textarea
                  aria-label="Component notes"
                  maxLength={500}
                  value={node.data.notes}
                  onChange={(event) =>
                    updateNode({ notes: event.target.value })
                  }
                  placeholder="What state does it own? What must it trust?"
                />
              </label>
              <div className="node-coordinates">
                {(["x", "y"] as const).map((axis) => (
                  <label key={axis}>
                    {axis.toUpperCase()}
                    <Input
                      aria-label={`Component ${axis} position`}
                      type="number"
                      min={-20000}
                      max={20000}
                      value={Math.round(node.position[axis])}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value) && Math.abs(value) <= 20000)
                          onChange({
                            ...diagram,
                            nodes: diagram.nodes.map((item) =>
                              item.id === node.id
                                ? {
                                    ...item,
                                    position: {
                                      ...item.position,
                                      [axis]: value,
                                    },
                                  }
                                : item,
                            ),
                          });
                      }}
                    />
                  </label>
                ))}
              </div>
              <Button
                variant="destructive"

                onClick={() => {
                  onChange({
                    ...diagram,
                    nodes: diagram.nodes.filter((item) => item.id !== node.id),
                    edges: diagram.edges.filter(
                      (item) =>
                        item.source !== node.id && item.target !== node.id,
                    ),
                  });
                  select(null);
                }}
              >
                <Trash2 size={14} />
                Delete component
              </Button>
            </>
          ) : edge ? (
            <>
              <h3>Connection</h3>
              <p>
                {diagram.nodes.find((n) => n.id === edge.source)?.data.label} →{" "}
                {diagram.nodes.find((n) => n.id === edge.target)?.data.label}
              </p>
              <label>
                Connection label
                <Input
                  aria-label="Connection label"
                  maxLength={120}
                  value={edge.label}
                  onChange={(event) =>
                    updateEdge({ label: event.target.value })
                  }
                />
              </label>
              <Button
                variant="destructive"

                onClick={() => {
                  onChange({
                    ...diagram,
                    edges: diagram.edges.filter((item) => item.id !== edge.id),
                  });
                  select(null);
                }}
              >
                <Trash2 size={14} />
                Delete connection
              </Button>
            </>
          ) : (
            <>
              <h3>Make the diagram yours.</h3>
              <p>
                Select a component to edit its name, role and notes. Select a
                connection to label it.
              </p>
              <p>
                Drag to arrange. Scroll to zoom. Use the controls to fit the
                diagram.
              </p>
            </>
          )}
        </aside>
      </div>
      <form
        className="connection-form"
        onSubmit={(event) => {
          event.preventDefault();
          connect(source, target, label);
        }}
      >
        <label>
          From
          <Select
            aria-label="Connection source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">Choose component</option>
            {diagram.nodes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.data.label}
              </option>
            ))}
          </Select>
        </label>
        <label>
          To
          <Select
            aria-label="Connection target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            <option value="">Choose component</option>
            {diagram.nodes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.data.label}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Label
          <Input
            aria-label="New connection label"
            maxLength={120}
            value={label}
            placeholder="e.g. authorized query"
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <Button
          type="submit"
          disabled={
            !diagram.nodes.some((item) => item.id === source) ||
            !diagram.nodes.some((item) => item.id === target) ||
            source === target ||
            diagram.edges.length >= 120
          }
        >
          <Plus size={14} />
          Connect
        </Button>
      </form>
      <div className="canvas-footer">
        <span role="status">
          {message ||
            `${nodes.length}/60 components · ${edges.length}/120 connections`}
        </span>
        <span>
          At least 2 components and 1 connection for structural completeness.
        </span>
      </div>
    </div>
  );
}

function GitBranchIcon() {
  return <Layers3 size={26} />;
}
