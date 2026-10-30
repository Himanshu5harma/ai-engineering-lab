import { describe, expect, it } from "vitest";
import { diagramSvg } from "./export";
import { completeness, type DesignDocument } from "./types";

const document: DesignDocument = {
  diagram: {
    nodes: [
      {
        id: "a",
        position: { x: -200, y: -100 },
        data: {
          label: '<script>alert("x")</script>',
          kind: "service",
          notes: 'Private <note> & "quotes"',
        },
      },
      {
        id: "b",
        position: { x: 300, y: 100 },
        data: { label: "Tenant index", kind: "database", notes: "" },
      },
    ],
    edges: [
      { id: "e", source: "a", target: "b", label: "<img onerror=alert(1)>" },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  flow: "Resolve identity",
  capacity: "40 million chunks",
  failures: "Fail closed",
  adr: "Compare alternatives",
  ratings: {},
};
describe("review and portable diagram safety", () => {
  it("exports user labels as XML text and retains off-origin components", () => {
    const svg = diagramSvg(document);
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    expect(parsed.querySelector("script, img")).toBeNull();
    expect(parsed.documentElement.textContent).toContain(
      '<script>alert("x")</script>',
    );
    expect(parsed.documentElement.getAttribute("viewBox")).toMatch(/^-/);
    expect(parsed.querySelectorAll("marker")).toHaveLength(1);
  });
  it("does not count whitespace or disconnected nodes as a complete design", () => {
    expect(Object.values(completeness(document)).every(Boolean)).toBe(true);
    const incomplete = {
      ...document,
      capacity: " \n ",
      diagram: { ...document.diagram, edges: [] },
    };
    expect(completeness(incomplete).capacity).toBe(false);
    expect(completeness(incomplete).diagram).toBe(false);
  });
});
