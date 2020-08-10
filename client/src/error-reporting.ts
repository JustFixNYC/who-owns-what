/**
 * A generic network error. It could be because the network is down, or because
 * a server returned a HTTP response like 404 or 500.
 *
 * Note that we need to define this ourselves because `fetch()` will actually
 * reject with a `TypeError` on network failure, which is awfully ambiguous.
 */
export class NetworkError extends Error {
  constructor(message: string, readonly shouldReport: boolean = false) {
    super(message);
  }
}

/**
 * A network error that happened because the HTTP status code is not in
 * the range 200-299.
 */
export class HTTPError extends NetworkError {
  statusText: string;
  status: number;

  constructor(readonly response: Response) {
    super(
      `HTTP Error ${response.statusText}`,
      // If the response status is 4xx, we want to report it
      // because it's our "fault" as a client--i.e., we should change
      // our client-side code to never make the request in the
      // first place.
      response.status >= 400 && response.status < 500
    );
    this.statusText = response.statusText;
    this.status = response.status;
  }
}

/**
 * Report the given error to our error-reporting service, as long
 * as it's not a network error that we think shouldn't be reported.
 *
 * The error can also be a string, in which case it's logged as-is.
 */
export function reportError(error: string | Error) {
  if (error instanceof NetworkError && !error.shouldReport) return;
  console.error(error);
  if (window.Rollbar) {
    window.Rollbar.error(error);
  }
}
