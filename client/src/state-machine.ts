import { createMachine, assign, DoneInvokeEvent, State, TransitionsConfig } from "xstate";
import {
  SearchAddressWithoutBbl,
  AddressRecord,
  BuildingInfoRecord,
  SummaryStatsRecord,
  District,
} from "components/APIDataTypes";
import APIClient from "components/APIClient";
import { assertNotUndefined } from "@justfixnyc/util";
import _find from "lodash/find";
import { IndicatorsDataFromAPI } from "components/IndicatorsTypes";
import { reportError } from "error-reporting";
import { calculateAggDataFromAddressList } from "components/SummaryCalculation";

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
  | { type: "SEARCH"; address: SearchAddressWithoutBbl; useNewPortfolioMethod: boolean }
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

export type BuildingSubscription = {
  bbl: string;
  housenumber: string;
  streetname: string;
  zip: string;
  boro: string;
};

export type DistrictSubscription = {
  district: District;
  pk: string;
};

export type JustfixUser = {
  /** The email address associated with this account */
  email: string;
  /** Whether the user's email address has been verified */
  verified: boolean;
  /** User id for passing to Google Analytics */
  id: number;
  /** User type for passing to Google Analytics */
  type: string;
  /** All buildings the user is subscribed to (email alerts) */
  buildingSubscriptions: BuildingSubscription[];
  /** All districts the user is subscribed to (email alerts) */
  districtSubscriptions: DistrictSubscription[];
  /** Max number of buildings a user can be subscribed to */
  subscriptionLimit: number;
};

export interface WowContext {
  /** The original parameters that a user inputs to locate their building on WOW */
  searchAddrParams?: SearchAddressWithoutBbl;
  /** Whether or not we want to use the new WOWZA graph-based portfolio mapping algorithm
   * to generate the landlord portfolio. */
  useNewPortfolioMethod?: boolean;
  /** The BBL code found by GeoSearch corresponding with the search address parameters */
  searchAddrBbl?: string;
  /**
   * All data regarding the portfolio of buildings associated with the search address
   * retrieved ONLY if the address's bbl has a matching record in our database of HPD registered buildings
   */
  portfolioData?: PortfolioData;
  /**
   * Secondary building-specific data gathered if we can't find the building address in our
   * database of HPD registered buildings. Includes NYCHA Public Housing development details
   * if the building is public housing.
   */
  buildingInfo?: BuildingInfoRecord;
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

export type withMachineProps = {
  state: WowMachineEverything;
  send: (event: WowEvent) => WowMachineEverything;
};

export type withMachineInStateProps<TSV extends WowState["value"]> = {
  state: WowMachineInState<TSV>;
  send: (event: WowEvent) => WowMachineEverything;
};

async function getSearchResult(
  addr: SearchAddressWithoutBbl,
  useNewPortfolioMethod: boolean
): Promise<WowState> {
  const apiResults = await APIClient.searchForAddressWithGeosearch(addr, useNewPortfolioMethod);
  if (!apiResults.geosearch) {
    return {
      value: "bblNotFound",
      context: { searchAddrParams: addr, searchAddrBbl: undefined },
    };
  } else if (apiResults.addrs.length === 0) {
    const buildingInfoResults = await APIClient.getBuildingInfo(apiResults.geosearch.bbl);
    const buildingInfo = buildingInfoResults.result[0];

    if (!buildingInfo) {
      // Apparently PLUTO doesn't have data for some buildings,
      // e.g. 77 Park Avenue (at the time of this writing).
      //
      // For now we'll just respond as though the address is
      // invalid; although that's still far from ideal, at least
      // it won't clog up our error logs...
      return {
        value: "bblNotFound",
        context: { searchAddrParams: addr, searchAddrBbl: undefined },
      };
    }

    return {
      value: buildingInfo.nycha_development ? "nychaFound" : "unregisteredFound",
      context: {
        searchAddrParams: addr,
        searchAddrBbl: apiResults.geosearch.bbl,
        portfolioData: undefined,
        buildingInfo,
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
      return {
        searchAddrParams: event.address,
        useNewPortfolioMethod: event.useNewPortfolioMethod,
        summaryData: undefined,
        timelineData: undefined,
      };
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
        src: (ctx, event) =>
          getSearchResult(
            assertNotUndefined(ctx.searchAddrParams),
            ctx.useNewPortfolioMethod || false
          ),
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
          target: [".summary.success"],
          actions: assign((ctx, event) => {
            const summaryData = calculateAggDataFromAddressList(
              assertNotUndefined(ctx.portfolioData?.assocAddrs)
            );
            return { summaryData };
          }),
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
