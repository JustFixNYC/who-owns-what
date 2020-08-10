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

export type MockResponseMapping = {
  [url: string]: MockResponseInit | undefined;
};

/**
 * Given an object that maps request URLs to jest-fetch-mock responses,
 * mock fetch so that the appropriate responses are returned when
 * their URLs are requested.
 *
 * If a request is ever made that does *not* map to something in the
 * mapping, an error is raised.
 *
 * If this is called inside a test, remember to call
 * `fetchMock.resetMocks()` between tests!
 */
export function mockResponses(mapping: MockResponseMapping) {
  fetchMock.mockResponse(async (req) => {
    const result = mapping[req.url];
    if (!result) {
      const msg = `Unexpected mock URL: ${req.url}`;
      console.error(msg);
      throw new Error(msg);
    }
    return result;
  });
}
