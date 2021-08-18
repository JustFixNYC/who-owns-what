import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import cola from "cytoscape-cola";
import { RawPortfolioJson } from "./APIDataTypes";

Cytoscape.use(cola);

const formatGraphJSON = (rawJSON: RawPortfolioJson): cytoscape.ElementDefinition[] => {
  const nodes: cytoscape.ElementDefinition[] = rawJSON.nodes.map((node) => ({
    group: "nodes",
    data: {
      id: node.id,
      type: node.value.kind,
      value: node.value.value,
    },
  }));

  const edges: cytoscape.ElementDefinition[] = rawJSON.edges.map((edge) => ({
    group: "edges",
    data: {
      source: edge.from,
      target: edge.to,
      count_hpd_registrations: edge.reg_contacts,
    },
  }));

  return nodes.concat(edges);
};

const layout = { name: "cola" };

export const PortfolioGraph: React.FC<{ graphJSON: RawPortfolioJson }> = ({ graphJSON }) => (
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
        },
      },
    ]}
  />
);
