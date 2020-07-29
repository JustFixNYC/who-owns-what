import { Machine } from "xstate";
import { SearchAddressWithoutBbl, AddressRecord } from "components/APIDataTypes";

interface WowStateSchema {
  states: {
    noData: {};
  };
}

type WowEvent =
  | { type: "SEARCH"; address: SearchAddressWithoutBbl }
  | { type: "SELECT_DETAIL_ADDR"; bbl: string }
  | { type: "VIEW_SUMMARY" }
  | { type: "VIEW_TIMELINE" };

interface WowContext {
  /** The original parameters that a user inputs to locate their building on WOW */
  searchAddrParams?: SearchAddressWithoutBbl;
  /** The BBL code found by GeoSearch corresponding with the search address parameters */
  searchAddrBbl?: string;
  /**
   * The full set of data for the search address,
   * retrieved ONLY if the address's bbl has a matching record
   * in our database of HPD registered buildings
   */
  searchAddr?: AddressRecord;
  /**
   * All associated addresses connected to the search address
   * found in our database of HPD registered buildings
   */
  assocAddrs?: AddressRecord[];
  /** The address in focus on the Overview Tab and Timeline Tab */
  detailAddr?: AddressRecord;
}

const wowMachine = Machine<WowContext, WowStateSchema, WowEvent>({
  id: "wow",
  initial: "noData",
  states: {
    noData: {},
  },
});
