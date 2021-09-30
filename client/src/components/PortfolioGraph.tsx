import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import fcose from "cytoscape-fcose";
import { AddressRecord, PortfolioGraphNode, RawPortfolioGraphJson } from "./APIDataTypes";
import { withMachineInStateProps } from "state-machine";
import helpers from "util/helpers";

Cytoscape.use(fcose);

const layout = {
  name: "fcose",
  nodeDimensionsIncludeLabels: true,
  animate: false,
  quality: "proof",
  idealEdgeLength: 200,
  nodeSeparation: 300,
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
  count_hpd_registrations: number = 1
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
    additionalNodes.push(detailBBLNode);
  }
  return additionalNodes;
}

function getLandlordNodeIDFromAddress(existingNodes: PortfolioGraphNode[], addr: AddressRecord) {
  const landlordNames = helpers.getLandlordNameFromAddress(addr);
  const landlordMatches = existingNodes.filter(
    (node) => node.value.kind === "name" && landlordNames.includes(node.value.value)
  );
  return landlordMatches.map((node) => node.id.toString());
}

function generateAdditionalEdges(
  existingNodes: PortfolioGraphNode[],
  searchAddr: AddressRecord,
  detailAddr?: AddressRecord
) {
  var additionalEdges: Cytoscape.EdgeDefinition[] = [];
  const searchBBLEdges = getLandlordNodeIDFromAddress(existingNodes, searchAddr).map((id) =>
    createEdge(id, "searchAddr")
  );
  additionalEdges.concat(searchBBLEdges);
  if (detailAddr) {
    const detailBBLEdges = getLandlordNodeIDFromAddress(existingNodes, detailAddr).map((id) =>
      createEdge(id, "detailAddr")
    );
    additionalEdges.concat(detailBBLEdges);
  }
  return additionalEdges;
}

const formatGraphJSON = (
  rawJSON: RawPortfolioGraphJson,
  additionalNodes: Cytoscape.NodeDefinition[],
  additionalEdges: Cytoscape.EdgeDefinition[]
): cytoscape.ElementDefinition[] => {
  let nodes: cytoscape.ElementDefinition[] = rawJSON.nodes.map((node) =>
    createNode(node.id.toString(), node.value.kind, node.value.value)
  );
  nodes = nodes.concat(additionalNodes);

  let edges: cytoscape.ElementDefinition[] = rawJSON.edges.map((edge) =>
    createEdge(edge.from.toString(), edge.to.toString(), edge.reg_contacts)
  );
  edges = edges.concat(additionalEdges);
  return nodes.concat(edges);
};

type PortfolioGraphProps = Pick<withMachineInStateProps<"portfolioFound">, "state"> & {
  graphJSON: RawPortfolioGraphJson;
};

export const PortfolioGraph: React.FC<PortfolioGraphProps> = ({ graphJSON, state }) => {
  const { searchAddr, detailAddr } = state.context.portfolioData;
  const distinctDetailAddr = !helpers.addrsAreEqual(searchAddr, detailAddr)
    ? detailAddr
    : undefined;
  const additionalNodes = generateAdditionalNodes(searchAddr, distinctDetailAddr);
  const additionalEdges = generateAdditionalEdges(graphJSON.nodes, searchAddr, distinctDetailAddr);

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
            backgroundColor: (ele) => NODE_TYPE_TO_COLOR[ele.data("type")],
            "min-zoomed-font-size": 16,
          },
        },
      ]}
    />
  );
};

const NODE_TYPE_TO_COLOR: Record<string, string> = {
  name: "red",
  bizaddr: "green",
  searchaddr: "orange",
  detailaddr: "yellow",
};
