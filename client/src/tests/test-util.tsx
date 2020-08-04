import { Interpreter, State, EventObject, StateSchema, Typestate } from "xstate";
import { MockResponseInit } from "jest-fetch-mock/types";

/**
 * Wait until a XState interpreter's state matches the given one,
 * and return it.
 *
 * If the interpreter's current state matches the given one, return
 * it immediately.
 */
export async function waitUntilStateMatches<
  TContext,
  TSV extends TTypestate["value"],
  TEvent extends EventObject = EventObject,
  TStateSchema extends StateSchema<TContext> = any,
  TTypestate extends Typestate<TContext> = {
    value: any;
    context: TContext;
  }
>(
  wm: Interpreter<TContext, any, TEvent, TTypestate>,
  match: TSV
): Promise<
  State<
    (TTypestate extends { value: TSV } ? TTypestate : never)["context"],
    TEvent,
    any,
    TTypestate
  >
> {
  return new Promise((resolve, reject) => {
    function handleTransition(state: State<TContext, TEvent, any, TTypestate>) {
      if (state.matches(match)) {
        wm.off(handleTransition);
        resolve(state);
      }
    }

    wm.onTransition(handleTransition);
    handleTransition(wm.state);
  });
}

/**
 * Create a jest-fetch-mock JSON response with the given payload.
 */
export function mockJsonResponse<T>(value: T): MockResponseInit {
  return {
    body: JSON.stringify(value),
    headers: { "Content-Type": "application/json" },
    status: 200,
  };
}
