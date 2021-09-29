import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import fcose from "cytoscape-fcose";
import { AddressRecord, RawPortfolioGraphJson } from "./APIDataTypes";
import { withMachineInStateProps } from "state-machine";
import helpers from "util/helpers";

Cytoscape.use(fcose);

const formatGraphJSON = (
  rawJSON: RawPortfolioGraphJson,
  additionalNodes: Cytoscape.NodeDefinition[],
  additionalEdges: Cytoscape.EdgeDefinition[]
): cytoscape.ElementDefinition[] => {
  let nodes: cytoscape.ElementDefinition[] = rawJSON.nodes.map((node) => createNode(
    node.id.toString(),
    node.value.kind,
    node.value.value)
  );
  nodes = nodes.concat(additionalNodes);

  const edges: cytoscape.ElementDefinition[] = rawJSON.edges.map((edge) =>
    createEdge(edge.from.toString(), edge.to.toString(), edge.reg_contacts)
  );
  nodes = edges.concat(additionalEdges);
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

type PortfolioGraphProps = withMachineInStateProps<"portfolioFound"> & {
  graphJSON: RawPortfolioGraphJson;
};

function createNode(id: string, type: string, value: string): cytoscape.NodeDefinition {
  return {
    group: "nodes",
    data: {
      id,
      type,
      value,
    },
  };
}

function createEdge(
  source: string,
  target: string,
  count_hpd_registrations: number=1
): cytoscape.EdgeDefinition {
  return {
    group: "edges",
    data: {
      source,
      target,
      count_hpd_registrations,
    },
  };
}

/**
 * Generates one node for the search BBL and one for the detail BBL to show on the portfolio graph.
 * @param searchAddr 
 * @param detailAddr 
 * @returns 
 */
function generateAdditionalNodes(searchAddr: AddressRecord, detailAddr?: AddressRecord) {
  var additionalNodes = [];
  const searchBBLNode = createNode(
    "searchaddr",
    "searchaddr",
    `${searchAddr.housenumber} ${searchAddr.streetname}, ${searchAddr.boro}`
  );
  additionalNodes.push(searchBBLNode);

  if (detailAddr) {
    const detailBBLNode = createNode(
      "detailaddr",
      "detailaddr",
      `${detailAddr.housenumber} ${detailAddr.streetname}, ${detailAddr.boro}`
    );
    additionalNodes.push(detailAddr);
  }
  return additionalNodes;
}

function getLandlordNodeIDFromAddress(addr: AddressRecord, landlordNodes: RawPortfolioGraphJson) {
  const ll_name = helpers.getLandlordNameFromAddress(addr);
  // TODO: look through landlordNodes to find the one that matches LL_name, return that 
}

function generateAdditionalEdges(searchAddr: AddressRecord, detailAddr?: AddressRecord) {
  var additionalEdges = [];
  const searchBBLEdge = createEdge(
    getLandlordNodeIDFromAddress(searchAddr),
    'searchAddr'
  );
  additionalEdges.push(searchBBLEdge);
  if (detailAddr) {
    const detailBBLEdge = createEdge(
      getLandlordNodeIDFromAddress(detailAddr),
      'detailaddr' 
    );
    additionalEdges.push(detailBBLEdge);
  }
  return additionalEdges;
}



export const PortfolioGraph: React.FC<PortfolioGraphProps> = ({ graphJSON, state }) => {
  const { searchAddr, detailAddr } = state.context.portfolioData;
  const additionalNodes = generateAdditionalNodes(searchAddr, detailAddr);
  const additionalEdges = generateAdditionalEdges(searchAddr, detailAddr);

  return (
    <CytoscapeComponent
      elements={formatGraphJSON(graphJSON, additionalNodes, additionalEdges)}
      style={{ width: "900px", height: "600px" }}
      layout={layout}
      stylesheet={[
        {
          selector: "node",
          style: {
            label: "data(value)",
            backgroundColor: (ele) => (NODE_TYPE_TO_COLOR[ele.data("type")]),
            "min-zoomed-font-size": 16,
          },
        },
      ]}
    />
  );
};

const NODE_TYPE_TO_COLOR:Record<string,string> = {
  'name': 'red',
  'bizaddr': 'green',
  'searchaddr': 'orange',
  'detailaddr': 'yellow',
};