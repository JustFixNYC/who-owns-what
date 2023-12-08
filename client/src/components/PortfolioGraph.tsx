import React, { useEffect } from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
// @ts-ignore
import fcose from "cytoscape-fcose";
import { AddressRecord, PortfolioGraphNode, RawPortfolioGraphJson } from "./APIDataTypes";
import { withMachineInStateProps } from "state-machine";
import helpers from "util/helpers";
import { t, Trans } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import { I18n } from "@lingui/core";
import browser from "util/browser";
import { logAmplitudeEvent } from "./Amplitude";

Cytoscape.use(fcose);

const layout = {
  name: "fcose",
  nodeDimensionsIncludeLabels: true,
  animate: false,
  quality: "default",
  idealEdgeLength: 100,
  nodeSeparation: 300,
  nodeRepulsion: () => 45000,
};

function createNode(
  id: string,
  type: "searchaddr" | "detailaddr" | "owner",
  name: string,
  bizAddr: string,
  bbls?: string[],
  parent?: string
): cytoscape.NodeDefinition {
  return {
    group: "nodes",
    data: {
      id,
      parent,
      type,
      name,
      bizAddr,
      bbls,
    },
  };
}

// function createParentNode(
//   id: string,
//   type: "name" | "bizaddr",
//   value: string
// ): cytoscape.NodeDefinition {
//   return {
//     group: "nodes",
//     data: {
//       id,
//       type,
//       value,
//     },
//   };
// }

function createEdge(source: string, target: string, type: string): cytoscape.EdgeDefinition {
  return {
    group: "edges",
    data: {
      source,
      target,
      type,
    },
  };
}

/**
 * Generates one node for the search BBL and one for the detail BBL to show on the portfolio graph.
 */
function generateAdditionalNodes(
  i18n: I18n,
  searchAddr: AddressRecord,
  detailAddr?: AddressRecord
) {
  var additionalNodes = [];
  const searchBBLNode = createNode(
    "searchaddr",
    "searchaddr",
    i18n._(t`Search Address`),
    `${searchAddr.housenumber} ${searchAddr.streetname}`
  );
  additionalNodes.push(searchBBLNode);

  if (detailAddr) {
    const detailBBLNode = createNode(
      "detailaddr",
      "detailaddr",
      i18n._(t`Selected Address`),
      `${searchAddr.housenumber} ${searchAddr.streetname}`
    );
    additionalNodes.push(detailBBLNode);
  }

  // const testParentNodeBizAddr = createParentNode(
  //   "31-10 37 AVENUE 500, QUEENS NY",
  //   "bizaddr",
  //   "31-10 37 AVENUE 500, QUEENS NY"
  // );
  // const testParentNodeName = createParentNode(
  //   "EFSTAHIOS VALIOTIS",
  //   "name",
  //   i18n._(t`EFSTAHIOS VALIOTIS`)
  // );
  // additionalNodes.push(testParentNodeBizAddr, testParentNodeName);

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
  const landlordMatches = existingNodes.filter((node) => node.value.bbls.includes(addr.bbl));
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
    createEdge(id, "searchaddr", "property")
  );
  additionalEdges = additionalEdges.concat(searchBBLEdges);
  if (detailAddr) {
    const detailBBLEdges = getLandlordNodeIDFromAddress(existingNodes, detailAddr).map((id) =>
      createEdge(id, "detailaddr", "property")
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
  let nodes: cytoscape.ElementDefinition[] = rawJSON.nodes.map((node) => {
    return createNode(
      node.id.toString(),
      "owner",
      node.value.name,
      node.value.bizAddr,
      node.value.bbls
      // node.value.bizAddr === "31-10 37 AVENUE 500, QUEENS NY"
      //   ? "31-10 37 AVENUE 500, QUEENS NY"
      //   : node.value.name === "EFSTAHIOS VALIOTIS"
      //   ? "EFSTAHIOS VALIOTIS"
      //   : undefined
    );
  });
  nodes = nodes.concat(additionalNodes);

  let edges: cytoscape.ElementDefinition[] = rawJSON.edges.map((edge) =>
    createEdge(edge.from.toString(), edge.to.toString(), edge.type)
  );
  edges = edges.concat(additionalEdges);
  return nodes.concat(edges);
};

const OWNER_COLOR = "#676565"; // justfix-grey-dark
const NAME_COLOR = "#1aa551"; // justfix-green
const BIZADDR_COLOR = "#5188ff"; // justfix-blue
const PROPERTY_COLOR = "#9a9898"; // justfix-grey
const SEARCH_ADDR_COLOR = "#FF5722"; // search-marker (map)
const SELECTED_ADDR_COLOR = "#ff9800"; // assoc-marker (map)
const JUSTFIX_WHITE = "#faf8f4";

type PortfolioGraphProps = withI18nProps &
  Pick<withMachineInStateProps<"portfolioFound">, "state"> & {
    graphJSON: RawPortfolioGraphJson;
  };

const PortfolioGraphWithoutI18: React.FC<PortfolioGraphProps> = ({ graphJSON, state, i18n }) => {
  const { searchAddr, detailAddr, assocAddrs } = state.context.portfolioData;
  const portfolioSize = assocAddrs.length;
  const distinctDetailAddr = !helpers.addrsAreEqual(searchAddr, detailAddr)
    ? detailAddr
    : undefined;
  const additionalNodes = generateAdditionalNodes(i18n, searchAddr, distinctDetailAddr);
  const additionalEdges = generateAdditionalEdges(graphJSON.nodes, searchAddr, distinctDetailAddr);

  const isMobile = browser.isMobile();

  const ZOOM_LEVEL_INCREMENT = 2;
  const ZOOM_ANIMATION_DURATION = 100;

  let myCyRef: Cytoscape.Core;
  /**
   * This function resets the layout of our Cytoscape graph.
   * Until we have our graph initialized, this is defined as an empty function.
   */
  let resetLayout: () => void = () => {
    return;
  };

  /**
   * Every time we update the detail address, let's rerun our graph layout so make sure
   * the new node for the detail address fits in nicely with the other existing nodes.
   */
  useEffect(() => {
    if (searchAddr.bbl !== detailAddr.bbl) {
      resetLayout();
    }
  }, [searchAddr.bbl, detailAddr.bbl]);

  return (
    <div className="portfolio-graph">
      <div className="float-left">
        <span
          style={{
            color: NAME_COLOR,
          }}
        >
          ● <Trans>Owner Names</Trans>
        </span>{" "}
        <span
          style={{
            color: BIZADDR_COLOR,
          }}
        >
          ● <Trans>Business Addresses</Trans>
        </span>
      </div>
      <div className="btn-group btn-group-block">
        <button
          className="btn btn-action"
          aria-label={i18n._(t`Zoom in`)}
          onClick={() => {
            logAmplitudeEvent("zoomInNetworkViz", {
              portfolioSize: portfolioSize,
            });
            window.gtag("event", "zoom-in-network-viz");
            myCyRef.animate(
              {
                zoom: myCyRef.zoom() * ZOOM_LEVEL_INCREMENT,
              },
              {
                duration: ZOOM_ANIMATION_DURATION,
              }
            );
          }}
        >
          +
        </button>
        <button
          className="btn btn-action"
          aria-label={i18n._(t`Zoom out`)}
          onClick={() => {
            logAmplitudeEvent("zoomOutNetworkViz", {
              portfolioSize: portfolioSize,
            });
            window.gtag("event", "zoom-out-network-viz");
            myCyRef.animate(
              {
                zoom: myCyRef.zoom() / ZOOM_LEVEL_INCREMENT,
              },
              {
                duration: ZOOM_ANIMATION_DURATION,
              }
            );
          }}
        >
          -
        </button>
        <button
          className="btn btn-action"
          aria-label={i18n._(t`Reset diagram`)}
          onClick={() => {
            logAmplitudeEvent("resetNetworkViz", {
              portfolioSize: portfolioSize,
            });
            window.gtag("event", "reset-network-viz");
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
          // Let's fit the graph to the viewport on render:
          myCyRef.fit();
          // Let's define a function to reset our graph layout, used above:
          resetLayout = () => {
            myCyRef.makeLayout(layout).run();
          };
        }}
        stylesheet={[
          {
            selector: "node",
            style: {
              label: (ele: Cytoscape.NodeSingular) => `${ele.data("name")}\n${ele.data("bizAddr")}`,
              "text-outline-color": JUSTFIX_WHITE,
              "text-outline-width": 3,
              "text-outline-opacity": 0.8,
              width: (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "owner"
                  ? (ele.data("bbls").length / portfolioSize) * 70 + 10
                  : 30,
              height: (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "owner"
                  ? (ele.data("bbls").length / portfolioSize) * 70 + 10
                  : 30,
              shape: (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "owner" ? "ellipse" : "round-rectangle",
              "text-wrap": "wrap",
              "text-max-width": "200px",
              "font-size": (ele: Cytoscape.NodeSingular) =>
                ele.data("type") === "property" ? "16px" : "18px",
              "font-weight": (ele: Cytoscape.NodeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("type")) ? 700 : 400,
              "font-family": "Inconsolata, monospace",
              backgroundColor: (ele) => NODE_TYPE_TO_COLOR[ele.data("type")],
              // "background-opacity": (ele: Cytoscape.NodeSingular) =>
              //   ["searchaddr", "detailaddr"].includes(ele.data("type")) ? 0 : 1,
              "min-zoomed-font-size": 10,
            },
          },
          {
            selector: "edge",
            style: {
              "line-color": (ele: Cytoscape.EdgeSingular) => EDGE_TYPE_TO_COLOR[ele.data("type")],
              "line-style": (ele: Cytoscape.EdgeSingular) =>
                ["searchaddr", "detailaddr"].includes(ele.data("target"))
                  ? "solid"
                  : ele.data("type") === "bizaddr"
                  ? "dashed"
                  : "dotted",
            },
          },
          // {
          //   selector: "node > node",
          //   style: {
          //     label: (ele: Cytoscape.NodeSingular) =>
          //       ele.parent()[0].data("type") === "name"
          //         ? ele.data("bizAddr")
          //         : ele.data("name"),
          //   },
          // },
          // {
          //   selector: "$node > node",
          //   style: {
          //     label: (ele: Cytoscape.NodeSingular) => ele.data("value"),
          //     backgroundColor: (ele) => NODE_TYPE_TO_COLOR[ele.data("type")],
          //     "background-opacity": 0.3,
          //     "border-width": 0,
          //     "font-weight": 700,
          //   },
          // },
        ]}
      />
      <br />
    </div>
  );
};

export const PortfolioGraph = withI18n()(PortfolioGraphWithoutI18);

const NODE_TYPE_TO_COLOR: Record<string, string> = {
  owner: OWNER_COLOR,
  searchaddr: SEARCH_ADDR_COLOR,
  detailaddr: SELECTED_ADDR_COLOR,
  name: NAME_COLOR,
  bizaddr: BIZADDR_COLOR,
};

const EDGE_TYPE_TO_COLOR: Record<string, string> = {
  name: NAME_COLOR,
  bizaddr: BIZADDR_COLOR,
  property: PROPERTY_COLOR,
};
