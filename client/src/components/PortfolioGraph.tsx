import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import _samplePortfolioGraph from "../data/sample-portfolio-graph.json";

const elements = JSON.parse(_samplePortfolioGraph);
console.log("Unformatted JSON: ", elements);

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
      type: node.name ? "landlord" : "bizaddress",
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

export const PortfolioGraph: React.FC<{}> = () => (
  <CytoscapeComponent
    elements={formatGraphJSON(elements)}
    style={{ width: "600px", height: "600px" }}
    layout={{ name: "random", rows: 1 }}
    stylesheet={[
      {
        selector: "node",
        style: {
          label: "data(value)",
        },
      },
    ]}
  />
);
