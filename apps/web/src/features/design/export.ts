import {
  deliverables,
  type DesignChallenge,
  type DesignDocument,
} from "./types";

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );

export function diagramSvg(document: DesignDocument): string {
  const { nodes, edges } = document.diagram;
  const minX = Math.min(0, ...nodes.map((node) => node.position.x)) - 60;
  const minY = Math.min(0, ...nodes.map((node) => node.position.y)) - 60;
  const width =
    Math.max(450, ...nodes.map((node) => node.position.x + 250)) - minX;
  const height =
    Math.max(250, ...nodes.map((node) => node.position.y + 160)) - minY;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const connections = edges
    .map((edge) => {
      const from = byId.get(edge.source),
        to = byId.get(edge.target);
      if (!from || !to) return "";
      const x1 = from.position.x + 210,
        y1 = from.position.y + 42;
      const x2 = to.position.x,
        y2 = to.position.y + 42;
      return `<path d="M${x1} ${y1} C${x1 + 70} ${y1},${x2 - 70} ${y2},${x2} ${y2}" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 10}" text-anchor="middle" font-size="12" fill="#475569">${escape(edge.label)}</text>`;
    })
    .join("");
  const components = nodes
    .map((node) => {
      const label = node.data.label.match(/.{1,26}/gu) || [""];
      return `<g transform="translate(${node.position.x} ${node.position.y})"><title>${escape(node.data.notes)}</title><rect width="210" height="${Math.max(84, 45 + label.length * 17)}" rx="10" fill="white" stroke="#a5b4fc"/><text x="16" y="23" font-size="10" fill="#4f46e5">${escape(node.data.kind.toUpperCase())}</text><text x="16" y="45" font-size="13" fill="#1e293b">${label
        .map(
          (line, index) =>
            `<tspan x="16" dy="${index ? 17 : 0}">${escape(line)}</tspan>`,
        )
        .join("")}</text></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}"><title>Component diagram</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#64748b"/></marker></defs><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#f8fafc"/><g font-family="system-ui,sans-serif">${connections}${components}</g></svg>`;
}

export function designMarkdown(
  challenge: DesignChallenge,
  document: DesignDocument,
): string {
  return (
    `# ${challenge.id} — ${challenge.title}\n\nContent version: ${challenge.version_id}\n\nLearner design and self-review. No automated architecture quality grade.\n\n` +
    deliverables
      .map(
        ({ id, title }) =>
          `## ${title}\n\n${
            id === "diagram"
              ? document.diagram.nodes
                  .map(
                    (node) =>
                      `- ${node.data.label} (${node.data.kind}): ${node.data.notes}`,
                  )
                  .join("\n") +
                "\n\nConnections:\n" +
                document.diagram.edges
                  .map((edge) => {
                    const label = (id: string) =>
                      document.diagram.nodes.find((node) => node.id === id)
                        ?.data.label || id;
                    return `- ${label(edge.source)} → ${label(edge.target)}: ${edge.label}`;
                  })
                  .join("\n")
              : document[id]
          }\n\n`,
      )
      .join("") +
    "## Self-review\n\n" +
    challenge.rubric
      .map(
        (item) =>
          `- ${item.title}: ${(document.ratings[item.id] || "unreviewed").replaceAll("_", " ")}`,
      )
      .join("\n")
  );
}
