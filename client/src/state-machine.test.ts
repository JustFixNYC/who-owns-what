import { wowMachine } from "./state-machine";
import { interpret } from "xstate";

describe("wowMachine", () => {
  it("should start with no data", () => {
    const wm = interpret(wowMachine);
    wm.start();
    expect(wm.state.value).toBe("noData");
  });
});
