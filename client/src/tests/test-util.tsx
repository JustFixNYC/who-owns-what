import { WowState, WowContext, WowEvent } from "state-machine";
import { Interpreter, State } from "xstate";

export async function waitUntilStateMatches<
  TSV extends WowStateByAnotherName["value"],
  /**
   * I have no idea why this type has to be parametrized
   * since we never change this default, hence the name. -AV
   */
  WowStateByAnotherName extends WowState = WowState
>(
  wm: Interpreter<WowContext, any, WowEvent, WowState>,
  match: TSV
): Promise<
  State<
    (WowStateByAnotherName extends { value: TSV } ? WowStateByAnotherName : never)["context"],
    WowEvent,
    any,
    WowStateByAnotherName
  >
> {
  return new Promise((resolve, reject) => {
    function handleTransition(state: State<WowContext, WowEvent, any, WowState>) {
      if (state.matches(match)) {
        wm.off(handleTransition);
        resolve(state);
      }
    }

    wm.onTransition(handleTransition);
    handleTransition(wm.state);
  });
}
