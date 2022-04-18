import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import fcose from "cytoscape-fcose";
import { AddressRecord, PortfolioGraphNode, RawPortfolioGraphJson } from "./APIDataTypes";
import { withMachineInStateProps } from "state-machine";
import helpers from "util/helpers";
import { t, Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import browser from "util/browser";

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
    `OWNS ${searchAddr.housenumber}\n${searchAddr.streetname}`
  );
  additionalNodes.push(searchBBLNode);

  if (detailAddr) {
    const detailBBLNode = createNode(
      "detailaddr",
      "detailaddr",
      `OWNS ${detailAddr.housenumber}\n${detailAddr.streetname}`
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

type PortfolioGraphProps = withI18nProps &
  Pick<withMachineInStateProps<"portfolioFound">, "state"> & {
    graphJSON: RawPortfolioGraphJson;
  };

const PortfolioGraphWithoutI18: React.FC<PortfolioGraphProps> = ({ graphJSON, state, i18n }) => {
  const { searchAddr, detailAddr } = state.context.portfolioData;
  const distinctDetailAddr = !helpers.addrsAreEqual(searchAddr, detailAddr)
    ? detailAddr
    : undefined;
  const additionalNodes = generateAdditionalNodes(searchAddr, distinctDetailAddr);
  const additionalEdges = generateAdditionalEdges(graphJSON.nodes, searchAddr, distinctDetailAddr);

  const isMobile = browser.isMobile();

  const ZOOM_LEVEL_INCREMENT = 2;
  const ZOOM_ANIMATION_DURATION = 100;

  let myCyRef: Cytoscape.Core;

  return (
    <div className="portfolio-graph">
      <div className="float-left">
        <span
          style={{
            color: "red",
          }}
        >
          ● <Trans>Owner Names</Trans>
        </span>{" "}
        <span
          style={{
            color: "gray",
          }}
        >
          ● <Trans>Business Addresses</Trans>
        </span>
      </div>
      <div className="btn-group btn-group-block">
        <button
          className="btn btn-action"
          aria-label={i18n._(t`Zoom in`)}
          onClick={() =>
            myCyRef.animate(
              {
                zoom: myCyRef.zoom() * ZOOM_LEVEL_INCREMENT,
              },
              {
                duration: ZOOM_ANIMATION_DURATION,
              }
            )
          }
        >
          +
        </button>
        <button
          className="btn btn-action"
          aria-label={i18n._(t`Zoom out`)}
          onClick={() =>
            myCyRef.animate(
              {
                zoom: myCyRef.zoom() / ZOOM_LEVEL_INCREMENT,
              },
              {
                duration: ZOOM_ANIMATION_DURATION,
              }
            )
          }
        >
          -
        </button>
        <button
          className="btn btn-action"
          aria-label={i18n._(t`Reset diagram`)}
          onClick={() => {
            myCyRef.fit();
          }}
        >
          ⟳
        </button>
      </div>
      <CytoscapeComponent
        elements={formatGraphJSON(graphJSON, additionalNodes, additionalEdges)}
        style={{ width: "100%", height: isMobile ? "40vh" : "55vh" }}
        layout={layout}
        // Enable scroll zoom only on mobile devices:
        userZoomingEnabled={isMobile}
        cy={(cy) => {
          // Get a reference to the Cytoscape object:
          // https://github.com/plotly/react-cytoscapejs#cy-1
          myCyRef = cy;
          myCyRef.fit();
        }}
        stylesheet={[
          {
            selector: "node",
            style: {
              label: "data(value)",
              width: (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "name" ? 30 : ele.data("type") === "bizaddr" ? 20 : 5,
              height: (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "name" ? 30 : ele.data("type") === "bizaddr" ? 20 : 5,
              "text-wrap": "wrap",
              "text-max-width": "200px",
              "font-size": (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "bizaddr" ? "12px" : "15px",
              "font-weight": (ele: Cytoscape.NodeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("type")) ? 700 : 400,
              "font-family": "Inconsolata, monospace",
              backgroundColor: (ele) => NODE_TYPE_TO_COLOR[ele.data("type")],
              color: (ele: Cytoscape.NodeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("type")) ? "orange" : "",
              "background-opacity": (ele: Cytoscape.NodeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("type")) ? 0 : 1,
              "min-zoomed-font-size": 16,
            },
          },
          {
            selector: "edge",
            style: {
              "line-color": (ele: Cytoscape.EdgeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("target")) ? "orange" : "default",
              "line-style": (ele: Cytoscape.EdgeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("target")) ? "dashed" : "solid",
            },
          },
        ]}
      />
      <br />
    </div>
  );
};

export const PortfolioGraph = withI18n()(PortfolioGraphWithoutI18);

const NODE_TYPE_TO_COLOR: Record<string, string> = {
  name: "red",
  bizaddr: "gray",
  searchaddr: "orange",
  detailaddr: "orange",
};
