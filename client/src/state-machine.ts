import { createMachine, assign, DoneInvokeEvent } from "xstate";
import {
  SearchAddressWithoutBbl,
  AddressRecord,
  BuildingInfoRecord
} from "components/APIDataTypes";
import { NychaData } from "containers/NychaPage";
import APIClient from "components/APIClient";
import helpers, { assertNotUndefined } from "util/helpers";

import _find from "lodash/find";

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
      value: "unregisteredFound";
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

async function getSearchResult(addr: SearchAddressWithoutBbl): Promise<WowState> {
  const apiResults = await APIClient.searchForAddressWithGeosearch(addr);
  if (!apiResults.geosearch) {
    return {
      value: "bblNotFound",
      context: { searchAddrParams: addr, searchAddrBbl: undefined },
    };
  } else if (apiResults.addrs.length === 0) {
    const buildingInfoResults = await APIClient.getBuildingInfo(apiResults.geosearch.bbl);
    const nychaData = helpers.getNychaData(apiResults.geosearch.bbl);

    return nychaData
      ? {
          value: "nychaFound",
          context: {
            searchAddrParams: addr,
            searchAddrBbl: apiResults.geosearch.bbl,
            portfolioData: undefined,
            nychaData,
            buildingInfo: buildingInfoResults.result[0],
          },
        }
      : {
          value: "unregisteredFound",
          context: {
            searchAddrParams: addr,
            searchAddrBbl: apiResults.geosearch.bbl,
            portfolioData: undefined,
            buildingInfo: buildingInfoResults.result[0],
          },
        };
  } else {
    const searchAddr = _find(apiResults.addrs, { bbl: apiResults.geosearch.bbl });
    if (!searchAddr) {
      throw new Error("The user's address was not found in the API Address Search results!");
    }
    return {
      value: "portfolioFound",
      context: {
        searchAddrParams: addr,
        searchAddrBbl: apiResults.geosearch.bbl,
        portfolioData: {
          searchAddr,
          detailAddr: searchAddr,
          assocAddrs: apiResults.addrs,
        },
      },
    };
  }
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
    searchInProgress: {
      invoke: {
        id: "geosearch",
        src: (ctx, event) => getSearchResult(assertNotUndefined(ctx.searchAddrParams)),
        onDone: [
          {
            target: "bblNotFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) => event.data.value === "bblNotFound",
            actions: assign((ctx, event: DoneInvokeEvent<WowState>) => {
              return { ...event.data.context };
            }),
          },
          {
            target: "nychaFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) => event.data.value === "nychaFound",
            actions: assign((ctx, event: DoneInvokeEvent<WowState>) => {
              return { ...event.data.context };
            }),
          },
          {
            target: "unregisteredFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) =>
              event.data.value === "unregisteredFound",
            actions: assign((ctx, event: DoneInvokeEvent<WowState>) => {
              return { ...event.data.context };
            }),
          },
          {
            target: "portfolioFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) =>
              event.data.value === "portfolioFound",
            actions: assign((ctx, event: DoneInvokeEvent<WowState>) => {
              return { ...event.data.context };
            }),
          },
        ],
      },
    },
    bblNotFound: {},
    nychaFound: {},
    unregisteredFound: {},
    portfolioFound: {},
  },
});
