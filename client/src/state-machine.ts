import { createMachine, assign } from "xstate";
import {
  SearchAddressWithoutBbl,
  AddressRecord,
  BuildingInfoRecord,
} from "components/APIDataTypes";
import { NychaData } from "containers/NychaPage";

type WowState =
  | { value: "noData"; context: {} }
  | {
      value: "searchInProgress";
      context: WowContext & { searchAddrParams: SearchAddressWithoutBbl };
    }
  | {
      value: "bblNotFound";
      context: WowContext & { searchAddrParams: SearchAddressWithoutBbl; searchAddrBbl: undefined };
    }
  | {
      value: "portfolioNotFound";
      context: WowContext & {
        searchAddrParams: SearchAddressWithoutBbl;
        searchAddrBbl: string;
        portfolioData: undefined;
        buildingInfo: BuildingInfoRecord;
      };
    }
  | {
      value: "nychaFound";
      context: WowContext & {
        searchAddrParams: SearchAddressWithoutBbl;
        searchAddrBbl: string;
        portfolioData: undefined;
        nychaData: NychaData;
        buildingInfo: BuildingInfoRecord;
      };
    }
  | {
      value: "portfolioFound";
      context: WowContext & {
        searchAddrParams: SearchAddressWithoutBbl;
        searchAddrBbl: string;
        portfolioData: PortfolioData;
      };
    }
  | {
      value: "networkErrorOccurred";
      context: WowContext & { searchAddrParams: SearchAddressWithoutBbl };
    };

type WowEvent =
  | { type: "SEARCH"; address: SearchAddressWithoutBbl }
  | { type: "SELECT_DETAIL_ADDR"; bbl: string }
  | { type: "VIEW_SUMMARY" }
  | { type: "VIEW_TIMELINE" };

type PortfolioData = {
  /** The full set of data for the original search address */
  searchAddr: AddressRecord;
  /**
   * All associated addresses connected to the search address
   * found in our database of HPD registered buildings
   */
  assocAddrs: AddressRecord[];
  /** The address in focus on the Overview Tab and Timeline Tab */
  detailAddr: AddressRecord;
};

interface WowContext {
  /** The original parameters that a user inputs to locate their building on WOW */
  searchAddrParams?: SearchAddressWithoutBbl;
  /** The BBL code found by GeoSearch corresponding with the search address parameters */
  searchAddrBbl?: string;
  /**
   * All data regarding the portfolio of buildings associated with the search address
   * retrieved ONLY if the address's bbl has a matching record in our database of HPD registered buildings
   */
  portfolioData?: PortfolioData;
  /**
   * Secondary building-specific data gathered if we can't find the building address in our
   * database of HPD registered buildings
   */
  buildingInfo?: BuildingInfoRecord;
}

export const wowMachine = createMachine<WowContext, WowEvent, WowState>({
  id: "wow",
  initial: "noData",
  context: {},
  states: {
    noData: {
      on: {
        SEARCH: {
          target: "searchInProgress",
          cond: (ctx, event) => !!event.address.boro && !!event.address.streetname,
          actions: assign((ctx, event) => {
            return { searchAddrParams: event.address };
          }),
        },
      },
    },
    searchInProgress: {},
    searchFound: {},
  },
});
