import { wowMachine, WowEvent } from "./state-machine";
import { interpret } from "xstate";
import { GEO_AUTOCOMPLETE_URL } from "@justfixnyc/geosearch-requester";

const SEARCH_EVENT: WowEvent = {
  type: "SEARCH",
  address: {
    housenumber: "150",
    streetname: "court st",
    boro: "BROOKLYN",
  },
};

describe("wowMachine", () => {
  it("should deal w/ geosearch network errors", (done) => {
    fetchMock.mockIf(GEO_AUTOCOMPLETE_URL, async (req) => ({
      status: 500,
    }));
    const wm = interpret(wowMachine)
      .onTransition((state) => {
        if (state.matches("networkErrorOccurred")) {
          done();
        }
      })
      .start();
    expect(wm.state.value).toBe("noData");
    wm.send(SEARCH_EVENT);
  });
});
