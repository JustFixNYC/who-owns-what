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
  idealEdgeLength: 100,
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
 */
function generateAdditionalNodes(searchAddr: AddressRecord, detailAddr?: AddressRecord) {
  var additionalNodes = [];
  const searchBBLNode = createNode(
    "searchaddr",
    "searchaddr",
    `SEARCH ADDRESS: ${searchAddr.housenumber} ${searchAddr.streetname}`
  );
  additionalNodes.push(searchBBLNode);

  if (detailAddr) {
    const detailBBLNode = createNode(
      "detailaddr",
      "detailaddr",
      `SELECTED ADDRESS: ${detailAddr.housenumber} ${detailAddr.streetname}`
    );
    additionalNodes.push(detailBBLNode);
  }
  return additionalNodes;
}

/**
 * Given an existing array of graph nodes and an Address Record, this function
 * finds the `id` property of a node of type `name` that corresponds to the owner
 * (or owners) listed with the address.
 */
export function getLandlordNodeIDFromAddress(
  existingNodes: PortfolioGraphNode[],
  addr: AddressRecord
) {
  const landlordNames = helpers.getLandlordNameFromAddress(addr);
  const landlordMatches = existingNodes.filter(
    (node) => node.value.kind === "name" && landlordNames.includes(node.value.value)
  );
  return landlordMatches.map((node) => node.id.toString());
}

/**
 * Given the existing array of graph nodes, this function generates an edge from search BBL to its corresponding owner name,
 * as well as an edge from the detail BBL to its corresponding owner name.
 *
 * Note: in rare edge cases, there may be more than one corresponding owner name for a given BBL.
 * In these cases, multiple edges may be created here.
 */
function generateAdditionalEdges(
  existingNodes: PortfolioGraphNode[],
  searchAddr: AddressRecord,
  detailAddr?: AddressRecord
) {
  let additionalEdges: Cytoscape.EdgeDefinition[] = [];
  const searchBBLEdges = getLandlordNodeIDFromAddress(existingNodes, searchAddr).map((id) =>
    createEdge(id, "searchaddr")
  );
  additionalEdges = additionalEdges.concat(searchBBLEdges);
  if (detailAddr) {
    const detailBBLEdges = getLandlordNodeIDFromAddress(existingNodes, detailAddr).map((id) =>
      createEdge(id, "detailaddr")
    );
    additionalEdges = additionalEdges.concat(detailBBLEdges);
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
    <>
      <div className="float-left">
        <span
          style={{
            color: "red",
          }}
        >
          ● Landlords
        </span>{" "}
        <span
          style={{
            color: "gray",
          }}
        >
          ● Business Addresses
        </span>
      </div>
      <CytoscapeComponent
        elements={formatGraphJSON(graphJSON, additionalNodes, additionalEdges)}
        style={{ width: "100%", height: "60vh" }}
        layout={layout}
        stylesheet={[
          {
            selector: "node",
            style: {
              label: "data(value)",
              width: (ele: Cytoscape.NodeSingular) => (ele.data("type") === "bizaddr" ? 20 : 30),
              height: (ele: Cytoscape.NodeSingular) => (ele.data("type") === "bizaddr" ? 20 : 30),
              "text-wrap": "wrap",
              "text-max-width": "200px",
              "font-size": (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "bizaddr" ? "12px" : "15px",
              "font-weight": (ele: Cytoscape.NodeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("type")) ? 700 : 400,
              "font-family": "Inconsolata, monospace",
              backgroundColor: (ele) => NODE_TYPE_TO_COLOR[ele.data("type")],
              "min-zoomed-font-size": 16,
            },
          },
          {
            selector: "edge",
            label: "data(count_hpd_registrations)",
            "min-zoomed-font-size": 16,
            style: {
              "line-color": (ele: Cytoscape.EdgeSingular) =>
                ele.data("target") === "searchaddr"
                  ? "orange"
                  : ele.data("target") === "detailaddr"
                  ? "yellow"
                  : "default",
            },
          },
        ]}
      />
      <br />
    </>
  );
};

const NODE_TYPE_TO_COLOR: Record<string, string> = {
  name: "red",
  bizaddr: "gray",
  searchaddr: "orange",
  detailaddr: "yellow",
};
