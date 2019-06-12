/**
 * For documentation about this endpoint, see:
 *
 * https://geosearch.planninglabs.nyc/docs/#autocomplete
 */
const GEO_AUTOCOMPLETE_URL = 'https://geosearch.planninglabs.nyc/v1/autocomplete';

/**
 * The default amount of milliseconds to wait before we actually issue
 * a search request.
 */
const DEFAULT_THROTTLE_MS = 250;

/**
 * The keys here were obtained experimentally, I'm not actually sure
 * if/where they are formally specified.
 */
export enum GeoSearchBoroughGid {
  Manhattan = 'whosonfirst:borough:1',
  Bronx = 'whosonfirst:borough:2',
  Brooklyn = 'whosonfirst:borough:3',
  Queens = 'whosonfirst:borough:4',
  StatenIsland = 'whosonfirst:borough:5',
}

/**
 * This is what the NYC Geosearch API returns from its
 * autocomplete endpoint.
 * 
 * Note that some of the fields are "unknown", which
 * just implies that they exist but we're not really
 * sure what type they are (nor do we particularly
 * care, at the moment, for our purposes).
 */
export interface GeoSearchResults {
  bbox: unknown;
  features: GeoSearchFeature[];
}

export interface GeoSearchFeature {
  geometry: unknown;
  properties: GeoSearchProperties
}

/**
 * Note that these are by no means all the
 * properties, they're just the ones we care about.
 */
export interface GeoSearchProperties {
  /** e.g. "Brooklyn" */
  borough: string;

  /** e.g. "whosonfirst:borough:2" */
  borough_gid: GeoSearchBoroughGid;

  /** e.g. "150" */
  housenumber: string;

  /** e.g. "COURT STREET" */
  street: string;

  /** e.g. "150 COURT STREET" */
  name: string;

  /** e.g. "150 COURT STREET, Brooklyn, New York, NY, USA" */
  label: string;

  pad_bbl: string;
}

/**
 * Return an instance of the platform's AbortController if it's
 * available.
 */
function defaultCreateAbortController(): AbortController|undefined {
  if (typeof(AbortController) !== 'undefined') {
    return new AbortController();
  }
}

/**
 * Options for the requester constructor.
 */
export interface GeoSearchRequesterOptions {
  /**
   * A factory that returns an AbortController [1] instance,
   * or undefined if the platform doesn't support aborting
   * fetch requests.
   * 
   * [1] https://developer.mozilla.org/en-US/docs/Web/API/AbortController
   */
  createAbortController?: () => AbortController|undefined;

  /**
   * A reference to the platform's Fetch API [1]. Note that
   * this will always be called with "this" bound to the
   * global scope.
   * 
   * [1] https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
   */
  fetch?: typeof window.fetch,

  /**
   * The number of milliseconds to wait before we actually issue
   * a search request. This is primarily intended to allow
   * keyboard-based autocomplete UIs to not spam the server
   * when the user is typing quickly.
   */
  throttleMs?: number,

  /**
   * A callback that's called whenever an error occurs fetching
   * autocomplete results.
   */
  onError: (e: Error) => void;

  /**
   * A callback that's called whenever results are fetched for
   * the most recently issued query. This will never be
   * called for stale queries.
   */
  onResults: (results: GeoSearchResults) => void;
}

/**
 * This class can be used to issue search requests
 * based on a query whose value may change over time
 * due to e.g. keyboard input.
 */
export class GeoSearchRequester {
  private requestId: number;
  private abortController?: AbortController;
  private throttleTimeout: number|null;
  private createAbortController: () => AbortController|undefined;

  constructor(readonly options: GeoSearchRequesterOptions) {
    this.requestId = 0;
    this.createAbortController = options.createAbortController || defaultCreateAbortController;
    this.abortController = this.createAbortController();
    this.throttleTimeout = null;
  }

  /**
   * Fetch results for the given query, returning null if the
   * network request was aborted.
   */
  private fetchResults(value: string): Promise<GeoSearchResults|null> {
    const url = `${GEO_AUTOCOMPLETE_URL}?text=${encodeURIComponent(value)}`;

    // It's important that we pull fetch out as its own variable,
    // as this will bind its "this" context to the global scope
    // when it's called, which is important for most/all window.fetch()
    // implementations.
    const fetch = this.options.fetch || window.fetch.bind(window);

    return fetch(url, {
      signal: this.abortController && this.abortController.signal
    }).then(res => res.json()).catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // Don't worry about it, the user just aborted the request.
        return null;
      } else {
        throw e;
      }
    });
  }

  /**
   * Fetch results for the given query, returning null if the
   * query was superseded by a newer one.
   */
  private async fetchResultsForLatestRequest(value: string): Promise<GeoSearchResults|null> {
    const originalRequestId = this.requestId;
    let results = await this.fetchResults(value);
    if (this.requestId === originalRequestId) {
      return results;
    }
    return null;
  }
  
  /**
   * Abort any currently in-flight requests.
   */
  private resetSearchRequest() {
    if (this.throttleTimeout !== null) {
      window.clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
    this.requestId++;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = this.createAbortController();
    }
  }

  /**
   * Change the current search request to a new query. Return
   * whether the new query is non-empty.
   */
  changeSearchRequest(value: string): boolean {
    this.resetSearchRequest();
    if (value.length > 0) {
      this.throttleTimeout = window.setTimeout(() => {
        this.fetchResultsForLatestRequest(value).catch(this.options.onError).then(results => {
          if (results) {
            this.options.onResults(results);
          }
        });
      }, this.options.throttleMs || DEFAULT_THROTTLE_MS);
      return true;
    }
    return false;
  }

  /**
   * Clean up all resources used by the requester.
   */
  shutdown() {
    this.resetSearchRequest();
  }
}