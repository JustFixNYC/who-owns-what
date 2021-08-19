import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import fcose from "cytoscape-fcose";
import { RawPortfolioGraphJson } from "./APIDataTypes";

Cytoscape.use(fcose);

const formatGraphJSON = (rawJSON: RawPortfolioGraphJson): cytoscape.ElementDefinition[] => {
  const nodes: cytoscape.ElementDefinition[] = rawJSON.nodes.map((node) => ({
    group: "nodes",
    data: {
      id: node.id.toString(),
      type: node.value.kind,
      value: node.value.value,
    },
  }));

  const edges: cytoscape.ElementDefinition[] = rawJSON.edges.map((edge) => ({
    group: "edges",
    data: {
      source: edge.from.toString(),
      target: edge.to.toString(),
      count_hpd_registrations: edge.reg_contacts,
    },
  }));

  return nodes.concat(edges);
};

const layout = {
  name: "fcose",
  nodeDimensionsIncludeLabels: true,
  animate: false,
  quality: "proof",
  idealEdgeLength: 200,
  nodeSeparation: 300,
};

export const PortfolioGraph: React.FC<{ graphJSON: RawPortfolioGraphJson }> = ({ graphJSON }) => (
  <CytoscapeComponent
    elements={formatGraphJSON(graphJSON)}
    style={{ width: "900px", height: "600px" }}
    layout={layout}
    stylesheet={[
      {
        selector: "node",
        style: {
          label: "data(value)",
          backgroundColor: (ele) => (ele.data("type") === "name" ? "red" : "green"),
          "min-zoomed-font-size": 16,
        },
      },
    ]}
  />
);
