import { createMachine, assign, DoneInvokeEvent, State, TransitionsConfig } from "xstate";
import {
  SearchAddressWithoutBbl,
  AddressRecord,
  BuildingInfoRecord,
  SummaryStatsRecord,
  SummaryResults,
} from "components/APIDataTypes";
import { NychaData } from "containers/NychaPage";
import APIClient from "components/APIClient";
import { assertNotUndefined } from "util/helpers";
import nycha_bbls from "data/nycha_bbls.json";

import _find from "lodash/find";
import { IndicatorsDataFromAPI } from "components/IndicatorsTypes";
import { reportError } from "error-reporting";

export type WowState =
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
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { timeline: "noData" } };
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { timeline: "pending" } };
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { timeline: "error" } };
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { timeline: "success" } };
      context: WowPortfolioFoundContext & {
        timelineData: IndicatorsDataFromAPI;
      };
    }
  | {
      value: { portfolioFound: { summary: "noData" } };
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { summary: "pending" } };
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { summary: "error" } };
      context: WowPortfolioFoundContext;
    }
  | {
      value: { portfolioFound: { summary: "success" } };
      context: WowPortfolioFoundContext & {
        summaryData: SummaryStatsRecord;
      };
    }
  | {
      value: "networkErrorOccurred";
      context: WowContext & { searchAddrParams: SearchAddressWithoutBbl };
    };

export type WowPortfolioFoundContext = WowContext & {
  searchAddrParams: SearchAddressWithoutBbl;
  searchAddrBbl: string;
  portfolioData: PortfolioData;
};

export type WowEvent =
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

export interface WowContext {
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
  /** NYCHA Public Housing development details (grabbed if the search address is public housing) */
  nychaData?: NychaData;
  /** All data used to render the "Timeline tab" of the Address Page. Updates on any change to `detailAddr` */
  timelineData?: IndicatorsDataFromAPI;
  /** All data used to render the "Summary tab" of the Address Page. Updates on any change to `searchAddr` */
  summaryData?: SummaryStatsRecord;
}

type WowMachineEverything = State<WowContext, WowEvent, any, WowState>;

type WowMachineInState<
  TSV extends WowStateByAnotherName["value"],
  /**
   * I have no idea why this type has to be parametrized
   * since we never change this default, hence the name. -AV
   */
  WowStateByAnotherName extends WowState = WowState
> = State<
  (WowStateByAnotherName extends { value: TSV } ? WowStateByAnotherName : never)["context"],
  WowEvent,
  any,
  WowStateByAnotherName
>;

export type WithMachineProps = {
  state: WowMachineEverything;
  send: (event: WowEvent) => WowMachineEverything;
};

export type WithMachineInStateProps<TSV extends WowState["value"]> = {
  state: WowMachineInState<TSV>;
  send: (event: WowEvent) => WowMachineEverything;
};

export function getNychaData(searchBBL: string) {
  const bbl = searchBBL.toString();
  for (var index = 0; index < nycha_bbls.length; index++) {
    if (nycha_bbls[index].bbl.toString() === bbl) return nycha_bbls[index];
  }
  return null;
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
    const nychaData = getNychaData(apiResults.geosearch.bbl);

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

const assignWowStateContext = assign((ctx: WowContext, event: DoneInvokeEvent<WowState>) => {
  return { ...event.data.context };
});

const handleSearchEvent: TransitionsConfig<WowContext, WowEvent> = {
  SEARCH: {
    target: "searchInProgress",
    cond: (ctx, event) => !!event.address.boro && !!event.address.streetname,
    actions: assign((ctx, event) => {
      return { searchAddrParams: event.address, summaryData: undefined, timelineData: undefined };
    }),
  },
};

function reportEventError(context: unknown, event: DoneInvokeEvent<any>) {
  reportError(event.data);
}

export const wowMachine = createMachine<WowContext, WowEvent, WowState>({
  id: "wow",
  initial: "noData",
  context: {},
  states: {
    noData: {
      on: {
        ...handleSearchEvent,
      },
    },
    searchInProgress: {
      on: {
        ...handleSearchEvent,
      },
      invoke: {
        id: "geosearch",
        src: (ctx, event) => getSearchResult(assertNotUndefined(ctx.searchAddrParams)),
        onDone: [
          {
            target: "bblNotFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) => event.data.value === "bblNotFound",
            actions: assignWowStateContext,
          },
          {
            target: "nychaFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) => event.data.value === "nychaFound",
            actions: assignWowStateContext,
          },
          {
            target: "unregisteredFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) =>
              event.data.value === "unregisteredFound",
            actions: assignWowStateContext,
          },
          {
            target: "portfolioFound",
            cond: (ctx, event: DoneInvokeEvent<WowState>) => event.data.value === "portfolioFound",
            actions: assignWowStateContext,
          },
        ],
        onError: {
          target: "networkErrorOccurred",
          actions: [reportEventError],
        },
      },
    },
    bblNotFound: {
      on: {
        ...handleSearchEvent,
      },
    },
    nychaFound: {
      on: {
        ...handleSearchEvent,
      },
    },
    unregisteredFound: {
      on: {
        ...handleSearchEvent,
      },
    },
    portfolioFound: {
      type: "parallel",
      states: {
        timeline: {
          initial: "noData",
          states: {
            noData: {},
            pending: {
              invoke: {
                id: "timeline",
                src: (ctx, event) =>
                  APIClient.getIndicatorHistory(
                    assertNotUndefined(ctx.portfolioData).detailAddr.bbl
                  ),
                onDone: {
                  target: "success",
                  actions: assign({
                    timelineData: (ctx, event: DoneInvokeEvent<IndicatorsDataFromAPI>) => {
                      return event.data;
                    },
                  }),
                },
                onError: {
                  target: "error",
                  actions: [reportEventError],
                },
              },
            },
            error: {},
            success: {},
          },
        },
        summary: {
          initial: "noData",
          states: {
            noData: {},
            pending: {
              invoke: {
                id: "summary",
                src: (ctx, event) =>
                  APIClient.getAggregate(assertNotUndefined(ctx.portfolioData).detailAddr.bbl),
                onDone: {
                  target: "success",
                  actions: assign({
                    summaryData: (ctx, event: DoneInvokeEvent<SummaryResults>) => {
                      return event.data.result[0];
                    },
                  }),
                },
                onError: {
                  target: "error",
                  actions: [reportEventError],
                },
              },
            },
            error: {},
            success: {},
          },
        },
      },
      on: {
        ...handleSearchEvent,
        VIEW_TIMELINE: {
          target: [".timeline.pending"],
        },
        VIEW_SUMMARY: {
          target: [".summary.pending"],
        },
        SELECT_DETAIL_ADDR: {
          target: [".timeline.noData"],
          actions: assign((ctx, event) => {
            const portfolioData = assertNotUndefined(ctx.portfolioData);
            const newDetailAddr = assertNotUndefined(
              _find(portfolioData.assocAddrs, { bbl: event.bbl })
            );
            return {
              portfolioData: {
                ...portfolioData,
                detailAddr: newDetailAddr,
              },
            };
          }),
        },
      },
    },
    networkErrorOccurred: {},
  },
});
