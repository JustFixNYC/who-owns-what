import { PortfolioGraphNode } from "./APIDataTypes";
import { getLandlordNodeIDFromAddress } from "./PortfolioGraph";
import { SAMPLE_ADDRESS_RECORDS } from "../state-machine-sample-data";

const sampleNodes: PortfolioGraphNode[] = [
  {
    id: 1,
    value: {
      name: "MOSES GUTMAN",
      bizAddr: "101 MAIN ST QUEENS",
      bbls: ["1000010001", "1000010002"]
    },
  },
  {
    id: 2,
    value: {
      name: "MOSES GUTMAN",
      bizAddr: "101 MAIN ST 2FL QUEENS",
      bbls: ["1000010003"]
    },
  },
  {
    id: 3,
    value: {
      name: "MOSES GUTTMAN",
      bizAddr: "101 MAIN ST 2FL QUEENS",
      bbls: ["1000010004", "1000010005", "1000010006"]
    },
  },
];

describe("getLandlordNodeIDFromAddress()", () => {
  it("correctly identifies a node ID", () => {
    expect(getLandlordNodeIDFromAddress(sampleNodes, SAMPLE_ADDRESS_RECORDS[0])).toEqual(["1"]);
  });
  it("returns an empty array if no matching nodes are found", () => {
    expect(getLandlordNodeIDFromAddress(sampleNodes, SAMPLE_ADDRESS_RECORDS[1])).toEqual([]);
  });
  it("can find multiple node IDs if there are multiple matches ", () => {
    expect(
      getLandlordNodeIDFromAddress(sampleNodes, {
        ...SAMPLE_ADDRESS_RECORDS[0],
        ownernames: [
          { title: "CorporateOwner", value: "MOSES GUTMAN" },
          { title: "IndividualOwner", value: "BOOP JONES" },
          { title: "Agent", value: "IRRELEVANT TOM" },
        ],
      })
    ).toEqual(["1", "2"]);
  });
});
