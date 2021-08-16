import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import cola from "cytoscape-cola";
import _samplePortfolioGraph from "../data/sample-portfolio-graph.json";

Cytoscape.use(cola);

const elements = JSON.parse(_samplePortfolioGraph);

type RawPortfolioJson = {
  title: string;
  nodes: any[];
  edges: any[];
};

const formatGraphJSON = (rawJSON: RawPortfolioJson): cytoscape.ElementDefinition[] => {
  const nodes: cytoscape.ElementDefinition[] = rawJSON.nodes.map((node) => ({
    group: "nodes",
    data: {
      id: node.id,
      type: node.value.Name ? "landlord" : "bizaddress",
      value: node.value.Name || node.value.BizAddr,
    },
  }));

  const edges: cytoscape.ElementDefinition[] = rawJSON.edges.map((edge) => ({
    group: "edges",
    data: {
      source: edge.from,
      target: edge.to,
      count_hpd_registrations: edge.reg_contacts,
      is_bridge: edge.is_bridge,
      sample_bbl: edge.bbl,
    },
  }));

  return nodes.concat(edges);
};

const layout = { name: "cola" };

export const PortfolioGraph: React.FC<{}> = () => (
  <CytoscapeComponent
    elements={formatGraphJSON(elements)}
    style={{ width: "600px", height: "600px" }}
    layout={layout}
    stylesheet={[
      {
        selector: "node",
        style: {
          label: "data(value)",
          backgroundColor: (ele) => (ele.data("type") === "landlord" ? "red" : "green"),
        },
      },
    ]}
  />
);
